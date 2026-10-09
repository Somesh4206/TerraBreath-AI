import React from 'react';
import { Clock, RefreshCw, Satellite, Radio, CheckCircle2 } from 'lucide-react';
import { OrchestratorState } from '../types/terrabreath';
import { ProvenanceBadge } from './ProvenanceBadge';

interface OrchestratorRibbonProps {
  state: OrchestratorState | null;
  onRefresh: () => void;
  onToggle: () => void;
}

export const OrchestratorRibbon: React.FC<OrchestratorRibbonProps> = ({ state, onRefresh, onToggle }) => {
  if (!state) return null;

  const minutes = Math.floor(state.secondsUntilNextCycle / 60);
  const seconds = state.secondsUntilNextCycle % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="bg-[#0e131d] border-b border-slate-800/80 px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Status dot */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {state.isActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                state.isActive ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <span className="font-mono text-slate-300 font-medium">
            {state.isActive ? '● ORCHESTRATOR ACTIVE' : '▲ ORCHESTRATOR PAUSED'}
          </span>
        </div>

        <span className="text-slate-700 hidden sm:inline">|</span>

        {/* 3-minute schedule note */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next provider check in:</span>
          <span className="font-mono font-semibold text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
            {formattedTime}
          </span>
          <span className="text-[11px] text-slate-500">(3-min NRT cycle)</span>
        </div>

        <span className="text-slate-700 hidden sm:inline">|</span>

        {/* Latest scene */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <Satellite className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Latest STAC Granule:</span>
          <span className="font-mono text-slate-200 truncate max-w-[200px]" title={state.latestSceneIngested}>
            {state.latestSceneIngested}
          </span>
          <ProvenanceBadge type="LIVE" source="CDSE" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          {state.isActive ? 'Pause Scheduler' : 'Resume Scheduler'}
        </button>
        <button
          onClick={onRefresh}
          className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
          title="Refresh state"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
