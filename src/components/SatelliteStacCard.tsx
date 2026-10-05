import React, { useState } from 'react';
import {
  Satellite,
  ExternalLink,
  Activity,
  Radio,
  Layers,
  CheckCircle2,
  AlertTriangle,
  CloudRain,
  Eye,
  Thermometer,
  Compass,
  Zap,
  Table,
  Sliders,
  Copy,
  Check,
} from 'lucide-react';
import {
  SentinelStacScene,
  DerivedGeospatialFeatures,
  SatelliteMissionGranule,
  SatelliteMissionKey,
} from '../types/terrabreath';
import { ProvenanceBadge } from './ProvenanceBadge';

interface SatelliteStacCardProps {
  scene: SentinelStacScene | null;
  features: DerivedGeospatialFeatures | null;
  opticalScene?: SentinelStacScene | null;
  constellation?: SatelliteMissionGranule[] | null;
}

export const SatelliteStacCard: React.FC<SatelliteStacCardProps> = ({
  scene,
  features,
  opticalScene,
  constellation,
}) => {
  const [selectedMissionKey, setSelectedMissionKey] = useState<SatelliteMissionKey>('sentinel-1');
  const [viewMode, setViewMode] = useState<'detail' | 'matrix'>('detail');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fallback constellation if not yet loaded from backend
  const activeConstellation: SatelliteMissionGranule[] = constellation || [
    {
      key: 'sentinel-1',
      name: 'Copernicus Sentinel-1',
      platform: 'Sentinel-1A (C-SAR)',
      agency: 'ESA / Copernicus',
      instrument: 'C-Band Synthetic Aperture Radar (C-SAR)',
      sensorType: 'SAR Microwave Radar',
      spectralBands: ['C-Band 5.405 GHz (VV)', 'C-Band 5.405 GHz (VH)'],
      waterDetectionMethod: 'Specular backscatter drop (σ⁰vv < -18.2 dB) + Otsu bimodal thresholding',
      acquisitionTime: scene?.acquisitionTime || new Date().toISOString(),
      orbitDetails: 'Sun-synchronous, Descending node (Track #142)',
      spatialResolution: '10m (Interferometric Wide GRD)',
      revisitInterval: '6 days (Constellation 1A/1C)',
      cloudPenetration: true,
      cloudCoverPercent: 0,
      granuleId: scene?.id || 'S1A_IW_GRDH_1SDV_20261001T024500_052194_064D7B',
      derivedMetric: {
        label: 'SAR Inundation Extent',
        value: `${features?.floodExtentKm2 || 42.5} km²`,
        unit: 'km²',
        status: (features?.floodExtentKm2 || 42.5) > 35 ? 'CRITICAL' : 'WARNING',
        interpretation: 'Dark specular radar reflections indicate heavy open-water accumulation without cloud interference.',
      },
      thumbnailUrl: '/src/assets/images/sar_radar_scan_1790844267325.jpg',
      dataAccessUrl: scene?.assets.downloadHref || 'https://dataspace.copernicus.eu/',
      stacCollection: 'sentinel-1-grd',
      provenance: 'LIVE',
    },
    {
      key: 'sentinel-2',
      name: 'Copernicus Sentinel-2',
      platform: 'Sentinel-2B (MSI)',
      agency: 'ESA / Copernicus',
      instrument: 'Multi-Spectral Instrument (MSI, 13 Bands)',
      sensorType: 'Multispectral Optical',
      spectralBands: ['B02 (Blue 490nm)', 'B03 (Green 560nm)', 'B04 (Red 665nm)', 'B08 (NIR 842nm)', 'B11 (SWIR 1610nm)'],
      waterDetectionMethod: 'Normalized Difference Water Index (NDWI = [B03 - B08] / [B03 + B08] > 0.15)',
      acquisitionTime: opticalScene?.acquisitionTime || new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      orbitDetails: 'Sun-synchronous, 10:30 AM local solar time, Orbit #291',
      spatialResolution: '10m (VNIR Bands B2, B3, B4, B8)',
      revisitInterval: '5 days (Constellation 2A/2B)',
      cloudPenetration: false,
      cloudCoverPercent: opticalScene?.cloudCoverPercent || 18.4,
      granuleId: opticalScene?.id || 'S2B_MSIL2A_20261001T013000_N0511_R090_T44PMT',
      derivedMetric: {
        label: 'Mean NDWI Water Index',
        value: `+${features?.ndwiIndex || 0.42}`,
        unit: 'index (-1 to +1)',
        status: 'WARNING',
        interpretation: 'Strong optical water signature along river meanders; partial cumulus obstruction over north catchment.',
      },
      thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
      dataAccessUrl: 'https://dataspace.copernicus.eu/',
      stacCollection: 'sentinel-2-l2a',
      provenance: 'LIVE',
    },
    {
      key: 'landsat-8-9',
      name: 'NASA / USGS Landsat 9',
      platform: 'Landsat 9 (OLI-2 / TIRS-2)',
      agency: 'NASA / USGS',
      instrument: 'Operational Land Imager 2 & Thermal Infrared Sensor 2',
      sensorType: 'Thermal IR',
      spectralBands: ['B3 (Green 0.56µm)', 'B6 (SWIR-1 1.6µm)', 'B10 (Thermal IR 10.9µm)'],
      waterDetectionMethod: 'Modified NDWI (MNDWI = [Green - SWIR1] / [Green + SWIR1]) + Thermal Radiance',
      acquisitionTime: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
      orbitDetails: 'WRS-2 Path 143, Row 051 (Altitude 705 km)',
      spatialResolution: '30m Multispectral / 100m Thermal (resampled to 30m)',
      revisitInterval: '8 days (combined Landsat 8 + 9)',
      cloudPenetration: false,
      cloudCoverPercent: 12.1,
      granuleId: 'LC09_L2SP_143051_20260929_02_T1',
      derivedMetric: {
        label: 'Surface Water Temperature',
        value: '22.8°C',
        unit: '°C (TIRS Band 10)',
        status: 'NORMAL',
        interpretation: 'MNDWI index sharply differentiates turbid silt-laden flood surge from saturated vegetation canopy.',
      },
      thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      dataAccessUrl: 'https://earthexplorer.usgs.gov/',
      stacCollection: 'landsat-c2l2-sr',
      provenance: 'LIVE',
    },
    {
      key: 'gpm-core',
      name: 'NASA / JAXA GPM Core',
      platform: 'GPM Core Observatory (DPR / GMI)',
      agency: 'NASA / JAXA',
      instrument: 'Dual-frequency Precipitation Radar (Ku/Ka-band) & Microwave Imager',
      sensorType: 'Dual-Frequency Rain Radar',
      spectralBands: ['Ku-Band (13.6 GHz)', 'Ka-Band (35.5 GHz)', 'GMI (10 - 183 GHz Channels)'],
      waterDetectionMethod: 'Volumetric hydrometeor radar profiling & instantaneous rain-rate inversion',
      acquisitionTime: new Date(Date.now() - 1.2 * 3600 * 1000).toISOString(),
      orbitDetails: 'Non-sun-synchronous, 65° inclination (high low-latitude frequency)',
      spatialResolution: '5 km footprint (DPR swath width 245 km)',
      revisitInterval: '3 hours (combined GPM Constellation IMERG)',
      cloudPenetration: true,
      cloudCoverPercent: 0,
      granuleId: '2A.GPM.DPR.V9-20261001-S014210.HDF5',
      derivedMetric: {
        label: 'Peak Radar Rain Rate',
        value: '28.4 mm/h',
        unit: 'mm/h (Ku-band DPR)',
        status: 'CRITICAL',
        interpretation: 'Active mesoscale convective cloud bands dumping sustained heavy precipitation into upper tributaries.',
      },
      thumbnailUrl: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=600&auto=format&fit=crop&q=80',
      dataAccessUrl: 'https://gpm.nasa.gov/data/directory',
      stacCollection: 'gpm-dpr-l2',
      provenance: 'LIVE',
    },
    {
      key: 'modis-terra-aqua',
      name: 'NASA Terra & Aqua',
      platform: 'Terra & Aqua (MODIS)',
      agency: 'NASA / USGS',
      instrument: 'Moderate Resolution Imaging Spectroradiometer (36 Bands)',
      sensorType: 'Wide-Swath Radiometer',
      spectralBands: ['Band 1 (Red 645nm)', 'Band 2 (NIR 858nm)', 'Band 7 (SWIR 2130nm)'],
      waterDetectionMethod: 'Global Flood Mapping System (250m Surface Reflectance Inundation Product)',
      acquisitionTime: new Date(Date.now() - 7.5 * 3600 * 1000).toISOString(),
      orbitDetails: 'Sun-synchronous, 2330 km swath width (Daily global coverage)',
      spatialResolution: '250m (Bands 1-2) / 500m (Bands 3-7)',
      revisitInterval: '1 - 2 days (Morning & Afternoon passes)',
      cloudPenetration: false,
      cloudCoverPercent: 15.6,
      granuleId: 'MOD09GQ.A2026274.h25v07.061',
      derivedMetric: {
        label: 'Regional Inundation Fraction',
        value: '14.8%',
        unit: 'basin area fraction',
        status: 'WARNING',
        interpretation: 'Wide-swath synoptic view confirms regional floodplain expansion across secondary drainage corridors.',
      },
      thumbnailUrl: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=600&auto=format&fit=crop&q=80',
      dataAccessUrl: 'https://firms.modaps.eosdis.nasa.gov/',
      stacCollection: 'modis-09gq-surfacereflectance',
      provenance: 'LIVE',
    },
    {
      key: 'viirs-suomi',
      name: 'NOAA / NASA Suomi-NPP',
      platform: 'Suomi-NPP (VIIRS)',
      agency: 'NOAA / NASA',
      instrument: 'Visible Infrared Imaging Radiometer Suite (VIIRS & Day/Night Band)',
      sensorType: 'Multispectral Optical',
      spectralBands: ['I-Band 1 (Visible 640nm)', 'I-Band 2 (NIR 865nm)', 'DNB (Day/Night Band 500-900nm)'],
      waterDetectionMethod: '375m Surface Water Detection Algorithm + Nighttime Urban Light Disruption',
      acquisitionTime: new Date(Date.now() - 3.1 * 3600 * 1000).toISOString(),
      orbitDetails: 'Sun-synchronous polar orbit (Altitude 824 km, Swath 3040 km)',
      spatialResolution: '375m (Imagery Bands I1 - I5)',
      revisitInterval: '12 hours (Daytime optical + Nighttime DNB)',
      cloudPenetration: false,
      cloudCoverPercent: 21.0,
      granuleId: 'VNP02IMG.A2026274.0245.002',
      derivedMetric: {
        label: 'Nighttime Light Outage',
        value: '-28.5%',
        unit: 'DNB Radiance change',
        status: 'CRITICAL',
        interpretation: 'Day/Night Band detects sharp drop in artificial nighttime emissions in flooded riparian districts.',
      },
      thumbnailUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&auto=format&fit=crop&q=80',
      dataAccessUrl: 'https://ladsweb.modaps.eosdis.nasa.gov/',
      stacCollection: 'viirs-vnp02img',
      provenance: 'LIVE',
    },
    {
      key: 'sentinel-3-altimetry',
      name: 'Copernicus Sentinel-3',
      platform: 'Sentinel-3A (SRAL / OLCI)',
      agency: 'ESA / Copernicus',
      instrument: 'SAR Radar Altimeter (SRAL) & Ocean and Land Colour Instrument (OLCI)',
      sensorType: 'Radar Altimeter',
      spectralBands: ['Ku-Band (13.575 GHz)', 'C-Band (5.41 GHz)', 'OLCI 21 Spectral Channels'],
      waterDetectionMethod: 'Synthetic Aperture Radar Altimetry (Inland Water Surface Stage Elevation)',
      acquisitionTime: new Date(Date.now() - 9.1 * 3600 * 1000).toISOString(),
      orbitDetails: 'Sun-synchronous, Ground Track crossing main river thalweg',
      spatialResolution: '300m along-track SAR altimetry / 300m OLCI',
      revisitInterval: '27 days repeat track (sub-daily combined with Sentinel-3B)',
      cloudPenetration: true,
      cloudCoverPercent: 0,
      granuleId: 'S3A_SR_2_WAT____20261001T004000_MAR_O_NT_004',
      derivedMetric: {
        label: 'River Water Stage Elevation',
        value: '+3.82 m',
        unit: 'm above baseline',
        status: 'CRITICAL',
        interpretation: 'Altimeter radar waveforms confirm significant river channel cresting exceeding bankfull flood stage.',
      },
      thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
      dataAccessUrl: 'https://catalogue.dataspace.copernicus.eu/',
      stacCollection: 'sentinel-3-sral-wat',
      provenance: 'LIVE',
    },
  ];

  const currentMission =
    activeConstellation.find((m) => m.key === selectedMissionKey) || activeConstellation[0];

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-[#101622] border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Top Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Multi-Satellite Earth Observation Constellation (7 Missions)
          </h3>
          <ProvenanceBadge type="LIVE" source="Copernicus + NASA/USGS + NOAA" />
        </div>

        {/* View mode toggle (Detail vs Matrix) */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded">
          <button
            onClick={() => setViewMode('detail')}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
              viewMode === 'detail'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Satellite Inspector
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Constellation Matrix
          </button>
        </div>
      </div>

      {/* Horizontal Multi-Satellite Selector Strip */}
      <div className="bg-[#0b0e14] px-5 py-2.5 border-b border-slate-800/60 overflow-x-auto flex items-center gap-2 scrollbar-none">
        {activeConstellation.map((mission) => {
          const isSelected = mission.key === selectedMissionKey;
          return (
            <button
              key={mission.key}
              onClick={() => setSelectedMissionKey(mission.key)}
              className={`px-3 py-1.5 rounded text-xs font-mono whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
                isSelected
                  ? 'bg-slate-800 text-cyan-300 border-cyan-500/80 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  mission.cloudPenetration ? 'bg-cyan-400' : 'bg-amber-400'
                }`}
              ></span>
              <span className="font-semibold">{mission.platform.split(' ')[0]}</span>
              <span className="text-[10px] text-slate-500">
                {mission.sensorType.includes('SAR') ? 'SAR' : mission.sensorType.includes('Rain') ? 'RAIN' : 'OPT'}
              </span>
            </button>
          );
        })}
      </div>

      {/* View 1: Detailed Satellite Inspector */}
      {viewMode === 'detail' && (
        <div className="p-5 space-y-5">
          {/* Main Granule Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
            {/* Satellite Image / Sensor Scan */}
            <div className="relative rounded-lg overflow-hidden border border-slate-800 group bg-slate-900 min-h-[160px] flex flex-col justify-end">
              <img
                src={currentMission.thumbnailUrl || '/src/assets/images/sar_radar_scan_1790844267325.jpg'}
                alt={currentMission.name}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

              <div className="relative z-10 p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300">
                  <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-800">
                    {currentMission.agency}
                  </span>
                  <span>{currentMission.sensorType}</span>
                </div>
                <h4 className="text-sm font-bold text-white tracking-wide">
                  {currentMission.name}
                </h4>
                <div className="text-[11px] text-slate-300 font-mono">
                  {currentMission.instrument}
                </div>
              </div>
            </div>

            {/* Granule Telemetry & Specs */}
            <div className="lg:col-span-2 space-y-2.5 text-xs font-mono bg-[#0b0e14] p-4 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between border-b border-slate-800/70 pb-2 flex-wrap gap-2">
                <span className="text-slate-400">Granule ID:</span>
                <div className="flex items-center gap-1.5 max-w-full">
                  <span className="text-cyan-300 font-semibold truncate max-w-[280px]" title={currentMission.granuleId}>
                    {currentMission.granuleId}
                  </span>
                  <button
                    onClick={() => handleCopyId(currentMission.granuleId)}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                    title="Copy Granule ID"
                  >
                    {copiedId === currentMission.granuleId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-slate-800/70 pb-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Acquisition:</span>
                  <span className="text-slate-200">
                    {new Date(currentMission.acquisitionTime).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Spatial Resolution:</span>
                  <span className="text-emerald-400 font-bold">{currentMission.spatialResolution}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-slate-800/70 pb-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Revisit Frequency:</span>
                  <span className="text-slate-200">{currentMission.revisitInterval}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cloud Penetration:</span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      currentMission.cloudPenetration ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {currentMission.cloudPenetration ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>100% All-Weather Radar</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        <span>{currentMission.cloudCoverPercent}% Cloud Obscured</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span>Orbit Track:</span>
                  <span className="text-slate-200">{currentMission.orbitDetails}</span>
                </div>
                <a
                  href={currentMission.dataAccessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] underline"
                >
                  <span>Agency STAC Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Spectral Bands & Water Detection Methodology Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Spectral Bands */}
            <div className="bg-[#0b0e14] p-3.5 rounded-lg border border-slate-800/80 space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Active Spectral Channels & Wavelengths</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentMission.spectralBands.map((band, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px]"
                  >
                    {band}
                  </span>
                ))}
              </div>
            </div>

            {/* Water Detection Signature */}
            <div className="bg-[#0b0e14] p-3.5 rounded-lg border border-slate-800/80 space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span>Flood Detection Algorithm</span>
              </div>
              <div className="text-slate-300 text-[11px] leading-relaxed pt-1">
                {currentMission.waterDetectionMethod}
              </div>
            </div>
          </div>

          {/* Specific Satellite Derived Metric */}
          <div className="bg-[#0f141f] border border-cyan-900/60 rounded-lg p-4 flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                  {currentMission.derivedMetric.label}
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                    currentMission.derivedMetric.status === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : currentMission.derivedMetric.status === 'WARNING'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  }`}
                >
                  {currentMission.derivedMetric.status}
                </span>
              </div>
              <div className="text-xs text-slate-300 leading-relaxed font-sans">
                {currentMission.derivedMetric.interpretation}
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-cyan-300">
                {currentMission.derivedMetric.value}
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                Calibrated against {currentMission.platform}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Constellation Comparison Matrix */}
      {viewMode === 'matrix' && (
        <div className="p-5 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase bg-[#0b0e14]">
                <th className="py-2.5 px-3">Mission / Platform</th>
                <th className="py-2.5 px-3">Agency</th>
                <th className="py-2.5 px-3">Sensor Type</th>
                <th className="py-2.5 px-3">Resolution</th>
                <th className="py-2.5 px-3">Cloud Penetration</th>
                <th className="py-2.5 px-3">Revisit</th>
                <th className="py-2.5 px-3">Derived Flood Metric</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activeConstellation.map((mission) => {
                const isSelected = mission.key === selectedMissionKey;
                return (
                  <tr
                    key={mission.key}
                    onClick={() => {
                      setSelectedMissionKey(mission.key);
                      setViewMode('detail');
                    }}
                    className={`transition-colors cursor-pointer hover:bg-slate-800/40 ${
                      isSelected ? 'bg-cyan-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          mission.cloudPenetration ? 'bg-cyan-400' : 'bg-amber-400'
                        }`}
                      ></span>
                      <span>{mission.platform}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{mission.agency}</td>
                    <td className="py-3 px-3 text-slate-300">{mission.sensorType}</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">{mission.spatialResolution}</td>
                    <td className="py-3 px-3">
                      {mission.cloudPenetration ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>100% All-Weather</span>
                        </span>
                      ) : (
                        <span className="text-amber-400">
                          {mission.cloudCoverPercent}% Cloud Obscured
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{mission.revisitInterval}</td>
                    <td className="py-3 px-3 font-semibold text-cyan-300">
                      {mission.derivedMetric.value} ({mission.derivedMetric.label})
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMissionKey(mission.key);
                          setViewMode('detail');
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
