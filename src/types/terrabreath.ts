/**
 * TerraBreath AI - Core Data Model & Types
 * Defines data structures for near-real-time Earth Observation,
 * multi-source sensor fusion, risk modeling, and human verification.
 */

export type ProvenanceType = 'LIVE' | 'PROCESSED' | 'MODEL' | 'SIMULATED';

export interface ProvenanceValue<T> {
  value: T;
  provenance: ProvenanceType;
  source: string;
  timestamp: string;
}

export interface AreaOfInterest {
  id: string;
  name: string;
  region: string;
  country: string;
  basin: string;
  center: [number, number]; // [lat, lng]
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  zoom: number;
  historicalFloodFrequency: number; // 0 - 10 scale
  elevationRangeMeters: [number, number];
  primaryVulnerabilityFactor: string;
}

export interface SentinelStacScene {
  id: string;
  collection: 'sentinel-1-grd' | 'sentinel-2-l2a';
  platform: 'Sentinel-1A' | 'Sentinel-1B' | 'Sentinel-2A' | 'Sentinel-2B';
  instrument: 'C-SAR' | 'MSI';
  acquisitionTime: string;
  orbitNumber: number;
  relativeOrbit: number;
  orbitDirection: 'ASCENDING' | 'DESCENDING';
  polarizations?: ('VV' | 'VH' | 'HH' | 'HV')[];
  cloudCoverPercent?: number;
  resolutionMeters: number;
  footprint: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  assets: {
    quicklookUrl?: string;
    thumbnailUrl?: string;
    downloadHref?: string;
  };
  provenance: ProvenanceType;
}

export type SatelliteMissionKey =
  | 'sentinel-1'
  | 'sentinel-2'
  | 'landsat-8-9'
  | 'gpm-core'
  | 'modis-terra-aqua'
  | 'viirs-suomi'
  | 'sentinel-3-altimetry';

export interface SatelliteMissionGranule {
  key: SatelliteMissionKey;
  name: string;
  platform: string;
  agency: 'ESA / Copernicus' | 'NASA / USGS' | 'NASA / JAXA' | 'NOAA / NASA';
  instrument: string;
  sensorType: 'SAR Microwave Radar' | 'Multispectral Optical' | 'Thermal IR' | 'Dual-Frequency Rain Radar' | 'Wide-Swath Radiometer' | 'Radar Altimeter';
  spectralBands: string[];
  waterDetectionMethod: string;
  acquisitionTime: string;
  orbitDetails: string;
  spatialResolution: string;
  revisitInterval: string;
  cloudPenetration: boolean;
  cloudCoverPercent?: number;
  granuleId: string;
  derivedMetric: {
    label: string;
    value: string;
    unit?: string;
    status: 'NORMAL' | 'WARNING' | 'CRITICAL';
    interpretation: string;
  };
  thumbnailUrl?: string;
  dataAccessUrl: string;
  stacCollection: string;
  provenance: 'LIVE';
}

export interface LiveWeatherMetrics {
  temperatureC: number;
  relativeHumidityPercent: number;
  surfacePressureHpa: number;
  windSpeedKmh: number;
  precipitationMm: number;
  rain1hMm: number;
  rain24hMm: number;
  timestamp: string;
  source: 'Open-Meteo API';
  provenance: 'LIVE';
}

export interface GpmRainfallMetrics {
  rainfall1hMm: number;
  rainfall3hMm: number;
  rainfall24hMm: number;
  anomalyIndex: number; // -2.0 (dry) to +3.5 (extreme)
  granuleId: string;
  latencyHours: number;
  source: 'NASA GPM IMERG Early';
  provenance: 'LIVE';
}

export interface CopernicusDemMetrics {
  meanElevationM: number;
  minElevationM: number;
  maxElevationM: number;
  meanSlopeDegrees: number;
  drainageDensityKmPerKm2: number;
  topographicWetnessIndex: number;
  slopeCategory: 'Flat / Floodplain' | 'Gentle Valley' | 'Moderate Terrain' | 'Steep Uplands';
  source: 'Copernicus DEM GLO-30';
  provenance: 'PROCESSED';
}

