import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';

import { AREAS_OF_INTEREST } from './src/data/aoiList';
import { queryCdseStac } from './src/server/providers/cdse';
import { getConstellationGranules } from './src/server/providers/satelliteConstellation';
import { fetchLiveWeather } from './src/server/providers/openmeteo';
import { getGpmRainfallMetrics } from './src/server/providers/nasa';
import { calculateDemMetrics } from './src/server/providers/dem';
import { deriveGeospatialFeatures } from './src/server/engine/featureEngine';
import { runInferencePipeline } from './src/server/engine/mlModels';
import { calculateRiskAssessment, DEFAULT_WEIGHTS } from './src/server/engine/riskEngine';
import { generateXaiExplanation } from './src/server/engine/xaiEngine';
import {
  fetchMapsGroundedInfrastructure,
  fetchSearchGroundedNewsAndAlerts,
} from './src/server/engine/groundingEngine';
import {
  getAllEvents,
  verifyEvent,
  rejectEvent,
  dispatchAlert,
} from './src/server/engine/eventStore';
import {
  getOrchestratorState,
  triggerManualCycle,
  toggleOrchestrator,
} from './src/server/engine/orchestrator';
import { RESEARCH_EXPERIMENTS } from './src/data/experimentsData';

dotenv.config();

const app = express();
app.use(express.json());

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'TerraBreath AI',
    timestamp: new Date().toISOString(),
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
  });
});

// Areas of Interest
app.get('/api/aoi', (_req: Request, res: Response) => {
  res.json({ aois: AREAS_OF_INTEREST });
});

