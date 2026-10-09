import React from 'react';
import { Mountain, Compass, GitBranch, ArrowDownRight } from 'lucide-react';
import { CopernicusDemMetrics } from '../types/terrabreath';
import { ProvenanceBadge } from './ProvenanceBadge';

interface TerrainCardProps {
  dem: CopernicusDemMetrics | null;
}

export const TerrainCard: React.FC<TerrainCardProps> = ({ dem }) => {
  if (!dem) {
    return (
      <div className="bg-[#101622] border border-slate-800 rounded-lg p-5 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-slate-800 rounded"></div>
      </div>
    );
  }

  const isHighTwi = dem.topographicWetnessIndex > 12.0;

  return (
    <div className="bg-[#101622] border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Mountain className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Copernicus DEM GLO-30 Topography & Drainage
          </h3>
          <ProvenanceBadge type="PROCESSED" source="Copernicus DEM" />
        </div>
        <span className="text-xs font-mono text-slate-400">
          Relief: {dem.slopeCategory}
        </span>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#0b0e14] border border-slate-800 p-2.5 rounded">
            <div className="text-slate-400 text-[10px] uppercase font-mono">Mean Basin Elevation</div>
            <div className="text-lg font-mono font-bold text-slate-100 mt-0.5">
              {dem.meanElevationM} <span className="text-xs font-normal text-slate-400">m</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              Range: {dem.minElevationM}m - {dem.maxElevationM}m
            </div>
          </div>

          <div className="bg-[#0b0e14] border border-slate-800 p-2.5 rounded">
            <div className="text-slate-400 text-[10px] uppercase font-mono">Average Slope Gradient</div>
            <div className="text-lg font-mono font-bold text-slate-100 mt-0.5">
              {dem.meanSlopeDegrees} <span className="text-xs font-normal text-slate-400">deg</span>
            </div>
            <div className="text-[10px] font-mono mt-1 text-cyan-400">
              {dem.meanSlopeDegrees < 3.0 ? 'High retention basin' : 'Fast-draining slope'}
            </div>
          </div>

          <div className="bg-[#0b0e14] border border-slate-800 p-2.5 rounded">
            <div className="text-slate-400 text-[10px] uppercase font-mono">Topographic Wetness (TWI)</div>
            <div
              className={`text-lg font-mono font-bold mt-0.5 ${
                isHighTwi ? 'text-rose-400' : 'text-slate-100'
              }`}
            >
              {dem.topographicWetnessIndex}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              {isHighTwi ? 'Severe runoff pooling' : 'Moderate soil drainage'}
            </div>
          </div>

          <div className="bg-[#0b0e14] border border-slate-800 p-2.5 rounded">
            <div className="text-slate-400 text-[10px] uppercase font-mono">Drainage Network Density</div>
            <div className="text-lg font-mono font-bold text-slate-100 mt-0.5">
              {dem.drainageDensityKmPerKm2} <span className="text-xs font-normal text-slate-400">km/km²</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              Stream tributary density
            </div>
          </div>
        </div>

        {/* Scientific Hydrological Context Box */}
        <div className="bg-[#0b0e14] border border-slate-800/80 rounded p-3 text-xs text-slate-300">
          <div className="flex items-center gap-2 mb-1 text-slate-200 font-semibold font-mono text-[11px] uppercase">
            <ArrowDownRight className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hydraulic Runoff Interaction Principle</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            In TerraBreath, heavy rainfall over steep terrain creates flash torrents with short concentration times, whereas over flat alluvial lowlands (TWI &gt; 12, slope &lt; 2°), identical precipitation yields prolonged standing water and levee saturation. This terrain modulation directly weights the AI risk model.
          </p>
        </div>
      </div>
    </div>
  );
};
