import {
  DerivedGeospatialFeatures,
  CopernicusDemMetrics,
  GpmRainfallMetrics,
  RiskLevel,
  RiskFormulaWeights,
  DEFAULT_WEIGHTS,
} from '../../types/terrabreath';
import { calculateRiskAssessment } from './riskEngine';

export interface SimulationInput {
  rainfallMultiplier: number;
  riverLevelDeltaM: number;
  durationHours: number;
}

export interface SimulationOutput {
  currentFloodKm2: number;
  predictedFloodKm2: number;
  additionalPopulation: number;
  riskLevelShift: { from: RiskLevel; to: RiskLevel };
  affectedZones: string[];
  confidence: number;
}

const POPULATION_DENSITY_PER_KM2 = 850;
const ZONE_NAMES = ['North Basin', 'Central Floodplain', 'East Delta', 'West Levee Zone', 'South Wetlands'];

function estimatePopulation(floodKm2: number): number {
  return Math.round(floodKm2 * POPULATION_DENSITY_PER_KM2 * (0.8 + Math.random() * 0.4));
}

function getAffectedZones(floodKm2: number, predictedFloodKm2: number): string[] {
  const baseZones = Math.ceil(floodKm2 / 5);
  const additionalZones = Math.ceil((predictedFloodKm2 - floodKm2) / 5);
  return ZONE_NAMES.slice(0, Math.min(5, baseZones + additionalZones));
}

export function runFloodSimulation(
  baseFeatures: DerivedGeospatialFeatures,
  baseRainfall: GpmRainfallMetrics,
  baseDem: CopernicusDemMetrics,
  simulationInput: SimulationInput,
  historicalFreq: number = 5,
  weights: RiskFormulaWeights = DEFAULT_WEIGHTS
): SimulationOutput {
  const { rainfallMultiplier, riverLevelDeltaM, durationHours } = simulationInput;

  const currentFloodKm2 = baseFeatures.floodExtentKm2;

  const simulatedRainfall: GpmRainfallMetrics = {
    ...baseRainfall,
    rainfall24hMm: baseRainfall.rainfall24hMm * rainfallMultiplier,
    anomalyIndex: baseRainfall.anomalyIndex * rainfallMultiplier,
  };

  const simulatedFeatures: DerivedGeospatialFeatures = {
    ...baseFeatures,
    waterExpansionRatio: Math.min(3.0, baseFeatures.waterExpansionRatio * (1 + (rainfallMultiplier - 1) * 0.6 + Math.max(0, riverLevelDeltaM) * 0.15)),
    floodExtentKm2: Math.min(150, baseFeatures.floodExtentKm2 * (1 + (rainfallMultiplier - 1) * 0.7 + Math.max(0, riverLevelDeltaM) * 0.2)),
    deltaBackscatterDb: baseFeatures.deltaBackscatterDb * (1 + (rainfallMultiplier - 1) * 0.5),
  };

  const simulatedDem: CopernicusDemMetrics = {
    ...baseDem,
    meanElevationM: Math.max(0, baseDem.meanElevationM - Math.max(0, riverLevelDeltaM)),
  };

  const baseRisk = calculateRiskAssessment(baseFeatures, baseRainfall, baseDem, historicalFreq, weights);
  const simRisk = calculateRiskAssessment(simulatedFeatures, simulatedRainfall, simulatedDem, historicalFreq, weights);

  const predictedFloodKm2 = simulatedFeatures.floodExtentKm2;
  const additionalPopulation = estimatePopulation(predictedFloodKm2) - estimatePopulation(currentFloodKm2);
  const affectedZones = getAffectedZones(currentFloodKm2, predictedFloodKm2);

  const timeConfidence = Math.max(0.5, 0.9 - durationHours / 72.0 * 0.35);
  const modelConfidence = (baseRisk.confidenceScore + simRisk.confidenceScore) / 2;
  const confidence = Number((timeConfidence * modelConfidence).toFixed(2));

  return {
    currentFloodKm2: Number(currentFloodKm2.toFixed(1)),
    predictedFloodKm2: Number(predictedFloodKm2.toFixed(1)),
    additionalPopulation: Math.max(0, additionalPopulation),
    riskLevelShift: { from: baseRisk.riskLevel, to: simRisk.riskLevel },
    affectedZones,
    confidence,
  };
}