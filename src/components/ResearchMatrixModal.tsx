import React from 'react';
import { Microscope, Award, ArrowUpRight, CheckCircle2, TrendingUp } from 'lucide-react';
import { RESEARCH_EXPERIMENTS } from '../data/experimentsData';
import { ProvenanceBadge } from './ProvenanceBadge';

export const ResearchMatrixModal: React.FC = () => {
  return (
    <div className="bg-[#101622] border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Microscope className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Empirical Research Experiment Matrix: Sensor Fusion Benchmarks
          </h3>
          <ProvenanceBadge type="MODEL" source="Validation Testbed (N=1,420)" />
        </div>
        <span className="text-xs font-mono text-slate-400">
          Ablation Study (Exp A → Exp D)
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Research Context Callout */}
        <div className="bg-[#0b0e14] border border-slate-800 rounded p-4 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center gap-2 font-mono text-cyan-400 font-semibold uppercase text-[11px]">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ablation Hypothesis & Statistical Grounding</span>
          </div>
          <p className="text-slate-400 leading-relaxed font-sans text-xs">
            To prove that multi-source Earth observation sensor fusion provides statistically superior disaster detection compared to standalone optical or radar models, TerraBreath benchmarks four incremental configurations across 1,420 historical Sentinel-1 granules with ground-truth flood delineations.
          </p>
        </div>

        {/* Comparative Benchmark Table */}
        <div className="bg-[#0b0e14] border border-slate-800 rounded overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Experiment Setup</th>
                <th className="py-2.5 px-3">Input Modalities</th>
                <th className="py-2.5 px-3">Precision</th>
                <th className="py-2.5 px-3">Recall</th>
                <th className="py-2.5 px-3">F1 Score</th>
                <th className="py-2.5 px-3">Mean IoU</th>
                <th className="py-2.5 px-3">False Pos.</th>
                <th className="py-2.5 px-3">False Neg.</th>
                <th className="py-2.5 px-3 text-right">Inference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {RESEARCH_EXPERIMENTS.map((exp) => {
                const isOptimal = exp.id === 'exp-d';
                return (
                  <tr
                    key={exp.id}
                    className={`transition-colors ${
                      isOptimal ? 'bg-cyan-950/20 font-semibold' : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <td className="py-3 px-3 text-slate-100 flex items-center gap-1.5">
                      {isOptimal && <Award className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>{exp.name.split(':')[0]}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 max-w-[200px] truncate" title={exp.featuresUsed.join(', ')}>
                      {exp.featuresUsed.join(' + ')}
                    </td>
                    <td className="py-3 px-3 text-slate-200">{(exp.precision * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3 text-slate-200">{(exp.recall * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3">
                      <span className={isOptimal ? 'text-cyan-300 font-bold' : 'text-slate-200'}>
                        {(exp.f1Score * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={isOptimal ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                        {(exp.meanIoU * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-rose-400">{exp.falsePositivesPct}%</td>
                    <td className="py-3 px-3 text-amber-400">{exp.falseNegativesPct}%</td>
                    <td className="py-3 px-3 text-right text-slate-400">{exp.avgInferenceLatencyMs} ms</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Experiment Detailed Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {RESEARCH_EXPERIMENTS.map((exp) => (
            <div
              key={exp.id}
              className={`p-4 rounded border text-xs font-mono space-y-2 ${
                exp.id === 'exp-d'
                  ? 'bg-cyan-950/20 border-cyan-500/60'
                  : 'bg-[#0b0e14] border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">{exp.name}</span>
                <span className="text-cyan-400 font-semibold">F1: {(exp.f1Score * 100).toFixed(1)}%</span>
              </div>
              <p className="text-slate-400 text-xs font-sans leading-relaxed">
                {exp.description}
              </p>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>False Positives: <strong className="text-rose-400">{exp.falsePositivesPct}%</strong></span>
                <span>IoU: <strong className="text-emerald-400">{(exp.meanIoU * 100).toFixed(1)}%</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
