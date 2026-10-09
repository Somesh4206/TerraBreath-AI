import React from 'react';
import { ShieldAlert, BarChart3, Sliders, CheckCircle2, AlertOctagon } from 'lucide-react';
import { RiskAssessment, RiskLevel } from '../types/terrabreath';
import { ProvenanceBadge } from './ProvenanceBadge';
import { NotificationSubscriptionPanel } from './NotificationSubscriptionPanel';

interface RiskEngineCardProps {
  risk: RiskAssessment | null;
  aoiName?: string;
}

export const RiskEngineCard: React.FC<RiskEngineCardProps> = ({ risk, aoiName }) => {
  if (!risk) {
    return (
      <div className="bg-[#101622] border border-slate-800 rounded-lg p-5 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-slate-800 rounded"></div>
      </div>
    );
  }

  const { riskScore, riskLevel, confidenceScore, formulaBreakdown, featureAttributions } = risk;
  const { weights, satelliteScore, rainfallScore, terrainScore, historicalScore, qualityScore } = formulaBreakdown;

  const levelStyles: Record<RiskLevel, { text: string; bg: string; border: string }> = {
    LOW: { text: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/40' },
    MEDIUM: { text: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-500/40' },
    HIGH: { text: 'text-orange-400', bg: 'bg-orange-950/40', border: 'border-orange-500/40' },
    CRITICAL: { text: 'text-rose-400', bg: 'bg-rose-950/40', border: 'border-rose-500/40' },
  };

  const currentStyle = levelStyles[riskLevel];

  return (
    <div className="bg-[#101622] border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Multi-Source Risk Engine (Deterministic Weighted Formula)
          </h3>
          <ProvenanceBadge type="MODEL" source="Rule Formula + XGBoost" />
        </div>
        <span className="text-xs font-mono text-slate-400">
          Confidence: {(confidenceScore * 100).toFixed(0)}%
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Risk Score Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className={`p-4 rounded-lg border ${currentStyle.border} ${currentStyle.bg} flex flex-col items-center justify-center text-center`}>
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
              Aggregated Risk Assessment
            </span>
            <div className={`text-4xl font-mono font-bold mt-1 ${currentStyle.text}`}>
              {riskScore.toFixed(2)}
            </div>
            <div className="text-xs font-mono font-semibold uppercase tracking-wider mt-1 px-2.5 py-0.5 rounded bg-black/40 border border-slate-700/50">
              {riskLevel} RISK
            </div>
            <span className="text-[10px] text-slate-400 mt-2 font-mono">
              Threshold: {riskLevel === 'CRITICAL' ? '≥ 0.75' : riskLevel === 'HIGH' ? '0.50 - 0.74' : riskLevel === 'MEDIUM' ? '0.25 - 0.49' : '< 0.25'}
            </span>
          </div>

          {/* Formula Breakdown Progress Bars */}
          <div className="md:col-span-2 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800">
              <span>EVIDENCE COMPONENT</span>
              <span>WEIGHT & RAW SCORE</span>
            </div>

            {/* 1. Satellite Evidence (40%) */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">1. Satellite SAR & Optical ({Math.round(weights.satelliteEvidence * 100)}%)</span>
                <span className="text-cyan-400 font-semibold">{satelliteScore.toFixed(2)} → +{(satelliteScore * weights.satelliteEvidence).toFixed(3)}</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${satelliteScore * 100}%` }}></div>
              </div>
            </div>

            {/* 2. Rainfall Evidence (25%) */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">2. Precipitation & GPM IMERG ({Math.round(weights.rainfallEvidence * 100)}%)</span>
                <span className="text-sky-400 font-semibold">{rainfallScore.toFixed(2)} → +{(rainfallScore * weights.rainfallEvidence).toFixed(3)}</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${rainfallScore * 100}%` }}></div>
              </div>
            </div>

            {/* 3. Terrain Vulnerability (15%) */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">3. Copernicus DEM Relief & TWI ({Math.round(weights.terrainVulnerability * 100)}%)</span>
                <span className="text-amber-400 font-semibold">{terrainScore.toFixed(2)} → +{(terrainScore * weights.terrainVulnerability).toFixed(3)}</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${terrainScore * 100}%` }}></div>
              </div>
            </div>

            {/* 4. Historical Vulnerability (10%) */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">4. Historical Flood Recurrence ({Math.round(weights.historicalVulnerability * 100)}%)</span>
                <span className="text-purple-400 font-semibold">{historicalScore.toFixed(2)} → +{(historicalScore * weights.historicalVulnerability).toFixed(3)}</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${historicalScore * 100}%` }}></div>
              </div>
            </div>

            {/* 5. Sensor Data Quality (10%) */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">5. Sensor Latency & Integrity ({Math.round(weights.dataQuality * 100)}%)</span>
                <span className="text-emerald-400 font-semibold">{qualityScore.toFixed(2)} → +{(qualityScore * weights.dataQuality).toFixed(3)}</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${qualityScore * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Attributions Table */}
        <div className="border-t border-slate-800/80 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider">
              SHAP-Style Feature Attributions & Evidence Tracing
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Deterministic XAI Evidence</span>
          </div>

          <div className="bg-[#0b0e14] border border-slate-800 rounded overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Observable Variable</th>
                  <th className="py-2 px-3">Measured Value</th>
                  <th className="py-2 px-3">Weight</th>
                  <th className="py-2 px-3 text-right">Directional Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {featureAttributions.map((attr, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 text-slate-200 font-medium">{attr.feature}</td>
                    <td className="py-2 px-3 text-cyan-300">{attr.value}</td>
                    <td className="py-2 px-3 text-slate-400">{attr.weightPct}%</td>
                    <td className="py-2 px-3 text-right">
                      {attr.impact === 'INCREASES_RISK' ? (
                        <span className="text-rose-400 font-semibold">▲ Elevates Risk</span>
                      ) : attr.impact === 'DECREASES_RISK' ? (
                        <span className="text-emerald-400 font-semibold">▼ Mitigates Risk</span>
                      ) : (
                        <span className="text-slate-400">● Nominal Weight</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Automated Critical Alert Notification Subscription Component */}
        <NotificationSubscriptionPanel risk={risk} aoiName={aoiName} />
      </div>
    </div>
  );
};