export interface DerivedGeospatialFeatures {
  vvMeanBackscatterDb: number;
  vhMeanBackscatterDb: number;
  vvVhRatio: number;
  deltaBackscatterDb: number; // Change compared to dry-season reference
  ndwiIndex: number; // Sentinel-2 (Green - NIR) / (Green + NIR)
  mndwiIndex: number; // Sentinel-2 (Green - SWIR) / (Green + SWIR)
  detectedWaterAreaKm2: number;
  referenceWaterAreaKm2: number;
  waterExpansionRatio: number; // e.g., 1.45 (+45% water body area)
  floodExtentKm2: number;
  provenance: 'PROCESSED';
}

export interface ModelOutputs {
  model0_baseline: {
    name: 'Model 0 - Deterministic Backscatter Threshold (Otsu)';
    waterMaskAreaKm2: number;
    detectedAnomaly: boolean;
    confidence: number;
    provenance: 'MODEL';
  };
  model1_segmentation: {
    name: 'Model 1 - Deep U-Net SAR Flood Segmentation';
    segmentedWaterKm2: number;
    expansionConfidence: number;
    diceScore: number;
    provenance: 'MODEL';
  };
  model2_riskClassifier: {
    name: 'Model 2 - Multi-Source XGBoost / Random Forest Classifier';
    riskProbability: number;
    keyFeatureWeight: string;
    provenance: 'MODEL';
  };
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskFormulaWeights {
  satelliteEvidence: number; // 0.40
  rainfallEvidence: number; // 0.25
  terrainVulnerability: number; // 0.15
  historicalVulnerability: number; // 0.10
  dataQuality: number; // 0.10
}

export interface RiskAssessment {
  riskScore: number; // 0.00 - 1.00
  riskLevel: RiskLevel;
  confidenceScore: number; // 0.00 - 1.00
  dataQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DEGRADED';
  formulaBreakdown: {
    satelliteScore: number;
    rainfallScore: number;
    terrainScore: number;
    historicalScore: number;
    qualityScore: number;
    weights: RiskFormulaWeights;
  };
  featureAttributions: {
    feature: string;
    value: string;
    impact: 'INCREASES_RISK' | 'DECREASES_RISK' | 'NEUTRAL';
    weightPct: number;
  }[];
  provenance: 'MODEL';
}

export interface XaiExplanation {
  analystSummary: string;
  primaryDrivers: string[];
  scientificRationale: string;
  recommendedAnalystAction: string;
  modelUsed: string;
  geminiPowered: boolean;
  provenance: 'MODEL';
}

export type EventStatus = 'CANDIDATE' | 'VERIFIED' | 'REJECTED' | 'ALERT_DISPATCHED';

export interface FloodEvent {
  id: string;
  aoiId: string;
  aoiName: string;
  basin: string;
  coordinates: [number, number];
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  status: EventStatus;
  floodExtentKm2: number;
  waterExpansionPct: number;
  rainfall24hMm: number;
  detectedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  analystNotes?: string;
  alertDispatchedAt?: string;
  evidence: {
    sceneId: string;
    satellite: string;
    rain24h: number;
    elevation: number;
    slope: number;
    historicalFreq: number;
  };
}

export interface ResearchExperimentResult {
  id: 'exp-a' | 'exp-b' | 'exp-c' | 'exp-d';
  name: string;
  featuresUsed: string[];
  precision: number;
  recall: number;
  f1Score: number;
  meanIoU: number;
  falsePositivesPct: number;
  falseNegativesPct: number;
  avgInferenceLatencyMs: number;
  description: string;
}

export interface OrchestratorLog {
  id: string;
  timestamp: string;
  stage: 'POLL' | 'INGEST' | 'VALIDATE' | 'PROCESS' | 'INFERENCE' | 'DECISION';
  provider: 'CDSE' | 'Open-Meteo' | 'NASA-GPM' | 'DEM' | 'XGBoost' | 'Gemini';
  message: string;
  status: 'SUCCESS' | 'WARN' | 'INFO';
}

export interface OrchestratorState {
  isActive: boolean;
  cycleIntervalSeconds: number;
  secondsUntilNextCycle: number;
  totalCyclesCompleted: number;
  lastRunTimestamp: string;
  latestSceneIngested: string;
  activeCandidatesCount: number;
  verifiedEventsCount: number;
  logs: OrchestratorLog[];
}
