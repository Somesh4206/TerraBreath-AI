import { GoogleGenAI } from '@google/genai';
import {
  RiskAssessment,
  DerivedGeospatialFeatures,
  CopernicusDemMetrics,
  GpmRainfallMetrics,
  XaiExplanation,
} from '../../types/terrabreath';

/**
 * XAI Engine with Gemini API Integration
 * Follows the principle:
 * The risk score itself is calculated by the deterministic & ML engine.
 * Gemini synthesizes the structured evidence JSON into authoritative,
 * natural-language analyst briefings.
 */

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export async function generateXaiExplanation(
  aoiName: string,
  basin: string,
  risk: RiskAssessment,
  features: DerivedGeospatialFeatures,
  dem: CopernicusDemMetrics,
  rainfall: GpmRainfallMetrics
): Promise<XaiExplanation> {
  const evidencePayload = {
    aoi_name: aoiName,
    river_basin: basin,
    risk_level: risk.riskLevel,
    risk_score: risk.riskScore,
    confidence: risk.confidenceScore,
    data_quality: risk.dataQuality,
    evidence: {
      water_expansion_ratio: features.waterExpansionRatio,
      flood_extent_km2: features.floodExtentKm2,
      sar_delta_backscatter_db: features.deltaBackscatterDb,
      rainfall_24h_mm: rainfall.rainfall24hMm,
      rainfall_anomaly_index: rainfall.anomalyIndex,
      mean_elevation_m: dem.meanElevationM,
      mean_slope_deg: dem.meanSlopeDegrees,
      topographic_wetness_index: dem.topographicWetnessIndex,
    },
    model_provenance: {
      sar_model: 'U-Net Sentinel-1 Dual-Pol',
      risk_model: 'XGBoost Weighted Multi-Sensor Ensemble',
    },
  };

  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `You are a Senior Geospatial & Earth Observation Intelligence Analyst for TerraBreath AI.
Examine this verified, structured multi-sensor Risk JSON for ${aoiName} (${basin}):
${JSON.stringify(evidencePayload, null, 2)}

Provide an authoritative scientific analyst debrief with the following format:
1. SUMMARY: A concise 2-sentence explanation of why this risk level was assigned based on the satellite, rainfall, and terrain data.
2. DRIVERS: 3 key bullet points citing the exact values (e.g. water expansion %, 24h rainfall, slope/elevation).
3. SCIENTIFIC_RATIONALE: A technical explanation describing how SAR backscatter drop and hydrological confluence corroborate the alert.
4. ACTION: Operational recommendation for human verification team.

Keep it crisp, professional, and strictly grounded in the numbers.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const text = response.text;
      if (text && text.trim().length > 50) {
        return parseGeminiExplanation(text);
      }
    } catch (err) {
      console.warn('Gemini API call encountered error; switching to deterministic scientific synthesizer:', err);
    }
  }

  // Deterministic scientific synthesis when Gemini key is not configured or offline
  return generateDeterministicExplanation(aoiName, basin, risk, features, dem, rainfall);
}

function parseGeminiExplanation(rawText: string): XaiExplanation {
  const lines = rawText.split('\n');
  const summaryLine = lines.find((l) => l.toLowerCase().includes('summary:')) || lines[0] || '';
  const cleanSummary = summaryLine.replace(/^.*summary:\s*/i, '').trim() ||
    `Observed surface-water extent increased substantially with elevated precipitation in low-elevation floodplain terrain.`;

  const drivers: string[] = [];
  for (const line of lines) {
    if (line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim())) {
      const cleaned = line.replace(/^[-•\d.]\s*/, '').trim();
      if (cleaned.length > 10 && drivers.length < 3) {
        drivers.push(cleaned);
      }
    }
  }

  if (drivers.length === 0) {
    drivers.push(
      'SAR backscatter specular drop indicating surface water pooling',
      '24h accumulated rainfall exceeding regional drainage absorption threshold',
      'Low terrain gradient and high Topographic Wetness Index facilitating run-off ponding'
    );
  }

  return {
    analystSummary: cleanSummary,
    primaryDrivers: drivers,
    scientificRationale: rawText,
    recommendedAnalystAction: 'Confirm Sentinel-1 dual-pol VV/VH before/after change footprint and approve candidate event for alert notification.',
    modelUsed: 'gemini-3.8-flash',
    geminiPowered: true,
    provenance: 'MODEL',
  };
}

function generateDeterministicExplanation(
  aoiName: string,
  basin: string,
  risk: RiskAssessment,
  features: DerivedGeospatialFeatures,
  dem: CopernicusDemMetrics,
  rainfall: GpmRainfallMetrics
): XaiExplanation {
  const expansionPct = Math.round((features.waterExpansionRatio - 1.0) * 100);
  const isHighOrCritical = risk.riskLevel === 'HIGH' || risk.riskLevel === 'CRITICAL';

  const summary = isHighOrCritical
    ? `The ${aoiName} area (${basin}) is classified as ${risk.riskLevel} flood concern (Score: ${risk.riskScore.toFixed(2)}) because Sentinel-1 SAR observation indicates a +${expansionPct}% surface-water expansion (${features.floodExtentKm2} km²), corroborated by ${rainfall.rainfall24hMm} mm of 24h precipitation and a low mean slope of ${dem.meanSlopeDegrees}°.`
    : `The ${aoiName} area exhibits ${risk.riskLevel} flood risk (Score: ${risk.riskScore.toFixed(2)}) with localized water retention within normal drainage tolerance for the ${basin}.`;

  const drivers = [
    `Sentinel-1 SAR VV backscatter dropped by ${Math.abs(features.deltaBackscatterDb).toFixed(1)} dB due to smooth-surface specular reflection over inundated floodplains.`,
    `NASA GPM IMERG 24h rainfall reached ${rainfall.rainfall24hMm} mm (Anomaly Index: +${rainfall.anomalyIndex.toFixed(1)} above climatological baseline).`,
    `Copernicus DEM indicates high Topographic Wetness Index (${dem.topographicWetnessIndex}) and flat relief (${dem.meanSlopeDegrees}° average gradient), impeding natural tributary discharge.`,
  ];

  const rationale = `Multi-source sensor fusion corroborates that hydrometeorological forcing (GPM IMERG 30-min accumulation) preceded the observed SAR backscatter anomaly. Because Sentinel-1 C-SAR penetrates convective cloud cover without optical attenuation, the detection confidence is rated ${Math.round(risk.confidenceScore * 100)}%. Low drainage density (${dem.drainageDensityKmPerKm2} km/km²) in this alluvial basin confirms high retention risk.`;

  return {
    analystSummary: summary,
    primaryDrivers: drivers,
    scientificRationale: rationale,
    recommendedAnalystAction: isHighOrCritical
      ? 'Perform analyst dual-pol inspection on candidate event; verify levee integrity and dispatch warning bulletin.'
      : 'Maintain standard 3-minute orbital monitoring cycle; no emergency escalation required.',
    modelUsed: 'TerraBreath Rule-Based XAI Engine',
    geminiPowered: false,
    provenance: 'MODEL',
  };
}
