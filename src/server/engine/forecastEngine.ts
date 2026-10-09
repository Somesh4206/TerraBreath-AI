import {
  DerivedGeospatialFeatures,
  CopernicusDemMetrics,
  GpmRainfallMetrics,
  RiskLevel,
} from '../../types/terrabreath';

export interface FloodForecast {
  horizonHours: number;
  probability: number;
  riskLevel: RiskLevel;
  drivers: ForecastDriver[];
  confidence: number;
}

export interface ForecastDriver {
  factor: 'RAINFALL_TREND' | 'RIVER_LEVEL' | 'SOIL_MOISTURE' | 'SATELLITE_TREND' | 'HISTORICAL_ANALOG';
  currentValue: number;
  projectedValue: number;
  contribution: number;
}

export interface HistoricalFloodEvent {
  date: string;
  peakRainfallMm: number;
  peakRiverLevelM: number;
  floodedAreaKm2: number;
  riskLevel: RiskLevel;
}

const HORIZONS = [6, 12, 24, 48];

const FORECAST_WEIGHTS = {
  rainfallTrend: 0.30,
  riverLevel: 0.25,
  soilMoisture: 0.20,
  satelliteTrend: 0.15,
  historicalAnalog: 0.10,
};

function getRiskLevelFromProbability(prob: number): RiskLevel {
  if (prob >= 0.75) return 'CRITICAL';
  if (prob >= 0.50) return 'HIGH';
  if (prob >= 0.25) return 'MEDIUM';
  return 'LOW';
}

export function calculateFloodForecast(
  features: DerivedGeospatialFeatures,
  rainfall: GpmRainfallMetrics,
  dem: CopernicusDemMetrics,
  historicalEvents: HistoricalFloodEvent[] = [],
  currentRiverLevelM: number = 0
): FloodForecast[] {
  const baseRainfall = rainfall.rainfall24hMm;
  const anomalyIndex = rainfall.anomalyIndex;
  const waterExpansion = features.waterExpansionRatio;
  const deltaBackscatter = Math.abs(features.deltaBackscatterDb);
  const slope = dem.meanSlopeDegrees;
  const twi = dem.topographicWetnessIndex;
  const elevation = dem.meanElevationM;

  const soilMoistureProxy = Math.min(1.0, (baseRainfall / 150.0) * (1 + anomalyIndex / 3.5));
  const satelliteTrend = Math.min(1.0, (waterExpansion - 1.0) / 0.5 + deltaBackscatter / 8.0);
  const terrainFactor = Math.min(1.0, (1.0 - slope / 15.0) * 0.6 + (twi - 6.0) / 12.0 * 0.4);

  let historicalAnalogScore = 0;
  if (historicalEvents.length > 0) {
    const similarEvents = historicalEvents.filter(
      (e) => Math.abs(e.peakRainfallMm - baseRainfall) < 30 && Math.abs(e.peakRiverLevelM - currentRiverLevelM) < 1.5
    );
    if (similarEvents.length > 0) {
      const avgRisk = similarEvents.reduce((sum, e) => {
        const rl = e.riskLevel === 'CRITICAL' ? 1.0 : e.riskLevel === 'HIGH' ? 0.75 : e.riskLevel === 'MEDIUM' ? 0.4 : 0.15;
        return sum + rl;
      }, 0) / similarEvents.length;
      historicalAnalogScore = avgRisk;
    }
  }

  const baseProbability = Math.min(1.0,
    FORECAST_WEIGHTS.rainfallTrend * Math.min(1.0, baseRainfall / 100.0 + anomalyIndex / 3.5) +
    FORECAST_WEIGHTS.riverLevel * Math.min(1.0, currentRiverLevelM / 8.0) +
    FORECAST_WEIGHTS.soilMoisture * soilMoistureProxy +
    FORECAST_WEIGHTS.satelliteTrend * satelliteTrend +
    FORECAST_WEIGHTS.historicalAnalog * historicalAnalogScore
  );

  const baseDrivers: ForecastDriver[] = [
    {
      factor: 'RAINFALL_TREND',
      currentValue: baseRainfall,
      projectedValue: baseRainfall * 1.15,
      contribution: FORECAST_WEIGHTS.rainfallTrend * Math.min(1.0, baseRainfall / 100.0 + anomalyIndex / 3.5),
    },
    {
      factor: 'RIVER_LEVEL',
      currentValue: currentRiverLevelM,
      projectedValue: currentRiverLevelM * 1.2,
      contribution: FORECAST_WEIGHTS.riverLevel * Math.min(1.0, currentRiverLevelM / 8.0),
    },
    {
      factor: 'SOIL_MOISTURE',
      currentValue: Math.round(soilMoistureProxy * 100),
      projectedValue: Math.round(soilMoistureProxy * 120),
      contribution: FORECAST_WEIGHTS.soilMoisture * soilMoistureProxy,
    },
    {
      factor: 'SATELLITE_TREND',
      currentValue: Math.round(satelliteTrend * 100),
      projectedValue: Math.round(satelliteTrend * 130),
      contribution: FORECAST_WEIGHTS.satelliteTrend * satelliteTrend,
    },
    {
      factor: 'HISTORICAL_ANALOG',
      currentValue: Math.round(historicalAnalogScore * 100),
      projectedValue: Math.round(historicalAnalogScore * 100),
      contribution: FORECAST_WEIGHTS.historicalAnalog * historicalAnalogScore,
    },
  ];

  return HORIZONS.map((hours) => {
    const timeFactor = 1.0 + (hours / 48.0) * 0.3;
    const prob = Math.min(1.0, baseProbability * timeFactor);
    const conf = Math.max(0.55, 0.95 - hours / 48.0 * 0.35);

    return {
      horizonHours: hours,
      probability: Number(prob.toFixed(3)),
      riskLevel: getRiskLevelFromProbability(prob),
      drivers: baseDrivers.map((d) => ({
        ...d,
        projectedValue: Number((d.projectedValue * (1 + hours / 48.0 * 0.2)).toFixed(2)),
        contribution: Number((d.contribution * timeFactor).toFixed(3)),
      })),
      confidence: Number(conf.toFixed(2)),
    };
  });
}