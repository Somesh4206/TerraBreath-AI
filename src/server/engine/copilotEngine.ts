import { GoogleGenAI } from '@google/genai';
import {
  AreaOfInterest,
  RiskAssessment,
  FloodForecast,
  SimulationOutput,
  DerivedGeospatialFeatures,
  CopernicusDemMetrics,
  GpmRainfallMetrics,
} from '../../types/terrabreath';
import { calculateFloodForecast } from './forecastEngine';
import { runFloodSimulation } from './simulatorEngine';
import { SimulationInput } from './simulatorEngine';

export interface CopilotTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface CopilotQuery {
  question: string;
  context: {
    aoi: AreaOfInterest;
    currentRisk: RiskAssessment;
    features: DerivedGeospatialFeatures;
    dem: CopernicusDemMetrics;
    rainfall: GpmRainfallMetrics;
  };
}

export interface CopilotResponse {
  answer: string;
  citations: EvidenceCitation[];
  suggestedActions: string[];
  followUpQuestions: string[];
  toolCalls?: ToolCall[];
}

export interface EvidenceCitation {
  source: string;
  value: string;
  description: string;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

const COPILOT_TOOLS: CopilotTool[] = [
  {
    name: 'get_flood_forecast',
    description: 'Get flood probability forecast for 6, 12, 24, 48 hours',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'run_what_if_simulation',
    description: 'Run what-if flood simulation with custom parameters',
    parameters: {
      type: 'object',
      properties: {
        rainfallMultiplier: { type: 'number', minimum: 0.5, maximum: 2.0, description: 'Rainfall multiplier (0.5-2.0)' },
        riverLevelDeltaM: { type: 'number', minimum: -2, maximum: 5, description: 'River level change in meters (-2 to +5)' },
        durationHours: { type: 'number', minimum: 6, maximum: 72, description: 'Simulation duration in hours (6-72)' },
      },
      required: ['rainfallMultiplier', 'riverLevelDeltaM', 'durationHours'],
    },
  },
  {
    name: 'get_evacuation_routes',
    description: 'Get optimized evacuation routes for a zone',
    parameters: {
      type: 'object',
      properties: {
        zoneName: { type: 'string', description: 'Name of zone to evacuate' },
      },
      required: ['zoneName'],
    },
  },
  {
    name: 'get_impact_assessment',
    description: 'Get population and infrastructure impact assessment',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_vulnerability_score',
    description: 'Get vulnerability score breakdown for the AOI',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  }
  return geminiClient;
}

function buildSystemPrompt(context: CopilotQuery['context']): string {
  const { aoi, currentRisk, features, dem, rainfall } = context;
  return `You are TerraBreath AI Copilot, an expert flood intelligence analyst for ${aoi.name} (${aoi.basin}).

CURRENT SITUATION:
- Risk Level: ${currentRisk.riskLevel} (Score: ${currentRisk.riskScore.toFixed(2)})
- Flood Extent: ${features.floodExtentKm2} km² (${((features.waterExpansionRatio - 1) * 100).toFixed(0)}% expansion)
- 24h Rainfall: ${rainfall.rainfall24hMm} mm (Anomaly: +${rainfall.anomalyIndex})
- Elevation: ${dem.meanElevationM}m, Slope: ${dem.meanSlopeDegrees}°, TWI: ${dem.topographicWetnessIndex}
- Confidence: ${Math.round(currentRisk.confidenceScore * 100)}%

Your role: Answer questions using the available tools. Be precise, cite data, and provide actionable insights.
When users ask about predictions, use get_flood_forecast.
When users ask "what if" scenarios, use run_what_if_simulation.
When users ask about evacuations, use get_evacuation_routes.
When users ask about impact, use get_impact_assessment.
When users ask about vulnerability, use get_vulnerability_score.`;
}

export async function runCopilot(query: CopilotQuery): Promise<CopilotResponse> {
  const ai = getGeminiClient();
  const context = query.context;

  if (!ai) {
    return generateDeterministicResponse(query);
  }

  try {
    const prompt = `${buildSystemPrompt(context)}

USER QUESTION: ${query.question}

Use tools as needed. Provide structured response.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ functionDeclarations: COPILOT_TOOLS }],
      },
    });

    const toolCalls: ToolCall[] = [];
    let answer = response.text || '';

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.functionCall) {
          const toolCall: ToolCall = {
            name: part.functionCall.name,
            arguments: part.functionCall.args as Record<string, unknown>,
          };
          const result = await executeTool(part.functionCall.name, part.functionCall.args as Record<string, unknown>, context);
          toolCall.result = result;
          toolCalls.push(toolCall);
        }
      }
    }

    if (toolCalls.length > 0) {
      const followUpPrompt = `${prompt}

TOOL RESULTS:
${toolCalls.map((tc) => `${tc.name}: ${JSON.stringify(tc.result)}`).join('\n')}

Now provide a final comprehensive answer citing the tool results.`;

      const followUp = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: followUpPrompt,
      });
      answer = followUp.text || answer;
    }

    return {
      answer,
      citations: extractCitations(context, toolCalls),
      suggestedActions: generateSuggestedActions(query.question, context),
      followUpQuestions: generateFollowUpQuestions(query.question),
      toolCalls,
    };
  } catch (err) {
    console.warn('Copilot Gemini error, falling back:', err);
    return generateDeterministicResponse(query);
  }
}

async function executeTool(name: string, args: Record<string, unknown>, context: CopilotQuery['context']): Promise<unknown> {
  switch (name) {
    case 'get_flood_forecast': {
      const forecast = calculateFloodForecast(
        context.features,
        context.rainfall,
        context.dem,
        [],
        0
      );
      return forecast;
    }
    case 'run_what_if_simulation': {
      const input: SimulationInput = {
        rainfallMultiplier: Number(args.rainfallMultiplier) || 1.0,
        riverLevelDeltaM: Number(args.riverLevelDeltaM) || 0,
        durationHours: Number(args.durationHours) || 24,
      };
      return runFloodSimulation(context.features, context.rainfall, context.dem, input, context.aoi.historicalFloodFrequency);
    }
    case 'get_evacuation_routes': {
      return getMockEvacuationRoutes(String(args.zoneName));
    }
    case 'get_impact_assessment': {
      return getMockImpactAssessment(context.features, context.aoi);
    }
    case 'get_vulnerability_score': {
      return getMockVulnerabilityScore(context.aoi, context.dem, context.features);
    }
    default:
      return { error: 'Unknown tool' };
  }
}

function getMockEvacuationRoutes(zoneName: string) {
  return {
    zone: zoneName,
    routes: [
      { name: 'Route A - Northern Highway', distanceKm: 18.5, floodRisk: 'LOW', etaMinutes: 28, roadCondition: 'GOOD', recommended: true },
      { name: 'Route B - Eastern Bypass', distanceKm: 14.2, floodRisk: 'HIGH', etaMinutes: 22, roadCondition: 'PARTIAL', recommended: false },
      { name: 'Route C - Western Ridge Road', distanceKm: 22.1, floodRisk: 'LOW', etaMinutes: 35, roadCondition: 'GOOD', recommended: true },
    ],
    safeZones: ['Regional Hospital - 12km', 'Community Center - 8km', 'University Campus - 15km'],
  };
}

function getMockImpactAssessment(features: DerivedGeospatialFeatures, aoi: AreaOfInterest) {
  const popPerKm2 = 850;
  const floodKm2 = features.floodExtentKm2;
  const population = Math.round(floodKm2 * popPerKm2);
  return {
    aoi: aoi.name,
    floodedAreaKm2: floodKm2,
    populationAffected: population,
    buildingsAtRisk: Math.round(population / 3.2),
    schoolsAffected: Math.round(population / 2500),
    hospitalsAffected: Math.round(population / 50000),
    roadsAffectedKm: Number((floodKm2 * 3.2).toFixed(1)),
    agriculturalLandKm2: Number((floodKm2 * 0.4).toFixed(1)),
    criticalFacilities: [
      { type: 'Hospital', name: 'District Hospital', risk: 'MODERATE' },
      { type: 'School', name: 'Primary School #3', risk: 'HIGH' },
      { type: 'Bridge', name: 'River Crossing Bridge', risk: 'CRITICAL' },
    ],
  };
}

function getMockVulnerabilityScore(aoi: AreaOfInterest, dem: CopernicusDemMetrics, features: DerivedGeospatialFeatures) {
  const scores = {
    infrastructure: 70 + Math.random() * 20,
    population: 65 + Math.random() * 25,
    elevation: Math.max(20, 100 - dem.meanElevationM / 2),
    drainage: 50 + Math.random() * 30,
    rainfall: Math.min(95, 40 + features.waterExpansionRatio * 20),
    historical: aoi.historicalFloodFrequency * 10,
  };
  const overall = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;
  return { overall: Number(overall.toFixed(0)), breakdown: scores, rank: Math.ceil(Math.random() * 10) };
}

function extractCitations(context: CopilotQuery['context'], toolCalls: ToolCall[]): EvidenceCitation[] {
  const citations: EvidenceCitation[] = [
    { source: 'Sentinel-1 SAR', value: `${context.features.floodExtentKm2} km²`, description: 'Current flood extent from dual-pol SAR' },
    { source: 'NASA GPM IMERG', value: `${context.rainfall.rainfall24hMm} mm`, description: '24-hour precipitation accumulation' },
    { source: 'Copernicus DEM GLO-30', value: `${context.dem.meanElevationM}m`, description: 'Mean elevation of AOI' },
  ];
  for (const tc of toolCalls) {
    if (tc.result && typeof tc.result === 'object') {
      citations.push({ source: `TerraBreath ${tc.name}`, value: JSON.stringify(tc.result).slice(0, 100), description: `Tool: ${tc.name}` });
    }
  }
  return citations;
}

function generateSuggestedActions(question: string, context: CopilotQuery['context']): string[] {
  const actions = [];
  const q = question.toLowerCase();
  if (q.includes('evacuat') || q.includes('route')) actions.push('Review evacuation routes with local authorities');
  if (q.includes('risk') || q.includes('forecast') || q.includes('predict')) actions.push('Monitor next Sentinel-1 acquisition for change detection');
  if (q.includes('impact') || q.includes('population') || q.includes('affect')) actions.push('Cross-reference with latest census data for precise impact');
  if (q.includes('simulat') || q.includes('what if')) actions.push('Run ensemble simulation with multiple climate scenarios');
  if (actions.length === 0) actions.push('Continue 3-minute orbital monitoring cycle');
  return actions;
}

function generateFollowUpQuestions(question: string): string[] {
  const q = question.toLowerCase();
  if (q.includes('evacuat')) return ['Which safe zone has highest capacity?', 'What is the traffic capacity of Route A?'];
  if (q.includes('forecast') || q.includes('predict')) return ['What is the 48-hour probability?', 'How does this compare to 2024 event?'];
  if (q.includes('impact')) return ['How many critical facilities are in the flood zone?', 'What is the agricultural loss estimate?'];
  return ['What areas are most vulnerable right now?', 'What happens if rainfall increases by 30%?', 'Give me evacuation priorities.'];
}

function generateDeterministicResponse(query: CopilotQuery): CopilotResponse {
  const { question, context } = query;
  const q = question.toLowerCase();
  let answer = '';

  if (q.includes('vulnerab') || q.includes('risk') || q.includes('which area')) {
    const forecast = calculateFloodForecast(context.features, context.rainfall, context.dem, [], 0);
    answer = `Based on current multi-sensor analysis for ${context.aoi.name}: The 24-hour flood probability is ${(forecast[2].probability * 100).toFixed(0)}% (${forecast[2].riskLevel}). Primary drivers: ${forecast[2].drivers.slice(0, 2).map((d) => `${d.factor} (${(d.contribution * 100).toFixed(0)}%)`).join(', ')}.`;
  } else if (q.includes('what if') || q.includes('rainfall increase') || q.includes('simulat')) {
    const sim = runFloodSimulation(context.features, context.rainfall, context.dem, { rainfallMultiplier: 1.3, riverLevelDeltaM: 0, durationHours: 24 }, context.aoi.historicalFloodFrequency);
    answer = `Simulation with +30% rainfall: Flood extent expands from ${sim.currentFloodKm2} to ${sim.predictedFloodKm2} km². Additional ${sim.additionalPopulation.toLocaleString()} people affected. Risk shifts from ${sim.riskLevelShift.from} to ${sim.riskLevelShift.to}. Affected zones: ${sim.affectedZones.join(', ')}.`;
  } else if (q.includes('evacuat')) {
    const routes = getMockEvacuationRoutes('Central Floodplain');
    answer = `For ${context.aoi.name}, recommended evacuation routes: ${routes.routes.filter((r) => r.recommended).map((r) => r.name).join(' and ')}. Avoid ${routes.routes.filter((r) => !r.recommended).map((r) => r.name).join(', ')} due to HIGH flood risk. Nearest safe zones: ${routes.safeZones.slice(0, 2).join(', ')}.`;
  } else if (q.includes('impact') || q.includes('population') || q.includes('affect')) {
    const impact = getMockImpactAssessment(context.features, context.aoi);
    answer = `Current impact assessment for ${context.aoi.name}: ~${impact.populationAffected.toLocaleString()} people affected, ${impact.buildingsAtRisk} buildings at risk, ${impact.roadsAffectedKm} km roads flooded, ${impact.criticalFacilities.length} critical facilities in zone.`;
  } else {
    answer = `TerraBreath AI Copilot: ${context.aoi.name} is currently at ${context.currentRisk.riskLevel} risk (${context.currentRisk.riskScore.toFixed(2)}). Flood extent: ${context.features.floodExtentKm2} km². 24h rainfall: ${context.rainfall.rainfall24hMm} mm. Ask me about forecasts, simulations, evacuations, or impact assessments.`;
  }

  return {
    answer,
    citations: extractCitations(context, []),
    suggestedActions: generateSuggestedActions(question, context),
    followUpQuestions: generateFollowUpQuestions(question),
  };
}