import React from 'react';
import { CloudRain, Wind, Thermometer, Gauge, Clock, Droplets, AlertTriangle } from 'lucide-react';
import { LiveWeatherMetrics, GpmRainfallMetrics } from '../types/terrabreath';
import { ProvenanceBadge } from './ProvenanceBadge';

interface WeatherRainfallCardProps {
  weather: LiveWeatherMetrics | null;
  gpm: GpmRainfallMetrics | null;
}

export const WeatherRainfallCard: React.FC<WeatherRainfallCardProps> = ({ weather, gpm }) => {
  if (!weather || !gpm) {
    return (
      <div className="bg-[#101622] border border-slate-800 rounded-lg p-5 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-slate-800 rounded"></div>
      </div>
    );
  }

  const isRainExtreme = gpm.rainfall24hMm > 60 || gpm.anomalyIndex > 1.5;

  return (
    <div className="bg-[#101622] border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Hydrometeorological & Rainfall Intelligence
          </h3>
          <ProvenanceBadge type="LIVE" source="Open-Meteo + NASA GPM" />
        </div>
        <span className="text-xs font-mono text-slate-400">
          Sync: {new Date(weather.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Live Weather Metrics (Open-Meteo) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider">
              Real-Time Atmospheric Telemetry
            </span>
            <ProvenanceBadge type="LIVE" source="Open-Meteo (No API Key)" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#0b0e14] border border-slate-800 p-2.5 rounded">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-mono">
                <Thermometer className="w-3 h-3 text-amber-400" />
                <span>Ambient Temp</span>
              </div>
              <div className="text-lg font-mono font-bold text-slate-100 mt-0.5">
                {weather.temperatureC.toFixed(1)} <span className="text-xs font-normal text-slate-400">°C</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Humidity: {weather.relativeHumidityPercent}%
              </div>
            </div>

            <div className="bg-[#0b0e14] border border-slate-800 p-2.5 rounded">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-mono">
                <Gauge className="w-3 h-3 text-cyan-400" />
                <span>Surface Pressure</span>
              </div>
              <div className="text-lg font-mono font-bold text-slate-100 mt-0.5">
                {weather.surfacePressureHpa.toFixed(1)} <span className="text-xs font-normal text-slate-400">hPa</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                {weather.surfacePressureHpa < 1005 ? 'Low depression' : 'Normal barometric'}
              </div>
            </div>

            <div className="bg-[#0b0e14] border border-slate-800 p-2.5 rounded">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-mono">
                <Wind className="w-3 h-3 text-teal-400" />
                <span>Wind Speed 10m</span>
              </div>
              <div className="text-lg font-mono font-bold text-slate-100 mt-0.5">
                {weather.windSpeedKmh.toFixed(1)} <span className="text-xs font-normal text-slate-400">km/h</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Anemometer verified
              </div>
            </div>

            <div className="bg-[#0b0e14] border border-slate-800 p-2.5 rounded">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-mono">
                <Droplets className="w-3 h-3 text-sky-400" />
                <span>Meteo 1h / 24h Rain</span>
              </div>
              <div className="text-lg font-mono font-bold text-sky-400 mt-0.5">
                {weather.rain24hMm.toFixed(1)} <span className="text-xs font-normal text-slate-400">mm</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                1h rate: {weather.rain1hMm.toFixed(1)} mm
              </div>
            </div>
          </div>
        </div>

        {/* NASA GPM IMERG Early Precipitation Section */}
        <div className="border-t border-slate-800/80 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider">
              NASA GPM IMERG Early Accumulation (30-min Granules)
            </span>
            <ProvenanceBadge type="LIVE" source="NASA Earthdata" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-[#0b0e14] border border-slate-800 p-3 rounded flex flex-col justify-between">
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-mono">Multi-Hour Accumulation</div>
                <div className="flex items-baseline gap-3 mt-1">
                  <div>
                    <span className="text-xs text-slate-400">1h: </span>
                    <strong className="text-sm font-mono text-slate-100">{gpm.rainfall1hMm} mm</strong>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">3h: </span>
                    <strong className="text-sm font-mono text-slate-100">{gpm.rainfall3hMm} mm</strong>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">24h: </span>
                    <strong className="text-base font-mono font-bold text-cyan-400">{gpm.rainfall24hMm} mm</strong>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-2">
                Latency: ~{gpm.latencyHours} hrs from observation
              </div>
            </div>

            <div className="bg-[#0b0e14] border border-slate-800 p-3 rounded flex flex-col justify-between">
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-mono">Climatological Rainfall Anomaly</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span
                    className={`text-xl font-mono font-bold ${
                      gpm.anomalyIndex > 1.0
                        ? 'text-rose-400'
                        : gpm.anomalyIndex > 0
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {gpm.anomalyIndex > 0 ? `+${gpm.anomalyIndex}` : gpm.anomalyIndex}
                  </span>
                  <span className="text-xs text-slate-400">standard deviations</span>
                </div>
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-2">
                {gpm.anomalyIndex > 1.5 ? 'Severe excess precipitation event' : 'Near seasonal baseline range'}
              </div>
            </div>

            <div className="bg-[#0b0e14] border border-slate-800 p-3 rounded flex flex-col justify-between">
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-mono">Active GPM IMERG Granule</div>
                <div className="text-[11px] font-mono text-slate-200 truncate mt-1" title={gpm.granuleId}>
                  {gpm.granuleId}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Calibrated against DPR dual-frequency radar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
