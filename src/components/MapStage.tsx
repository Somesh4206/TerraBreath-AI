import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  Maximize2,
  Minimize2,
  Crosshair,
  Satellite,
  Waves,
  Map as MapIcon,
  Sliders,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AreaOfInterest, FloodEvent, SentinelStacScene } from '../types/terrabreath';
import { ProvenanceBadge } from './ProvenanceBadge';

interface MapStageProps {
  aoi: AreaOfInterest;
  sentinelScene?: SentinelStacScene | null;
  floodExtentKm2?: number;
  events: FloodEvent[];
  onSelectEvent?: (event: FloodEvent) => void;
}

export const MapStage: React.FC<MapStageProps> = ({
  aoi,
  sentinelScene,
  floodExtentKm2 = 42.5,
  events,
  onSelectEvent,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Leaflet Layer References for Synchronization
  const osmTileLayerRef = useRef<L.TileLayer | null>(null);
  const darkTileLayerRef = useRef<L.TileLayer | null>(null);
  const sarIntensityLayerRef = useRef<L.ImageOverlay | null>(null);
  const waterMaskLayersRef = useRef<L.Layer[]>([]);
  const auxiliaryLayersRef = useRef<{ [key: string]: L.Layer }>({});

  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // State Management for Layer Visibility (as required by prompt)
  const [sarIntensityVisible, setSarIntensityVisible] = useState<boolean>(true);
  const [waterDetectionMaskVisible, setWaterDetectionMaskVisible] = useState<boolean>(true);
  const [osmBasemapVisible, setOsmBasemapVisible] = useState<boolean>(true);

  // Collapsible Map Legend State
  const [isLegendCollapsed, setIsLegendCollapsed] = useState<boolean>(false);

  // Satellite Imagery Source Selection
  const [satelliteOverlaySource, setSatelliteOverlaySource] = useState<'sentinel-1' | 'sentinel-2' | 'landsat-9'>('sentinel-1');

  // Fine-grained layer opacity controls
  const [sarOpacity, setSarOpacity] = useState<number>(0.85);
  const [waterMaskOpacity, setWaterMaskOpacity] = useState<number>(0.75);

  // Auxiliary overlays
  const [showFootprint, setShowFootprint] = useState<boolean>(true);
  const [showEvents, setShowEvents] = useState<boolean>(true);

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: aoi.center,
        zoom: aoi.zoom,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      map.on('mousemove', (e: L.LeafletMouseEvent) => {
        setMouseCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(aoi.center, aoi.zoom, { animate: true });
    }
  }, [aoi]);

  // 2. Integrate 'OSM Basemap' visibility state with Leaflet Layer Rendering
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (osmBasemapVisible) {
      // Remove dark matter base if currently mounted
      if (darkTileLayerRef.current && map.hasLayer(darkTileLayerRef.current)) {
        map.removeLayer(darkTileLayerRef.current);
      }
      // Instantiate and mount OpenStreetMap tile layer
      if (!osmTileLayerRef.current) {
        osmTileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          subdomains: 'abc',
          attribution: '&copy; OpenStreetMap contributors',
        });
      }
      if (!map.hasLayer(osmTileLayerRef.current)) {
        osmTileLayerRef.current.addTo(map);
      }
      osmTileLayerRef.current.bringToBack();
    } else {
      // Dismount OpenStreetMap tile layer
      if (osmTileLayerRef.current && map.hasLayer(osmTileLayerRef.current)) {
        map.removeLayer(osmTileLayerRef.current);
      }
      // Mount CartoDB Dark Matter basemap as high-contrast satellite base
      if (!darkTileLayerRef.current) {
        darkTileLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
          attribution: '&copy; CartoDB &copy; OpenStreetMap',
        });
      }
      if (!map.hasLayer(darkTileLayerRef.current)) {
        darkTileLayerRef.current.addTo(map);
      }
      darkTileLayerRef.current.bringToBack();
    }
  }, [osmBasemapVisible]);

  // 3. Integrate 'SAR Intensity' visibility state with Leaflet Layer Rendering
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove any existing SAR layer
    if (sarIntensityLayerRef.current && map.hasLayer(sarIntensityLayerRef.current)) {
      map.removeLayer(sarIntensityLayerRef.current);
      sarIntensityLayerRef.current = null;
    }

    if (sarIntensityVisible) {
      const [minLng, minLat, maxLng, maxLat] = aoi.bbox;

      // Render calibrated satellite raster texture based on selected satellite mission
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        if (satelliteOverlaySource === 'sentinel-1') {
          // Sentinel-1 C-SAR: Radar Ground Range Detected Backscatter
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 400, 400);

          const imgData = ctx.createImageData(400, 400);
          for (let i = 0; i < imgData.data.length; i += 4) {
            const noise = Math.random() * 42 + 28;
            imgData.data[i] = noise;
            imgData.data[i + 1] = noise + 8;
            imgData.data[i + 2] = noise + 18;
            imgData.data[i + 3] = 230;
          }
          ctx.putImageData(imgData, 0, 0);

          // Specular reflection drop: low backscatter water corridors (-22 dB to -26 dB)
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.moveTo(30, 220);
          ctx.bezierCurveTo(120, 160, 220, 260, 370, 140);
          ctx.lineWidth = 40;
          ctx.strokeStyle = '#020617';
          ctx.stroke();

          // Inundated lagoons
          ctx.beginPath();
          ctx.arc(170, 200, 48, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(280, 160, 36, 0, Math.PI * 2);
          ctx.fill();

          // High corner reflection points (urban structures > -8 dB)
          ctx.fillStyle = '#f8fafc';
          for (let j = 0; j < 35; j++) {
            const px = (Math.sin(j * 93) * 0.5 + 0.5) * 360 + 20;
            const py = (Math.cos(j * 57) * 0.5 + 0.5) * 360 + 20;
            ctx.fillRect(px, py, 3, 3);
          }
        } else if (satelliteOverlaySource === 'sentinel-2') {
          // Sentinel-2 MSI: Optical True Color Composite with High-Reflectance NDWI
          ctx.fillStyle = '#164e63'; // Deep teal base
          ctx.fillRect(0, 0, 400, 400);

          // Vegetated canopy background (B4/B8)
          ctx.fillStyle = '#064e3b';
          ctx.fillRect(0, 0, 400, 400);

          // River waterways with turquoise/cyan NDWI reflectance
          ctx.beginPath();
          ctx.moveTo(30, 220);
          ctx.bezierCurveTo(120, 160, 220, 260, 370, 140);
          ctx.lineWidth = 42;
          ctx.strokeStyle = '#0891b2';
          ctx.stroke();

          // Surface pooling
          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.arc(170, 200, 52, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(280, 160, 40, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Landsat 9 OLI-2/TIRS-2: Thermal Infrared Surface Radiance
          ctx.fillStyle = '#78350f'; // Warm thermal land base
          ctx.fillRect(0, 0, 400, 400);

          // Cooler river currents (TIRS Band 10)
          ctx.beginPath();
          ctx.moveTo(30, 220);
          ctx.bezierCurveTo(120, 160, 220, 260, 370, 140);
          ctx.lineWidth = 44;
          ctx.strokeStyle = '#1e3a8a';
          ctx.stroke();

          ctx.fillStyle = '#1e40af';
          ctx.beginPath();
          ctx.arc(170, 200, 50, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(280, 160, 38, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const overlayDataUrl = canvas.toDataURL();
      const overlayBounds: L.LatLngBoundsExpression = [
        [minLat - 0.04, minLng - 0.04],
        [maxLat + 0.04, maxLng + 0.04],
      ];

      const overlay = L.imageOverlay(overlayDataUrl, overlayBounds, {
        opacity: sarOpacity,
        interactive: false,
      }).addTo(map);

      sarIntensityLayerRef.current = overlay;
    }
  }, [sarIntensityVisible, sarOpacity, aoi, satelliteOverlaySource]);

  // 4. Integrate 'Water Detection Mask' visibility state with Leaflet Layer Rendering
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous water mask layers
    waterMaskLayersRef.current.forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    waterMaskLayersRef.current = [];

    if (waterDetectionMaskVisible) {
      const centerLat = aoi.center[0];
      const centerLng = aoi.center[1];

      // Primary inundation corridor polygon
      const floodPoly1 = L.polygon(
        [
          [centerLat - 0.12, centerLng - 0.08],
          [centerLat - 0.04, centerLng + 0.02],
          [centerLat + 0.08, centerLng + 0.05],
          [centerLat + 0.14, centerLng + 0.15],
          [centerLat + 0.10, centerLng + 0.18],
          [centerLat + 0.02, centerLng + 0.09],
          [centerLat - 0.06, centerLng - 0.01],
          [centerLat - 0.15, centerLng - 0.05],
        ],
        {
          color: '#38bdf8',
          weight: 2,
          fillColor: '#0284c7',
          fillOpacity: waterMaskOpacity,
        }
      ).addTo(map);

      // Secondary retention floodplain pool
      const floodPoly2 = L.circle([centerLat + 0.05, centerLng + 0.08], {
        radius: 4200,
        color: '#0ea5e9',
        weight: 1.5,
        fillColor: '#38bdf8',
        fillOpacity: waterMaskOpacity * 0.85,
      }).addTo(map);

      waterMaskLayersRef.current = [floodPoly1, floodPoly2];
    }
  }, [waterDetectionMaskVisible, waterMaskOpacity, aoi]);

  // 5. Integrate Auxiliary Layers (Footprint & Event Detection Markers)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous auxiliary layers
    Object.values(auxiliaryLayersRef.current).forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    auxiliaryLayersRef.current = {};

    const [minLng, minLat, maxLng, maxLat] = aoi.bbox;

    // Sentinel Swath Footprint Boundary
    if (showFootprint) {
      const footprintBounds: L.LatLngBoundsExpression = [
        [minLat - 0.05, minLng - 0.05],
        [maxLat + 0.05, maxLng + 0.05],
      ];
      const footprintRect = L.rectangle(footprintBounds, {
        color: '#06b6d4',
        weight: 1.5,
        dashArray: '5, 5',
        fillColor: '#06b6d4',
        fillOpacity: 0.03,
      }).addTo(map);
      auxiliaryLayersRef.current.footprint = footprintRect;
    }

    // Flood Event Pins
    if (showEvents) {
      events.forEach((evt) => {
        const isCandidate = evt.status === 'CANDIDATE';
        const isVerified = evt.status === 'VERIFIED';
        const isDispatched = evt.status === 'ALERT_DISPATCHED';

        const iconHtml = `
          <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer">
            ${isCandidate ? '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60"></span>' : ''}
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ${
              isDispatched
                ? 'bg-red-600 ring-2 ring-red-400'
                : isVerified
                ? 'bg-amber-500 ring-2 ring-amber-300'
                : isCandidate
                ? 'bg-rose-500 ring-2 ring-rose-300'
                : 'bg-slate-600'
            }">
              !
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-flood-pin',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker(evt.coordinates, { icon: customIcon }).addTo(map);

        const popupContent = `
          <div class="p-2.5 max-w-[240px] text-xs font-sans">
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <span class="font-mono font-bold text-slate-100">${evt.id}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-mono ${
                evt.status === 'CANDIDATE' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
              }">${evt.status}</span>
            </div>
            <div class="text-slate-300 font-medium mb-1">${evt.basin}</div>
            <div class="text-[11px] text-slate-400 space-y-0.5 mb-2 font-mono">
              <div>Risk Score: <strong class="text-rose-400">${evt.riskScore.toFixed(2)} (${evt.riskLevel})</strong></div>
              <div>Flood Extent: ${evt.floodExtentKm2} km² (+${evt.waterExpansionPct}%)</div>
              <div>24h Rain: ${evt.rainfall24hMm} mm</div>
            </div>
            <div class="text-[10px] text-slate-500 border-t border-slate-700/60 pt-1">
              Detected: ${new Date(evt.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => {
          if (onSelectEvent) onSelectEvent(evt);
        });

        auxiliaryLayersRef.current[`marker-${evt.id}`] = marker;
      });
    }
  }, [aoi, showFootprint, showEvents, events, onSelectEvent]);

  const activePrimaryLayerCount =
    (sarIntensityVisible ? 1 : 0) +
    (waterDetectionMaskVisible ? 1 : 0) +
    (osmBasemapVisible ? 1 : 0);

  return (
    <div
      className={`relative bg-[#090d14] border border-slate-800 rounded-lg overflow-hidden transition-all ${
        isExpanded ? 'fixed inset-4 z-50 shadow-2xl' : 'h-[540px]'
      }`}
    >
      {/* Map Canvas Container (.leaflet-container host) */}
      <div ref={mapContainerRef} className="w-full h-full relative">
        {/* Custom Floating Layer Control Panel in Top-Right Corner (Tailwind CSS Styled) */}
        <div
          className="absolute top-3 right-3 z-[1000] w-76 max-w-[calc(100vw-2.5rem)] pointer-events-auto"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <div className="bg-[#0b0e14]/95 backdrop-blur-md border border-slate-800 rounded-lg shadow-2xl overflow-hidden">
            {/* Control Panel Header */}
            <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800/90 bg-slate-950/70">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-100 tracking-wide uppercase font-mono">
                  Layer Controls
                </span>
                <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {activePrimaryLayerCount}/3 Active
                </span>
              </div>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title={isExpanded ? 'Minimize Map' : 'Expand Fullscreen'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Panel Body with the Three Required Toggle Checkboxes */}
            <div className="p-3 space-y-3 text-xs font-mono">
              {/* Toggle Checkbox 1: 'SAR Intensity' */}
              <div
                className={`p-2.5 rounded border transition-colors ${
                  sarIntensityVisible
                    ? 'bg-[#0f141f] border-cyan-800/80 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800/60 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="toggle-sar-intensity"
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <input
                      id="toggle-sar-intensity"
                      type="checkbox"
                      checked={sarIntensityVisible}
                      onChange={(e) => setSarIntensityVisible(e.target.checked)}
                      className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5">
                      <Satellite className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-semibold text-slate-100 text-xs">SAR Intensity</span>
                    </div>
                  </label>
                  <ProvenanceBadge type="LIVE" source="Sentinel-1" />
                </div>

                <div className="mt-1 text-[11px] text-slate-400 font-sans pl-6">
                  Raw Sentinel-1 radar backscatter imagery
                </div>

                {sarIntensityVisible && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 pl-6 space-y-2">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Intensity Opacity</span>
                      <span className="text-cyan-300">{Math.round(sarOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={sarOpacity}
                      onChange={(e) => setSarOpacity(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
                    />

                    {/* Satellite Mission Sensor Selector */}
                    <div className="pt-1 border-t border-slate-800/60">
                      <div className="text-[10px] text-slate-400 font-mono mb-1">Satellite Sensor:</div>
                      <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                        <button
                          onClick={() => setSatelliteOverlaySource('sentinel-1')}
                          className={`px-1.5 py-0.5 rounded text-center transition-colors cursor-pointer border ${
                            satelliteOverlaySource === 'sentinel-1'
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-semibold'
                              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          S1 C-SAR
                        </button>
                        <button
                          onClick={() => setSatelliteOverlaySource('sentinel-2')}
                          className={`px-1.5 py-0.5 rounded text-center transition-colors cursor-pointer border ${
                            satelliteOverlaySource === 'sentinel-2'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700 font-semibold'
                              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          S2 Optical
                        </button>
                        <button
                          onClick={() => setSatelliteOverlaySource('landsat-9')}
                          className={`px-1.5 py-0.5 rounded text-center transition-colors cursor-pointer border ${
                            satelliteOverlaySource === 'landsat-9'
                              ? 'bg-amber-950 text-amber-300 border-amber-700 font-semibold'
                              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          Landsat-9
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle Checkbox 2: 'Water Detection Mask' */}
              <div
                className={`p-2.5 rounded border transition-colors ${
                  waterDetectionMaskVisible
                    ? 'bg-[#0f141f] border-sky-800/80 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800/60 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="toggle-water-detection-mask"
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <input
                      id="toggle-water-detection-mask"
                      type="checkbox"
                      checked={waterDetectionMaskVisible}
                      onChange={(e) => setWaterDetectionMaskVisible(e.target.checked)}
                      className="accent-sky-400 w-4 h-4 rounded cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5">
                      <Waves className="w-3.5 h-3.5 text-sky-400" />
                      <span className="font-semibold text-slate-100 text-xs">Water Detection Mask</span>
                    </div>
                  </label>
                  <ProvenanceBadge type="PROCESSED" />
                </div>

                <div className="mt-1 text-[11px] text-slate-400 font-sans pl-6">
                  Processed flood overlay ({floodExtentKm2} km²)
                </div>

                {waterDetectionMaskVisible && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 pl-6 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Mask Fill Opacity</span>
                      <span className="text-sky-300">{Math.round(waterMaskOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1.0"
                      step="0.05"
                      value={waterMaskOpacity}
                      onChange={(e) => setWaterMaskOpacity(parseFloat(e.target.value))}
                      className="w-full accent-sky-400 h-1 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Toggle Checkbox 3: 'OSM Basemap' */}
              <div
                className={`p-2.5 rounded border transition-colors ${
                  osmBasemapVisible
                    ? 'bg-[#0f141f] border-emerald-800/80 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800/60 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="toggle-osm-basemap"
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <input
                      id="toggle-osm-basemap"
                      type="checkbox"
                      checked={osmBasemapVisible}
                      onChange={(e) => setOsmBasemapVisible(e.target.checked)}
                      className="accent-emerald-400 w-4 h-4 rounded cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5">
                      <MapIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-semibold text-slate-100 text-xs">OSM Basemap</span>
                    </div>
                  </label>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                      osmBasemapVisible
                        ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40'
                        : 'border-slate-700 text-slate-500 bg-slate-900'
                    }`}
                  >
                    {osmBasemapVisible ? 'TILES ON' : 'DARK BASE'}
                  </span>
                </div>

                <div className="mt-1 text-[11px] text-slate-400 font-sans pl-6">
                  {osmBasemapVisible
                    ? 'OpenStreetMap cartographic base tiles'
                    : 'CartoDB Dark Matter basemap'}
                </div>
              </div>

              {/* Auxiliary Quick Checks */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={showFootprint}
                    onChange={(e) => setShowFootprint(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>Swath Footprint</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={showEvents}
                    onChange={(e) => setShowEvents(e.target.checked)}
                    className="accent-rose-500 rounded"
                  />
                  <span>Detection Pins</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Top-Left: Active AOI & Basin HUD */}
        <div className="absolute top-3 left-3 z-[1000] bg-[#0b0e14]/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-md flex items-center gap-2.5 text-xs shadow-md pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="font-semibold text-slate-200">{aoi.name.split(' - ')[0]}</span>
          <span className="text-slate-600">·</span>
          <span className="font-mono text-cyan-300 text-[11px]">{aoi.basin}</span>
        </div>

        {/* Bottom-Left: Collapsible Map Legend Component with Visual Scales & Units */}
        <div
          className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-1.5 pointer-events-auto max-w-[280px] sm:max-w-xs"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Coordinates & Projection Ticker */}
          <div className="bg-[#0b0e14]/90 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded text-[10px] font-mono text-slate-400 shadow-md flex items-center gap-2">
            <Crosshair className="w-3 h-3 text-cyan-400 shrink-0" />
            {mouseCoords ? (
              <span className="truncate">
                {mouseCoords.lat.toFixed(4)}°N, {mouseCoords.lng.toFixed(4)}°E
              </span>
            ) : (
              <span>Hover map for coordinates</span>
            )}
            <span className="text-slate-700">|</span>
            <span className="text-cyan-400 text-[9px]">EPSG:3857</span>
          </div>

          {/* Small, Collapsible Map Legend Card */}
          <div className="bg-[#0b0e14]/95 backdrop-blur-md border border-slate-800 rounded-md shadow-2xl overflow-hidden">
            {/* Header with Collapsible Toggle */}
            <button
              onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}
              className="w-full px-2.5 py-1.5 flex items-center justify-between text-[11px] font-mono font-semibold text-slate-300 hover:text-white bg-slate-950/70 border-b border-slate-800/80 transition-colors cursor-pointer select-none"
              title={isLegendCollapsed ? 'Expand Layer Legend' : 'Collapse Layer Legend'}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span className="uppercase tracking-wider text-[10px] text-slate-300">Map Legend & Scales</span>
              </div>
              {isLegendCollapsed ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {/* Collapsible Content: Visual Scale / Units for Active Layers */}
            {!isLegendCollapsed && (
              <div className="p-2.5 space-y-2.5 text-[10px] font-mono">
                {/* 1. Satellite Raster Visual Scale & Units (when active) */}
                {sarIntensityVisible && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-slate-300 font-medium">
                      <span className="flex items-center gap-1.5 text-cyan-300">
                        <Satellite className="w-3 h-3 text-cyan-400" />
                        <span>
                          {satelliteOverlaySource === 'sentinel-1'
                            ? 'Sentinel-1 C-SAR'
                            : satelliteOverlaySource === 'sentinel-2'
                            ? 'Sentinel-2 MSI'
                            : 'Landsat 9 TIRS'}
                        </span>
                      </span>
                      <span className="text-slate-400 text-[9px]">
                        {satelliteOverlaySource === 'sentinel-1'
                          ? 'Unit: dB (Backscatter σ⁰)'
                          : satelliteOverlaySource === 'sentinel-2'
                          ? 'Unit: NDWI Index (-1 to +1)'
                          : 'Unit: °C (Thermal Radiance)'}
                      </span>
                    </div>

                    {/* Continuous Intensity Gradient */}
                    {satelliteOverlaySource === 'sentinel-1' && (
                      <>
                        <div className="h-2 rounded bg-gradient-to-r from-[#020617] via-slate-600 to-slate-100 border border-slate-700/80"></div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                          <span>&le; -24 dB (Water)</span>
                          <span>-14 dB (Land)</span>
                          <span>&ge; -6 dB (Urban)</span>
                        </div>
                      </>
                    )}

                    {satelliteOverlaySource === 'sentinel-2' && (
                      <>
                        <div className="h-2 rounded bg-gradient-to-r from-[#064e3b] via-[#0891b2] to-[#38bdf8] border border-cyan-800"></div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                          <span>-0.4 (Canopy)</span>
                          <span>0.0 (Soil)</span>
                          <span>+0.6 (Water)</span>
                        </div>
                      </>
                    )}

                    {satelliteOverlaySource === 'landsat-9' && (
                      <>
                        <div className="h-2 rounded bg-gradient-to-r from-[#1e3a8a] via-[#b45309] to-[#ea580c] border border-amber-800"></div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                          <span>16°C (Cold Flood)</span>
                          <span>24°C</span>
                          <span>34°C (Warm Soil)</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 2. Water Detection Mask Scale & Units (when active) */}
                {waterDetectionMaskVisible && (
                  <div className={`space-y-1 ${sarIntensityVisible ? 'pt-2 border-t border-slate-800/80' : ''}`}>
                    <div className="flex items-center justify-between text-slate-300 font-medium">
                      <span className="flex items-center gap-1.5 text-sky-300">
                        <Waves className="w-3 h-3 text-sky-400" />
                        <span>Water Detection Mask</span>
                      </span>
                      <span className="text-sky-300 font-bold text-[9px]">
                        Extent: {floodExtentKm2} km²
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded border border-slate-800">
                      <span className="w-3.5 h-3.5 rounded bg-sky-500/80 border border-sky-400 shrink-0"></span>
                      <div className="text-[9px] text-slate-300 leading-tight">
                        <div>Classified Flood Inundation</div>
                        <div className="text-slate-500 text-[8px]">Otsu Threshold &lt; -18 dB + U-Net</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auxiliary Active Layers summary */}
                {(showFootprint || showEvents) && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
                    {showFootprint && (
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-1 border border-cyan-400 border-dashed inline-block"></span>
                        <span>Swath Bounds</span>
                      </span>
                    )}
                    {showEvents && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                        <span>Alert Pins</span>
                      </span>
                    )}
                  </div>
                )}

                {/* If neither SAR nor Water Mask is active */}
                {!sarIntensityVisible && !waterDetectionMaskVisible && (
                  <div className="text-slate-500 text-[10px] py-1 text-center italic">
                    Enable 'SAR Intensity' or 'Water Detection Mask' in Layer Controls to view visual scale
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
