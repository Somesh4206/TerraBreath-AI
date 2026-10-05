import React from 'react';
import { ProvenanceType } from '../types/terrabreath';

interface ProvenanceBadgeProps {
  type: ProvenanceType;
  source?: string;
  className?: string;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ type, source, className = '' }) => {
  const config = {
    LIVE: {
      label: 'LIVE',
      border: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/40',
      description: 'Retrieved directly from external provider (CDSE / Open-Meteo / NASA)',
      dot: 'bg-emerald-400',
    },
    PROCESSED: {
      label: 'PROCESSED',
      border: 'border-sky-500/30 text-sky-400 bg-sky-950/40',
      description: 'Derived from real input data by TerraBreath geospatial algorithms',
      dot: 'bg-sky-400',
    },
    MODEL: {
      label: 'MODEL',
      border: 'border-purple-500/30 text-purple-400 bg-purple-950/40',
      description: 'Produced by an actual ML model (Otsu baseline, U-Net, or XGBoost)',
      dot: 'bg-purple-400',
    },
    SIMULATED: {
      label: 'SIMULATED',
      border: 'border-amber-500/30 text-amber-400 bg-amber-950/40',
      description: 'Explicitly generated for demonstration & test bench validation',
      dot: 'bg-amber-400',
    },
  }[type];

  return (
    <span
      title={source ? `${config.description} · Source: ${source}` : config.description}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider font-semibold border ${config.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>[{config.label}]</span>
      {source && (
        <span className="text-slate-400 text-[9px] font-normal border-l border-slate-700/60 pl-1.5 ml-0.5 hidden sm:inline">
          {source}
        </span>
      )}
    </span>
  );
};
