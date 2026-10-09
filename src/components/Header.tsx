import React from 'react';
import { Play, ShieldAlert, Cpu } from 'lucide-react';
import { ExportPdfButton } from './ExportPdfButton';
import { ReportData } from '../services/pdfReportGenerator';

interface HeaderProps {
  activeTab: 'overview' | 'satellite' | 'weather' | 'risk' | 'verification' | 'research' | 'grounding';
  setActiveTab: (tab: 'overview' | 'satellite' | 'weather' | 'risk' | 'verification' | 'research' | 'grounding') => void;
  candidateCount: number;
  onTriggerCycle: () => void;
  isTriggering: boolean;
  reportData?: ReportData;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  candidateCount,
  onTriggerCycle,
  isTriggering,
  reportData,
}) => {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-[#0b0e14]/90 backdrop-blur-md border-b border-slate-800">
      {/* Zone 1: Single Text Element Wordmark */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setActiveTab('overview');
        }}
        className="text-lg font-bold tracking-tight text-white flex items-center gap-2"
      >
        <span className="text-cyan-400">TerraBreath</span>
        <span className="text-slate-400 font-normal">AI</span>
      </a>

      {/* Zone 2: 4-6 Clean Text Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('overview')}
          className={`transition-colors hover:text-white cursor-pointer ${
            activeTab === 'overview' ? 'text-cyan-400 font-semibold border-b border-cyan-400 pb-0.5' : ''
          }`}
        >
          Mission Console
        </button>
        <button
          onClick={() => setActiveTab('satellite')}
          className={`transition-colors hover:text-white cursor-pointer ${
            activeTab === 'satellite' ? 'text-cyan-400 font-semibold border-b border-cyan-400 pb-0.5' : ''
          }`}
        >
          Satellites (7 Missions)
        </button>
        <button
          onClick={() => setActiveTab('weather')}
          className={`transition-colors hover:text-white cursor-pointer ${
            activeTab === 'weather' ? 'text-cyan-400 font-semibold border-b border-cyan-400 pb-0.5' : ''
          }`}
        >
          Weather & GPM
        </button>
        <button
          onClick={() => setActiveTab('risk')}
          className={`transition-colors hover:text-white cursor-pointer ${
            activeTab === 'risk' ? 'text-cyan-400 font-semibold border-b border-cyan-400 pb-0.5' : ''
          }`}
        >
          Risk Engine & XAI
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          className={`transition-colors hover:text-white cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'verification' ? 'text-cyan-400 font-semibold border-b border-cyan-400 pb-0.5' : ''
          }`}
        >
          <span>Human Verification</span>
          {candidateCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded">
              {candidateCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('grounding')}
          className={`transition-colors hover:text-white cursor-pointer ${
            activeTab === 'grounding' ? 'text-cyan-400 font-semibold border-b border-cyan-400 pb-0.5' : ''
          }`}
        >
          Grounded Intel
        </button>
        <button
          onClick={() => setActiveTab('research')}
          className={`transition-colors hover:text-white cursor-pointer ${
            activeTab === 'research' ? 'text-cyan-400 font-semibold border-b border-cyan-400 pb-0.5' : ''
          }`}
        >
          Research Matrix
        </button>
      </nav>

      {/* Zone 3: 1-2 Primary Actions + PDF Export */}
      <div className="flex items-center gap-2.5">
        {reportData && (
          <ExportPdfButton reportData={reportData} variant="compact" />
        )}

        <button
          onClick={onTriggerCycle}
          disabled={isTriggering}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded transition-colors disabled:opacity-50 cursor-pointer"
          title="Trigger a near-real-time 3-minute ingestion cycle check"
        >
          <Play className={`w-3.5 h-3.5 text-cyan-400 ${isTriggering ? 'animate-spin' : ''}`} />
          <span>{isTriggering ? 'Ingesting...' : 'Run Cycle'}</span>
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors shadow-sm cursor-pointer"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Review Events</span>
        </button>
      </div>
    </header>
  );
};
