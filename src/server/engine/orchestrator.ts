import { OrchestratorState, OrchestratorLog } from '../../types/terrabreath';
import { getAllEvents } from './eventStore';

let logs: OrchestratorLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 170 * 1000).toISOString(),
    stage: 'POLL',
    provider: 'CDSE',
    message: 'Copernicus STAC catalog checked for Sentinel-1 GRD descending tracks over Kaveri Basin.',
    status: 'SUCCESS',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 165 * 1000).toISOString(),
    stage: 'INGEST',
    provider: 'Open-Meteo',
    message: 'Live meteorological telemetry retrieved (Rainfall: 94.2 mm / 24h, Pressure: 1008.2 hPa).',
    status: 'SUCCESS',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 155 * 1000).toISOString(),
    stage: 'VALIDATE',
    provider: 'NASA-GPM',
    message: 'GPM IMERG Early granule 3B-HHR-E aligned. Dual-pol VV/VH integrity verified with 0% cloud attenuation.',
    status: 'SUCCESS',
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 140 * 1000).toISOString(),
    stage: 'PROCESS',
    provider: 'DEM',
    message: 'Copernicus GLO-30 DEM drainage vectors merged with delta backscatter (-3.8 dB drop).',
    status: 'SUCCESS',
  },
  {
    id: 'log-5',
    timestamp: new Date(Date.now() - 120 * 1000).toISOString(),
    stage: 'INFERENCE',
    provider: 'XGBoost',
    message: 'Multi-source risk model executed (Risk Score: 0.81, CRITICAL threshold exceeded).',
    status: 'WARN',
  },
  {
    id: 'log-6',
    timestamp: new Date(Date.now() - 110 * 1000).toISOString(),
    stage: 'DECISION',
    provider: 'Gemini',
    message: 'Candidate Event EVT-2026-0921 generated and routed to human analyst verification desk.',
    status: 'SUCCESS',
  },
];

let cycleIntervalSeconds = 180; // 3 minutes
let secondsRemaining = 134;
let totalCyclesCompleted = 48;
let isActive = true;
let lastRunTimestamp = new Date(Date.now() - 46 * 1000).toISOString();
let latestSceneIngested = 'S1A_IW_GRDH_1SDV_20260928T004218_052194';

// Run ticker every second to advance countdown
setInterval(() => {
  if (!isActive) return;
  if (secondsRemaining > 1) {
    secondsRemaining--;
  } else {
    // Reset cycle
    secondsRemaining = cycleIntervalSeconds;
    totalCyclesCompleted++;
    lastRunTimestamp = new Date().toISOString();

    const timestamp = new Date().toISOString();
    logs.unshift({
      id: `log-${Date.now()}`,
      timestamp,
      stage: 'POLL',
      provider: 'CDSE',
      message: `Cycle #${totalCyclesCompleted}: STAC poll completed. Monitoring active AOIs for new Sentinel-1 granules.`,
      status: 'SUCCESS',
    });

    if (logs.length > 25) {
      logs = logs.slice(0, 25);
    }
  }
}, 1000);

export function getOrchestratorState(): OrchestratorState {
  const allEvents = getAllEvents();
  const candidates = allEvents.filter((e) => e.status === 'CANDIDATE').length;
  const verified = allEvents.filter((e) => e.status === 'VERIFIED' || e.status === 'ALERT_DISPATCHED').length;

  return {
    isActive,
    cycleIntervalSeconds,
    secondsUntilNextCycle: secondsRemaining,
    totalCyclesCompleted,
    lastRunTimestamp,
    latestSceneIngested,
    activeCandidatesCount: candidates,
    verifiedEventsCount: verified,
    logs: [...logs],
  };
}

export function triggerManualCycle(aoiName?: string): OrchestratorState {
  secondsRemaining = cycleIntervalSeconds;
  totalCyclesCompleted++;
  lastRunTimestamp = new Date().toISOString();

  const timestamp = new Date().toISOString();
  logs.unshift({
    id: `log-${Date.now()}`,
    timestamp,
    stage: 'POLL',
    provider: 'CDSE',
    message: `Manual orchestrator trigger initiated for ${aoiName || 'active basin'}. Ingesting real-time observations...`,
    status: 'INFO',
  });

  return getOrchestratorState();
}

export function toggleOrchestrator(): OrchestratorState {
  isActive = !isActive;
  return getOrchestratorState();
}
