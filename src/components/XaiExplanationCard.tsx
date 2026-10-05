import React, { useState } from 'react';
import { Sparkles, FileText, CheckCircle2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { XaiExplanation, RiskAssessment } from '../types/terrabreath';
import { ProvenanceBadge } from './ProvenanceBadge';

interface XaiExplanationCardProps {
  xai: XaiExplanation | null;
  risk: RiskAssessment | null;
  aoiName: string;
}

export const XaiExplanationCard: React.FC<XaiExplanationCardProps> = ({ xai, risk, aoiName }) => {
  const [showRawJson, setShowRawJson] = useState(false);

  if (!xai || !risk) {
    return (
      <div className="bg-[#101622] border border-slate-800 rounded-lg p-5 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-slate-800 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#101622] border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Explainable AI (XAI) Analyst Synthesis
          </h3>
          <ProvenanceBadge type="MODEL" source={xai.geminiPowered ? 'Gemini 3.8 Flash' : 'Rule-Based XAI'} />
        </div>
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{showRawJson ? 'Hide Evidence JSON' : 'Inspect Evidence JSON'}</span>
          {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Core Analyst Summary Quote */}
        <div className="bg-[#0b0e14] border-l-2 border-cyan-500 rounded-r p-4 text-xs">
          <div className="text-[10px] font-mono uppercase text-cyan-400 font-semibold mb-1 tracking-wider">
            Operational Summary for Duty Hydrologist
          </div>
          <p className="text-slate-200 text-sm leading-relaxed font-sans">
            "{xai.analystSummary}"
          </p>
        </div>

        {/* Primary Observable Drivers */}
        <div>
          <div className="text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider mb-2">
            Multi-Source Corroborating Evidence
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {xai.primaryDrivers.map((driver, idx) => (
              <div
                key={idx}
                className="bg-[#0b0e14] border border-slate-800/90 rounded p-3 text-xs flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 leading-snug">{driver}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scientific Rationale Detail */}
        <div className="bg-[#0b0e14] border border-slate-800 rounded p-3 text-xs">
          <div className="text-[10px] font-mono uppercase text-slate-400 mb-1 tracking-wider">
            Hydrometeorological Grounding Rationale
          </div>
          <p className="text-slate-400 leading-relaxed font-sans text-xs whitespace-pre-line">
            {xai.scientificRationale}
          </p>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-cyan-300">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Recommended Action: {xai.recommendedAnalystAction}</span>
            </span>
            <span className="text-slate-500 hidden sm:inline">Engine: {xai.modelUsed}</span>
          </div>
        </div>

        {/* Raw Evidence JSON Inspector */}
        {showRawJson && (
          <div className="border-t border-slate-800/80 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Ground-Truth Evidence JSON (Input to LLM)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Strict Deterministic Boundary</span>
            </div>
            <pre className="bg-[#080b11] p-3 rounded text-[11px] font-mono text-cyan-300/90 overflow-x-auto max-h-60 border border-slate-800/80">
              {JSON.stringify(
                {
                  aoi: aoiName,
                  risk_assessment: {
                    score: risk.riskScore,
                    level: risk.riskLevel,
                    confidence: risk.confidenceScore,
                    quality: risk.dataQuality,
                  },
                  formula_weights: risk.formulaBreakdown.weights,
                  attributions: risk.featureAttributions,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
