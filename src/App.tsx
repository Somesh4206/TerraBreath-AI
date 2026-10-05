/**
 * TerraBreath AI - Near-Real-Time Earth Observation Flood Intelligence
 * Core Dashboard & Multi-Source Risk Engine
 */

import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { OrchestratorRibbon } from './components/OrchestratorRibbon';
import { AOISelector } from './components/AOISelector';
import { MapStage } from './components/MapStage';
import { SatelliteStacCard } from './components/SatelliteStacCard';
import { WeatherRainfallCard } from './components/WeatherRainfallCard';
import { TerrainCard } from './components/TerrainCard';
import { MlInferenceCard } from './components/MlInferenceCard';
import { RiskEngineCard } from './components/RiskEngineCard';
import { XaiExplanationCard } from './components/XaiExplanationCard';
import { HumanVerificationModal } from './components/HumanVerificationModal';
import { ResearchMatrixModal } from './components/ResearchMatrixModal';
import { GroundedIntelligenceCard } from './components/GroundedIntelligenceCard';
import { ProvenanceBadge } from './components/ProvenanceBadge';

import {
  AreaOfInterest,
  SentinelStacScene,
  LiveWeatherMetrics,
  GpmRainfallMetrics,
  CopernicusDemMetrics,
  DerivedGeospatialFeatures,
  ModelOutputs,
  RiskAssessment,
  XaiExplanation,
  FloodEvent,
  OrchestratorState,
  SatelliteMissionGranule,
} from './types/terrabreath';
import { AREAS_OF_INTEREST } from './data/aoiList';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'satellite' | 'weather' | 'risk' | 'verification' | 'research' | 'grounding'
  >('overview');

  const [selectedAoi, setSelectedAoi] = useState<AreaOfInterest>(AREAS_OF_INTEREST[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);

  // Analysis State
  const [sentinel1Scene, setSentinel1Scene] = useState<SentinelStacScene | null>(null);
  const [sentinel2Scene, setSentinel2Scene] = useState<SentinelStacScene | null>(null);
  const [constellation, setConstellation] = useState<SatelliteMissionGranule[] | null>(null);
  const [weather, setWeather] = useState<LiveWeatherMetrics | null>(null);
  const [gpm, setGpm] = useState<GpmRainfallMetrics | null>(null);
  const [dem, setDem] = useState<CopernicusDemMetrics | null>(null);
  const [features, setFeatures] = useState<DerivedGeospatialFeatures | null>(null);
  const [models, setModels] = useState<ModelOutputs | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [xai, setXai] = useState<XaiExplanation | null>(null);

  // Events & Orchestrator
  const [events, setEvents] = useState<FloodEvent[]>([]);
  const [orchestrator, setOrchestrator] = useState<OrchestratorState | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Load Analysis for selected AOI
  const loadAoiAnalysis = async (aoi: AreaOfInterest) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/aoi/${aoi.id}/full-analysis`);
      if (res.ok) {
        const data = await res.json();
        setSentinel1Scene(data.sentinel1Scene);
        setSentinel2Scene(data.sentinel2Scene);
        setConstellation(data.constellation || null);
        setWeather(data.weather);
        setGpm(data.gpm);
        setDem(data.dem);
        setFeatures(data.features);
        setModels(data.models);
        setRisk(data.risk);
        setXai(data.xai);
      }
    } catch (err) {
      console.error('Error fetching analysis data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load Events
  const loadEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  // Load Orchestrator State
  const loadOrchestrator = async () => {
    try {
      const res = await fetch('/api/orchestrator');
      if (res.ok) {
        const data = await res.json();
        setOrchestrator(data);
      }
    } catch (err) {
      console.error('Error fetching orchestrator:', err);
    }
  };

  useEffect(() => {
    loadAoiAnalysis(selectedAoi);
    loadEvents();
    loadOrchestrator();

    // Poll orchestrator every 3 seconds for smooth countdown
    const timer = setInterval(() => {
      loadOrchestrator();
    }, 3000);

    return () => clearInterval(timer);
  }, [selectedAoi]);

  // Trigger Cycle
  const handleTriggerCycle = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch('/api/orchestrator/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aoiName: selectedAoi.name }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrchestrator(data);
      }
      // Re-run pipeline
      await loadAoiAnalysis(selectedAoi);
      await loadEvents();
    } catch (err) {
      console.error('Error triggering cycle:', err);
    } finally {
      setIsTriggering(false);
    }
  };

  // Toggle Orchestrator
  const handleToggleOrchestrator = async () => {
    try {
      const res = await fetch('/api/orchestrator/toggle', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setOrchestrator(data);
      }
    } catch (err) {
      console.error('Error toggling orchestrator:', err);
    }
  };

  // Human Review Actions
  const handleVerifyEvent = async (eventId: string, notes: string, analystId: string) => {
    try {
      const res = await fetch('/api/events/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, notes, analystId }),
      });
      if (res.ok) {
        await loadEvents();
      }
    } catch (err) {
      console.error('Error verifying event:', err);
    }
  };

  const handleRejectEvent = async (eventId: string, notes: string, analystId: string) => {
    try {
      const res = await fetch('/api/events/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, notes, analystId }),
      });
      if (res.ok) {
        await loadEvents();
      }
    } catch (err) {
      console.error('Error rejecting event:', err);
    }
  };

  const handleDispatchAlert = async (eventId: string) => {
    try {
      const res = await fetch('/api/events/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      if (res.ok) {
        await loadEvents();
      }
    } catch (err) {
      console.error('Error dispatching alert:', err);
    }
  };

  const candidateCount = events.filter((e) => e.status === 'CANDIDATE').length;

  // Assembled full report data for PDF export
  const reportData = {
    aoi: selectedAoi,
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
  };

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-sans">
      {/* 1. Header (Top Bar Contract: 3 Zones) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        candidateCount={candidateCount}
        onTriggerCycle={handleTriggerCycle}
        isTriggering={isTriggering}
        reportData={reportData}
      />

      {/* 2. Orchestrator Near-Real-Time 3-minute Ribbon */}
      <OrchestratorRibbon
        state={orchestrator}
        onRefresh={loadOrchestrator}
        onToggle={handleToggleOrchestrator}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Mission Status Telemetry Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[#0f141f] border border-slate-800 p-3 rounded">
            <div className="text-slate-400 text-[10px] uppercase font-mono">Mission Target AOI</div>
            <div className="text-xs font-semibold text-slate-100 truncate mt-1">
              {selectedAoi.name.split(' - ')[0]}
            </div>
            <div className="text-[10px] text-cyan-400 font-mono mt-0.5">{selectedAoi.basin}</div>
          </div>

          <div className="bg-[#0f141f] border border-slate-800 p-3 rounded">
            <div className="text-slate-400 text-[10px] uppercase font-mono">Aggregated Risk Level</div>
            <div
              className={`text-base font-mono font-bold mt-0.5 ${
                risk?.riskLevel === 'CRITICAL'
                  ? 'text-rose-400'
                  : risk?.riskLevel === 'HIGH'
                  ? 'text-orange-400'
                  : risk?.riskLevel === 'MEDIUM'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {risk ? `${risk.riskScore.toFixed(2)} (${risk.riskLevel})` : 'Evaluating...'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Weighted formula</div>
          </div>

          <div className="bg-[#0f141f] border border-slate-800 p-3 rounded">
            <div className="text-slate-400 text-[10px] uppercase font-mono">SAR Inundated Extent</div>
            <div className="text-base font-mono font-bold text-cyan-300 mt-0.5">
              {features ? `${features.floodExtentKm2} km²` : 'Calculating...'}
            </div>
            <div className="text-[10px] text-cyan-400/90 font-mono mt-0.5">
              {features ? `+${((features.waterExpansionRatio - 1.0) * 100).toFixed(0)}% expansion` : ''}
            </div>
          </div>

          <div className="bg-[#0f141f] border border-slate-800 p-3 rounded">
            <div className="text-slate-400 text-[10px] uppercase font-mono">24h Rainfall (GPM)</div>
            <div className="text-base font-mono font-bold text-sky-400 mt-0.5">
              {gpm ? `${gpm.rainfall24hMm} mm` : 'Fetching...'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              {gpm ? `Anomaly: +${gpm.anomalyIndex}` : ''}
            </div>
          </div>

          <div className="bg-[#0f141f] border border-slate-800 p-3 rounded">
            <div className="text-slate-400 text-[10px] uppercase font-mono">Sensor Provenance</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono text-emerald-300">CDSE + GPM LIVE</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Dual-Pol C-SAR Verified</div>
          </div>

          <div className="bg-[#0f141f] border border-slate-800 p-3 rounded">
            <div className="text-slate-400 text-[10px] uppercase font-mono">Review Pipeline</div>
            <div className="text-base font-mono font-bold text-slate-200 mt-0.5">
              {candidateCount} <span className="text-xs text-rose-400 font-normal">Pending</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              {events.filter((e) => e.status === 'VERIFIED').length} Verified Events
            </div>
          </div>
        </div>

        {/* Tab 1: Mission Console (Overview) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* AOI Selector */}
            <AOISelector
              selectedAoi={selectedAoi}
              onSelectAoi={setSelectedAoi}
              isLoading={isLoading}
              reportData={reportData}
            />

            {/* Interactive Leaflet Map Stage */}
            <MapStage
              aoi={selectedAoi}
              sentinelScene={sentinel1Scene}
              floodExtentKm2={features?.floodExtentKm2}
              events={events}
              onSelectEvent={(evt) => {
                setSelectedEventId(evt.id);
                setActiveTab('verification');
              }}
            />

            {/* Split Grid: Sentinel-1 STAC + Weather/GPM */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SatelliteStacCard
                scene={sentinel1Scene}
                features={features}
                opticalScene={sentinel2Scene}
                constellation={constellation}
              />
              <WeatherRainfallCard weather={weather} gpm={gpm} />
            </div>

            {/* Split Grid: Risk Engine + Gemini XAI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RiskEngineCard risk={risk} aoiName={selectedAoi.name} />
              <XaiExplanationCard
                xai={xai}
                risk={risk}
                aoiName={selectedAoi.name}
              />
            </div>

            {/* Real-Time Grounded Intelligence (Google Maps & Google Search) */}
            <GroundedIntelligenceCard aoi={selectedAoi} />
          </div>
        )}

        {/* Tab 2: Copernicus STAC Inspector */}
        {activeTab === 'satellite' && (
          <div className="space-y-6">
            <AOISelector
              selectedAoi={selectedAoi}
              onSelectAoi={setSelectedAoi}
              isLoading={isLoading}
              reportData={reportData}
            />
            <SatelliteStacCard
              scene={sentinel1Scene}
              features={features}
              opticalScene={sentinel2Scene}
              constellation={constellation}
            />
            <MapStage
              aoi={selectedAoi}
              sentinelScene={sentinel1Scene}
              floodExtentKm2={features?.floodExtentKm2}
              events={events}
            />
          </div>
        )}

        {/* Tab 3: Weather & GPM Precipitation */}
        {activeTab === 'weather' && (
          <div className="space-y-6">
            <AOISelector
              selectedAoi={selectedAoi}
              onSelectAoi={setSelectedAoi}
              isLoading={isLoading}
              reportData={reportData}
            />
            <WeatherRainfallCard weather={weather} gpm={gpm} />
            <TerrainCard dem={dem} />
          </div>
        )}

        {/* Tab 4: Risk Engine, ML Models & XAI */}
        {activeTab === 'risk' && (
          <div className="space-y-6">
            <AOISelector
              selectedAoi={selectedAoi}
              onSelectAoi={setSelectedAoi}
              isLoading={isLoading}
              reportData={reportData}
            />
            <RiskEngineCard risk={risk} aoiName={selectedAoi.name} />
            <MlInferenceCard models={models} />
            <XaiExplanationCard
              xai={xai}
              risk={risk}
              aoiName={selectedAoi.name}
            />
          </div>
        )}

        {/* Tab 5: Human Verification Review Desk */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            <HumanVerificationModal
              events={events}
              onVerify={handleVerifyEvent}
              onReject={handleRejectEvent}
              onDispatchAlert={handleDispatchAlert}
              selectedEventId={selectedEventId}
            />
          </div>
        )}

        {/* Tab 6: Real-Time Grounded Intel (Google Maps & Search) */}
        {activeTab === 'grounding' && (
          <div className="space-y-6">
            <AOISelector
              selectedAoi={selectedAoi}
              onSelectAoi={setSelectedAoi}
              isLoading={isLoading}
              reportData={reportData}
            />
            <GroundedIntelligenceCard aoi={selectedAoi} />
            <MapStage
              aoi={selectedAoi}
              sentinelScene={sentinel1Scene}
              floodExtentKm2={features?.floodExtentKm2}
              events={events}
            />
          </div>
        )}

        {/* Tab 7: Research Experiments Benchmark Matrix */}
        {activeTab === 'research' && (
          <div className="space-y-6">
            <ResearchMatrixModal />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-4 bg-[#090d14] text-xs text-slate-500 font-mono flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-slate-300 font-semibold">TerraBreath AI</span>
          <span>·</span>
          <span>Near-Real-Time EO Flood Intelligence & Risk Engine</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Copernicus CDSE Sentinel-1/2</span>
          <span>·</span>
          <span>Open-Meteo API</span>
          <span>·</span>
          <span>NASA GPM & GIBS</span>
          <span>·</span>
          <span>Copernicus DEM GLO-30</span>
        </div>
      </footer>
    </div>
  );
}