// Full Multi-Source Pipeline for an AOI
app.get('/api/aoi/:id/full-analysis', async (req: Request, res: Response) => {
  try {
    const aoiId = req.params.id;
    const aoi = AREAS_OF_INTEREST.find((a) => a.id === aoiId) || AREAS_OF_INTEREST[0];

    // 1. Copernicus STAC Discovery
    const sentinel1Scene = await queryCdseStac(aoi.bbox, 'sentinel-1-grd');
    const sentinel2Scene = await queryCdseStac(aoi.bbox, 'sentinel-2-l2a');

    // 2. Real-Time Meteorological Telemetry (Open-Meteo)
    const weather = await fetchLiveWeather(aoi.center[0], aoi.center[1]);

    // 3. NASA GPM IMERG Rainfall Intelligence
    const gpm = getGpmRainfallMetrics(aoi.id, weather.rain24hMm);

    // 4. Copernicus DEM GLO-30 Terrain Engine
    const dem = calculateDemMetrics(aoi.id);

    // 5. Geospatial Feature Engineering (SAR backscatter, NDWI, water expansion)
    const features = deriveGeospatialFeatures(aoi.id, gpm.rainfall24hMm);

    // 6. Local AI / ML Inference (Model 0, Model 1, Model 2)
    const models = runInferencePipeline(features, dem, gpm, aoi.historicalFloodFrequency);

    // 7. Deterministic Risk Engine (40/25/15/10/10 weighted evidence formula)
    const risk = calculateRiskAssessment(features, gpm, dem, aoi.historicalFloodFrequency, DEFAULT_WEIGHTS);

    // 8. Explainable AI (XAI) Synthesis via Gemini 2.5/3.8 API
    const xai = await generateXaiExplanation(aoi.name, aoi.basin, risk, features, dem, gpm);

    // 9. Multi-Satellite Constellation Telemetry (7 Missions)
    const constellation = getConstellationGranules(aoi.name, aoi.basin, aoi.bbox, features.floodExtentKm2);

    res.json({
      aoi,
      sentinel1Scene,
      sentinel2Scene,
      constellation,
      weather,
      gpm,
      dem,
      features,
      models,
      risk,
      xai,
      evaluatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error executing full analysis pipeline:', error);
    res.status(500).json({ error: error.message || 'Internal pipeline processing error' });
  }
});

// Dedicated Multi-Satellite Constellation API
app.get('/api/aoi/:id/constellation', (req: Request, res: Response) => {
  const aoiId = req.params.id;
  const aoi = AREAS_OF_INTEREST.find((a) => a.id === aoiId) || AREAS_OF_INTEREST[0];
  const granules = getConstellationGranules(aoi.name, aoi.basin, aoi.bbox);
  res.json({ aoiId: aoi.id, aoiName: aoi.name, basin: aoi.basin, constellation: granules });
});

// Custom Gemini Explanation Generator
app.post('/api/explanation', async (req: Request, res: Response) => {
  try {
    const { aoiName, basin, risk, features, dem, rainfall } = req.body;
    const explanation = await generateXaiExplanation(
      aoiName || 'Selected AOI',
      basin || 'Regional Basin',
      risk,
      features,
      dem,
      rainfall
    );
    res.json({ explanation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Google Maps Grounding Endpoint (gemini-3.5-flash with googleMaps tool)
app.post('/api/grounding/maps', async (req: Request, res: Response) => {
  try {
    const { aoiName, basin, lat, lng } = req.body;
    const result = await fetchMapsGroundedInfrastructure(
      aoiName || 'Selected River Basin',
      basin || 'Basin Catchment',
      Number(lat) || 10.787,
      Number(lng) || 79.138
    );
    res.json(result);
  } catch (err: any) {
    console.error('Maps grounding error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Google Search Grounding Endpoint (gemini-3.5-flash with googleSearch tool)
app.post('/api/grounding/search', async (req: Request, res: Response) => {
  try {
    const { aoiName, basin, country } = req.body;
    const result = await fetchSearchGroundedNewsAndAlerts(
      aoiName || 'Selected River Basin',
      basin || 'Basin Catchment',
      country || 'Regional Authority'
    );
    res.json(result);
  } catch (err: any) {
    console.error('Search grounding error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Orchestrator Endpoints
app.get('/api/orchestrator', (_req: Request, res: Response) => {
  res.json(getOrchestratorState());
});

app.post('/api/orchestrator/trigger', (req: Request, res: Response) => {
  const { aoiName } = req.body || {};
  res.json(triggerManualCycle(aoiName));
});

app.post('/api/orchestrator/toggle', (_req: Request, res: Response) => {
  res.json(toggleOrchestrator());
});

// Human Verification & Event Store
app.get('/api/events', (_req: Request, res: Response) => {
  res.json({ events: getAllEvents() });
});

app.post('/api/events/verify', (req: Request, res: Response) => {
  const { eventId, notes, analystId } = req.body;
  const updated = verifyEvent(eventId, notes, analystId);
  if (!updated) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json({ event: updated });
});

app.post('/api/events/reject', (req: Request, res: Response) => {
  const { eventId, notes, analystId } = req.body;
  const updated = rejectEvent(eventId, notes, analystId);
  if (!updated) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json({ event: updated });
});

app.post('/api/events/dispatch', (req: Request, res: Response) => {
  const { eventId } = req.body;
  const updated = dispatchAlert(eventId);
  if (!updated) {
    return res.status(400).json({ error: 'Event not verified or not found' });
  }
  res.json({ event: updated });
});

// Research Experiments Benchmark Matrix
app.get('/api/experiments', (_req: Request, res: Response) => {
  res.json({ experiments: RESEARCH_EXPERIMENTS });
});

// Automated Critical Alert Notification Subscriptions
interface AlertSubscription {
  id: string;
  email: string;
  role: string;
  triggerLevel: 'CRITICAL';
  aoiScope: string;
  subscribedAt: string;
  notificationCount: number;
  lastNotifiedAt?: string;
}

const alertSubscriptions: AlertSubscription[] = [
  {
    id: 'sub-primary',
    email: 'someshm7662@gmail.com',
    role: 'Lead Remote Sensing Analyst',
    triggerLevel: 'CRITICAL',
    aoiScope: 'ALL',
    subscribedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    notificationCount: 3,
    lastNotifiedAt: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
  },
];

app.get('/api/notifications/subscriptions', (_req: Request, res: Response) => {
  res.json({ subscriptions: alertSubscriptions });
});

app.post('/api/notifications/subscribe', (req: Request, res: Response) => {
  const { email, role, aoiScope } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required' });
  }

  // Check if email already registered
  const existing = alertSubscriptions.find((s) => s.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    existing.aoiScope = aoiScope || 'ALL';
    existing.role = role || existing.role;
    return res.json({ subscription: existing, message: 'Subscription preferences updated' });
  }

  const newSub: AlertSubscription = {
    id: `sub-${Date.now().toString(36)}`,
    email: email.trim(),
    role: role || 'Operational Duty Officer',
    triggerLevel: 'CRITICAL',
    aoiScope: aoiScope || 'ALL',
    subscribedAt: new Date().toISOString(),
    notificationCount: 0,
  };

  alertSubscriptions.unshift(newSub);
  res.status(201).json({ subscription: newSub, message: 'Successfully subscribed to CRITICAL risk alert dispatches' });
});

app.delete('/api/notifications/unsubscribe/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const index = alertSubscriptions.findIndex((s) => s.id === id || s.email.toLowerCase() === id.toLowerCase());
  if (index === -1) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  const removed = alertSubscriptions.splice(index, 1)[0];
  res.json({ success: true, removed });
});

app.post('/api/notifications/test-dispatch', (req: Request, res: Response) => {
  const { email, aoiName, riskScore } = req.body;
  const targetEmail = email || alertSubscriptions[0]?.email || 'analyst@terrabreath.internal';

  // Find or record dispatch
  const sub = alertSubscriptions.find((s) => s.email.toLowerCase() === targetEmail.toLowerCase());
  if (sub) {
    sub.notificationCount += 1;
    sub.lastNotifiedAt = new Date().toISOString();
  }

  res.json({
    status: 'DISPATCHED',
    recipient: targetEmail,
    channel: 'SMTP_TLS_DIRECT',
    subject: `🚨 [CRITICAL FLOOD DISPATCH] Extreme Inundation Detected: ${aoiName || 'Active Basin'} (Risk Score: ${riskScore || '0.84'})`,
    dispatchedAt: new Date().toISOString(),
    simulatedLatencyMs: 42,
    message: `Automated CRITICAL alert dispatch sent to ${targetEmail}`,
  });
});

// Start Full-Stack Server
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`TerraBreath AI running on http://0.0.0.0:${port}`);
  });
}

// Start standalone HTTP listener if not executed within a Vercel serverless environment
if (process.env.VERCEL !== '1') {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}

export { app };
export default app;
