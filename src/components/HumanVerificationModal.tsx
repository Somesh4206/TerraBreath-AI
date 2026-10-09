import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Bell,
  Clock,
  ExternalLink,
  UserCheck,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react';
import { FloodEvent } from '../types/terrabreath';
import { ProvenanceBadge } from './ProvenanceBadge';

interface HumanVerificationModalProps {
  events: FloodEvent[];
  onVerify: (eventId: string, notes: string, analystId: string) => Promise<void>;
  onReject: (eventId: string, notes: string, analystId: string) => Promise<void>;
  onDispatchAlert: (eventId: string) => Promise<void>;
  selectedEventId?: string | null;
}

export const HumanVerificationModal: React.FC<HumanVerificationModalProps> = ({
  events,
  onVerify,
  onReject,
  onDispatchAlert,
  selectedEventId,
}) => {
  const [activeEventId, setActiveEventId] = useState<string>(
    selectedEventId || (events[0]?.id ?? '')
  );
  const [analystNotes, setAnalystNotes] = useState('');
  const [analystName, setAnalystName] = useState('Dr. S. Vance (Lead Hydrologist)');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter tabs
  const [filter, setFilter] = useState<'ALL' | 'CANDIDATE' | 'VERIFIED' | 'REJECTED'>('ALL');

  const filteredEvents = events.filter((e) => {
    if (filter === 'ALL') return true;
    if (filter === 'VERIFIED') return e.status === 'VERIFIED' || e.status === 'ALERT_DISPATCHED';
    return e.status === filter;
  });

  const activeEvent = events.find((e) => e.id === activeEventId) || filteredEvents[0];

  const handleVerify = async () => {
    if (!activeEvent) return;
    setIsProcessing(true);
    await onVerify(
      activeEvent.id,
      analystNotes || 'Verified: SAR specular reflection corroborated by GPM rain telemetry.',
      analystName
    );
    setAnalystNotes('');
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!activeEvent) return;
    setIsProcessing(true);
    await onReject(
      activeEvent.id,
      analystNotes || 'Rejected: Apparent water anomaly identified as temporary agricultural saturation or smooth pavement.',
      analystName
    );
    setAnalystNotes('');
    setIsProcessing(false);
  };

  const handleDispatch = async () => {
    if (!activeEvent) return;
    setIsProcessing(true);
    await onDispatchAlert(activeEvent.id);
    setIsProcessing(false);
  };

  return (
    <div className="bg-[#101622] border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Human-in-the-Loop Analyst Verification Desk
          </h3>
          <ProvenanceBadge type="PROCESSED" source="Analyst Audit Trail" />
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded">
          {(['ALL', 'CANDIDATE', 'VERIFIED', 'REJECTED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                filter === tab
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* Left Column: Events Queue (4 cols) */}
        <div className="lg:col-span-4 border-r border-slate-800/80 p-3 space-y-2 overflow-y-auto max-h-[600px]">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
            <span>Detection Queue ({filteredEvents.length})</span>
            <span>Candidate != Alert</span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500 font-mono">
              No events matching filter
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const isSelected = activeEvent?.id === evt.id;
              const isCandidate = evt.status === 'CANDIDATE';
              const isVerified = evt.status === 'VERIFIED';
              const isDispatched = evt.status === 'ALERT_DISPATCHED';

              return (
                <button
                  key={evt.id}
                  onClick={() => setActiveEventId(evt.id)}
                  className={`w-full text-left p-3 rounded border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500 text-white shadow-sm'
                      : 'bg-[#0b0e14] border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono font-bold text-xs text-slate-200">{evt.id}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        isDispatched
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : isVerified
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : isCandidate
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {evt.status}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-100 truncate">{evt.aoiName}</div>
                  <div className="text-[11px] text-cyan-400/90 truncate">{evt.basin}</div>

                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Risk: <strong className="text-rose-400">{evt.riskScore.toFixed(2)}</strong></span>
                    <span>+{evt.waterExpansionPct}% Expansion</span>
                    <span>{new Date(evt.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Analyst Inspection Workspace (8 cols) */}
        {activeEvent ? (
          <div className="lg:col-span-8 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Event Title Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-white">{activeEvent.id}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-xs text-cyan-400 font-semibold">{activeEvent.aoiName}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    River Basin: {activeEvent.basin} · Coordinates: {activeEvent.coordinates[0]}°N, {activeEvent.coordinates[1]}°E
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="text-slate-400">Detection Timestamp:</div>
                  <div className="text-slate-200">{new Date(activeEvent.detectedAt).toLocaleString()}</div>
                </div>
              </div>

              {/* Multi-Source Corroboration Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-[#0b0e14] border border-slate-800 p-2.5 rounded">
                  <div className="text-[10px] text-slate-400 uppercase">Risk Level</div>
                  <div className="text-lg font-bold text-rose-400 mt-0.5">
                    {activeEvent.riskScore.toFixed(2)} ({activeEvent.riskLevel})
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Confidence: {(activeEvent.confidence * 100).toFixed(0)}%</div>
                </div>

                <div className="bg-[#0b0e14] border border-slate-800 p-2.5 rounded">
                  <div className="text-[10px] text-slate-400 uppercase">SAR Flood Inundation</div>
                  <div className="text-lg font-bold text-cyan-400 mt-0.5">
                    {activeEvent.floodExtentKm2} km²
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">+{activeEvent.waterExpansionPct}% expansion</div>
                </div>

                <div className="bg-[#0b0e14] border border-slate-800 p-2.5 rounded">
                  <div className="text-[10px] text-slate-400 uppercase">24h Rainfall (GPM)</div>
                  <div className="text-lg font-bold text-sky-400 mt-0.5">
                    {activeEvent.rainfall24hMm} mm
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">IMERG 30-min aligned</div>
                </div>

                <div className="bg-[#0b0e14] border border-slate-800 p-2.5 rounded">
                  <div className="text-[10px] text-slate-400 uppercase">Topography Relief</div>
                  <div className="text-lg font-bold text-amber-400 mt-0.5">
                    {activeEvent.evidence.slope}° slope
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Elev: {activeEvent.evidence.elevation}m</div>
                </div>
              </div>

              {/* Before/After SAR Satellite Inspection Evidence */}
              <div className="bg-[#0b0e14] border border-slate-800 rounded p-3 text-xs space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-300">
                  <span className="flex items-center gap-1.5 font-semibold text-cyan-300">
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Evidence Checklist & Sensor Provenance</span>
                  </span>
                  <span>Scene: {activeEvent.evidence.sceneId}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
                  <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 rounded border border-slate-800">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Sentinel-1 VV/VH backscatter specular drop verified</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 rounded border border-slate-800">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Open-Meteo & NASA GPM rainfall corroboration</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 rounded border border-slate-800">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Copernicus DEM slope confirms alluvial floodplain retention</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 rounded border border-slate-800">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Historical flood frequency matches vulnerability profile</span>
                  </div>
                </div>
              </div>

              {/* Audit Trail if Verified / Rejected */}
              {activeEvent.verifiedBy && (
                <div className="bg-[#0b0e14] border border-slate-800 rounded p-3 text-xs font-mono space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase">Analyst Audit Verification Log</div>
                  <div className="text-slate-200">
                    Verified By: <strong className="text-cyan-300">{activeEvent.verifiedBy}</strong>
                  </div>
                  <div className="text-slate-400">
                    Notes: <span className="text-slate-300 italic">"{activeEvent.analystNotes}"</span>
                  </div>
                  {activeEvent.verifiedAt && (
                    <div className="text-slate-500 text-[10px]">
                      Timestamp: {new Date(activeEvent.verifiedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Analyst Review Form Actions */}
            <div className="border-t border-slate-800/80 pt-4 space-y-3">
              {activeEvent.status === 'CANDIDATE' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        Duty Analyst Signature:
                      </label>
                      <input
                        type="text"
                        value={analystName}
                        onChange={(e) => setAnalystName(e.target.value)}
                        className="w-full bg-[#0b0e14] border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        Technical Review Justification:
                      </label>
                      <input
                        type="text"
                        value={analystNotes}
                        onChange={(e) => setAnalystNotes(e.target.value)}
                        placeholder="e.g. SAR specular backscatter corroborates GPM rain accumulation"
                        className="w-full bg-[#0b0e14] border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100 font-sans focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                      onClick={handleReject}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-medium text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 rounded transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Event (False Alarm)</span>
                    </button>

                    <button
                      onClick={handleVerify}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-5 py-2 text-xs font-mono font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Verify Flood Event</span>
                    </button>
                  </div>
                </>
              ) : activeEvent.status === 'VERIFIED' ? (
                <div className="flex items-center justify-between bg-[#0b0e14] border border-emerald-900/50 p-3 rounded">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Event is VERIFIED by Analyst. Ready for Emergency Alert Dispatch.</span>
                  </div>

                  <button
                    onClick={handleDispatch}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-semibold text-white bg-red-600 hover:bg-red-500 rounded transition-colors shadow cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Dispatch Official Alert</span>
                  </button>
                </div>
              ) : activeEvent.status === 'ALERT_DISPATCHED' ? (
                <div className="bg-red-950/40 border border-red-800 p-3 rounded flex items-center justify-between text-xs font-mono text-red-300">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-red-400 animate-pulse" />
                    <span>ALERT ACTIVATED & BROADCAST TO DISASTER MANAGEMENT AUTHORITIES</span>
                  </div>
                  <span className="text-[11px] text-red-400">
                    Dispatched: {activeEvent.alertDispatchedAt ? new Date(activeEvent.alertDispatchedAt).toLocaleTimeString() : 'Recent'}
                  </span>
                </div>
              ) : (
                <div className="bg-slate-900/60 border border-slate-800 p-3 rounded text-xs font-mono text-slate-400">
                  This candidate was REJECTED by an analyst. No alert generated.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 p-10 flex items-center justify-center text-xs text-slate-500 font-mono">
            Select an event from the left queue to review evidence
          </div>
        )}
      </div>
    </div>
  );
};
