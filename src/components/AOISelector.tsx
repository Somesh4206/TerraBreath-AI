import React from 'react';
import { MapPin, Waves, Mountain, AlertCircle } from 'lucide-react';
import { AreaOfInterest } from '../types/terrabreath';
import { AREAS_OF_INTEREST } from '../data/aoiList';
import { ProvenanceBadge } from './ProvenanceBadge';
import { ExportPdfButton } from './ExportPdfButton';
import { ReportData } from '../services/pdfReportGenerator';

interface AOISelectorProps {
  selectedAoi: AreaOfInterest;
  onSelectAoi: (aoi: AreaOfInterest) => void;
  isLoading: boolean;
  reportData?: ReportData;
}

export const AOISelector: React.FC<AOISelectorProps> = ({
  selectedAoi,
  onSelectAoi,
  isLoading,
  reportData,
}) => {
  return (
    <div className="bg-[#101622] border border-slate-800 rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Area of Interest (AOI) & River Basin
          </h2>
          <ProvenanceBadge type="LIVE" source="CDSE AOI" />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Coord: {selectedAoi.center[0].toFixed(3)}°N, {selectedAoi.center[1].toFixed(3)}°E
          </span>
          {reportData && (
            <ExportPdfButton reportData={reportData} variant="primary" />
          )}
        </div>
      </div>

      {/* AOI Selector Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
        {AREAS_OF_INTEREST.map((aoi) => {
          const isSelected = aoi.id === selectedAoi.id;
          return (
            <button
              key={aoi.id}
              onClick={() => onSelectAoi(aoi)}
              disabled={isLoading}
              className={`p-2 rounded text-left border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <div className="text-xs font-semibold truncate text-slate-100">{aoi.name.split(' - ')[0]}</div>
              <div className="text-[11px] text-cyan-400/90 truncate">{aoi.basin}</div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{aoi.country}</span>
                <span className="font-mono text-amber-400/90">★ {aoi.historicalFloodFrequency}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected AOI Context Bar */}
      <div className="bg-[#0b0e14] border border-slate-800/80 rounded p-2.5 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <span className="font-semibold text-slate-200">{selectedAoi.name}</span>
            <span className="text-slate-500 mx-2">·</span>
            <span className="text-slate-400">{selectedAoi.basin}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-400 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Mountain className="w-3.5 h-3.5 text-slate-500" />
            <span>Elev: {selectedAoi.elevationRangeMeters[0]} - {selectedAoi.elevationRangeMeters[1]}m</span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-300">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Hist. Risk Index: {selectedAoi.historicalFloodFrequency}/10</span>
          </div>
        </div>

        <div className="w-full text-[11px] text-slate-400 border-t border-slate-800/60 pt-1.5 mt-0.5">
          <span className="text-slate-500">Vulnerability Dynamics: </span>
          <span className="text-slate-300">{selectedAoi.primaryVulnerabilityFactor}</span>
        </div>
      </div>
    </div>
  );
};
