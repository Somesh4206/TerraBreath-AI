import { FloodEvent } from '../../types/terrabreath';

let events: FloodEvent[] = [
  {
    id: 'EVT-2026-0921',
    aoiId: 'tamil-nadu-kaveri',
    aoiName: 'Tamil Nadu - Kaveri Delta Basin',
    basin: 'Kaveri River Delta',
    coordinates: [10.787, 79.138],
    riskScore: 0.81,
    riskLevel: 'CRITICAL',
    confidence: 0.91,
    status: 'CANDIDATE',
    floodExtentKm2: 84.6,
    waterExpansionPct: 58,
    rainfall24hMm: 94.2,
    detectedAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    evidence: {
      sceneId: 'S1A_IW_GRDH_1SDV_20260928T004218_052194',
      satellite: 'Sentinel-1A C-SAR',
      rain24h: 94.2,
      elevation: 12.4,
      slope: 1.4,
      historicalFreq: 7.8,
    },
  },
  {
    id: 'EVT-2026-0884',
    aoiId: 'valencia-turia',
    aoiName: 'Valencia - Turia & Magro River Basin',
    basin: 'Turia / Júcar Basin',
    coordinates: [39.42, -0.44],
    riskScore: 0.89,
    riskLevel: 'CRITICAL',
    confidence: 0.94,
    status: 'VERIFIED',
    floodExtentKm2: 42.1,
    waterExpansionPct: 65,
    rainfall24hMm: 148.0,
    detectedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    verifiedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    verifiedBy: 'Dr. M. S. Vance (Lead Hydrologist)',
    analystNotes: 'Confirmed severe flash flooding in Magro ravine confluence; rapid specular backscatter drop verified across Sentinel-1 descending track. Emergency services notified.',
    alertDispatchedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    evidence: {
      sceneId: 'S1B_IW_GRDH_1SDV_20260927T181402_041180',
      satellite: 'Sentinel-1B C-SAR',
      rain24h: 148.0,
      elevation: 24.0,
      slope: 4.6,
      historicalFreq: 8.2,
    },
  },
  {
    id: 'EVT-2026-0812',
    aoiId: 'assam-brahmaputra',
    aoiName: 'Assam - Kaziranga & Brahmaputra Basin',
    basin: 'Brahmaputra River Basin',
    coordinates: [26.65, 93.35],
    riskScore: 0.76,
    riskLevel: 'HIGH',
    confidence: 0.89,
    status: 'VERIFIED',
    floodExtentKm2: 168.4,
    waterExpansionPct: 44,
    rainfall24hMm: 86.5,
    detectedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    verifiedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    verifiedBy: 'K. Das (Regional Analyst)',
    analystNotes: 'Brahmaputra overbank flow inundating low-lying national park alluvial corridors. Water level telemetry aligns with SAR extent.',
    alertDispatchedAt: new Date(Date.now() - 11 * 3600 * 1000).toISOString(),
    evidence: {
      sceneId: 'S1A_IW_GRDH_1SDV_20260926T235109_052140',
      satellite: 'Sentinel-1A C-SAR',
      rain24h: 86.5,
      elevation: 58.0,
      slope: 2.1,
      historicalFreq: 9.4,
    },
  },
  {
    id: 'EVT-2026-0790',
    aoiId: 'houston-bayous',
    aoiName: 'Houston Metro & San Jacinto Basin',
    basin: 'Buffalo Bayou / Galveston Bay',
    coordinates: [29.76, -95.37],
    riskScore: 0.42,
    riskLevel: 'MEDIUM',
    confidence: 0.82,
    status: 'REJECTED',
    floodExtentKm2: 12.0,
    waterExpansionPct: 6,
    rainfall24hMm: 22.0,
    detectedAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    verifiedAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    verifiedBy: 'T. Reynolds (Analyst)',
    analystNotes: 'False alarm caused by temporary smooth standing water on intermodal rail yard asphalt; 24h rainfall is below retention threshold.',
    evidence: {
      sceneId: 'S1A_IW_GRDH_1SDV_20260925T121045_052099',
      satellite: 'Sentinel-1A C-SAR',
      rain24h: 22.0,
      elevation: 14.0,
      slope: 0.9,
      historicalFreq: 8.6,
    },
  },
];

export function getAllEvents(): FloodEvent[] {
  return [...events];
}

export function createCandidateEvent(event: Omit<FloodEvent, 'id' | 'status' | 'detectedAt'>): FloodEvent {
  const newEvent: FloodEvent = {
    ...event,
    id: `EVT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'CANDIDATE',
    detectedAt: new Date().toISOString(),
  };
  events.unshift(newEvent);
  return newEvent;
}

export function verifyEvent(id: string, analystNotes: string, verifiedBy: string): FloodEvent | null {
  const target = events.find((e) => e.id === id);
  if (!target) return null;
  target.status = 'VERIFIED';
  target.verifiedAt = new Date().toISOString();
  target.verifiedBy = verifiedBy || 'Duty Hydrologist (Analyst ID #84)';
  target.analystNotes = analystNotes;
  return target;
}

export function rejectEvent(id: string, analystNotes: string, rejectedBy: string): FloodEvent | null {
  const target = events.find((e) => e.id === id);
  if (!target) return null;
  target.status = 'REJECTED';
  target.verifiedAt = new Date().toISOString();
  target.verifiedBy = rejectedBy || 'Duty Hydrologist (Analyst ID #84)';
  target.analystNotes = analystNotes;
  return target;
}

export function dispatchAlert(id: string): FloodEvent | null {
  const target = events.find((e) => e.id === id);
  if (!target || target.status !== 'VERIFIED') return null;
  target.status = 'ALERT_DISPATCHED';
  target.alertDispatchedAt = new Date().toISOString();
  return target;
}
