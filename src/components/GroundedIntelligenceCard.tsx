import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  ExternalLink,
  ShieldCheck,
  Building2,
  Newspaper,
  Compass,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import { AreaOfInterest } from '../types/terrabreath';
import { ProvenanceBadge } from './ProvenanceBadge';

interface GroundedPlace {
  title: string;
  uri: string;
}

interface GroundedSource {
  title: string;
  uri: string;
}

interface GroundedIntelligenceCardProps {
  aoi: AreaOfInterest;
}

export const GroundedIntelligenceCard: React.FC<GroundedIntelligenceCardProps> = ({ aoi }) => {
  const [activeSubTab, setActiveSubTab] = useState<'maps' | 'search'>('maps');
  const [isLoading, setIsLoading] = useState(false);

  // Client-side cache per AOI ID
  const cacheRef = useRef<{
    [aoiId: string]: {
      maps?: { text: string; places: GroundedPlace[]; isGrounded: boolean; quotaNotice?: boolean };
      search?: { text: string; sources: GroundedSource[]; isGrounded: boolean; quotaNotice?: boolean };
    };
  }>({});

  // Active Display State
  const [mapsText, setMapsText] = useState<string>('');
  const [mapsPlaces, setMapsPlaces] = useState<GroundedPlace[]>([]);
  const [isMapsGrounded, setIsMapsGrounded] = useState<boolean>(true);
  const [mapsQuotaNotice, setMapsQuotaNotice] = useState<boolean>(false);

  const [searchText, setSearchText] = useState<string>('');
  const [searchSources, setSearchSources] = useState<GroundedSource[]>([]);
  const [isSearchGrounded, setIsSearchGrounded] = useState<boolean>(true);
  const [searchQuotaNotice, setSearchQuotaNotice] = useState<boolean>(false);

  const fetchMapsData = async (force: boolean = false) => {
    if (!force && cacheRef.current[aoi.id]?.maps) {
      const cached = cacheRef.current[aoi.id].maps!;
      setMapsText(cached.text);
      setMapsPlaces(cached.places);
      setIsMapsGrounded(cached.isGrounded);
      setMapsQuotaNotice(Boolean(cached.quotaNotice));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/grounding/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aoiName: aoi.name,
          basin: aoi.basin,
          lat: aoi.center[0],
          lng: aoi.center[1],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMapsText(data.text);
        setMapsPlaces(data.places || []);
        setIsMapsGrounded(data.isGrounded);
        setMapsQuotaNotice(Boolean(data.quotaNotice));

        if (!cacheRef.current[aoi.id]) cacheRef.current[aoi.id] = {};
        cacheRef.current[aoi.id].maps = {
          text: data.text,
          places: data.places || [],
          isGrounded: data.isGrounded,
          quotaNotice: data.quotaNotice,
        };
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSearchData = async (force: boolean = false) => {
    if (!force && cacheRef.current[aoi.id]?.search) {
      const cached = cacheRef.current[aoi.id].search!;
      setSearchText(cached.text);
      setSearchSources(cached.sources);
      setIsSearchGrounded(cached.isGrounded);
      setSearchQuotaNotice(Boolean(cached.quotaNotice));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/grounding/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aoiName: aoi.name,
          basin: aoi.basin,
          country: aoi.country,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchText(data.text);
        setSearchSources(data.sources || []);
        setIsSearchGrounded(data.isGrounded);
        setSearchQuotaNotice(Boolean(data.quotaNotice));

        if (!cacheRef.current[aoi.id]) cacheRef.current[aoi.id] = {};
        cacheRef.current[aoi.id].search = {
          text: data.text,
          sources: data.sources || [],
          isGrounded: data.isGrounded,
          quotaNotice: data.quotaNotice,
        };
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  };

  // Only load the data for the active sub-tab (prevents parallel requests hitting rate limits)
  useEffect(() => {
    if (activeSubTab === 'maps') {
      fetchMapsData();
    } else {
      fetchSearchData();
    }
  }, [aoi, activeSubTab]);

  const handleRefresh = () => {
    if (activeSubTab === 'maps') {
      fetchMapsData(true);
    } else {
      fetchSearchData(true);
    }
  };

  const currentQuotaNotice = activeSubTab === 'maps' ? mapsQuotaNotice : searchQuotaNotice;

  return (
    <div className="bg-[#101622] border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <Search className="w-4 h-4 text-sky-400" />
          </div>
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Real-Time Grounded Intelligence (Maps & Search Grounding)
          </h3>
          <ProvenanceBadge
            type="LIVE"
            source={activeSubTab === 'maps' ? 'Google Maps Grounded' : 'Google Search Grounded'}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tab segmented toggle */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded">
            <button
              onClick={() => setActiveSubTab('maps')}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'maps'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>Google Maps Data</span>
            </button>

            <button
              onClick={() => setActiveSubTab('search')}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'search'
                  ? 'bg-sky-950/80 text-sky-300 border border-sky-700/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-3 h-3 text-sky-400" />
              <span>Google Search Data</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Grounded Intel"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Model Spec Ribbon */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-[#0b0e14] px-3 py-2 rounded border border-slate-800/80 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Grounding Model: <strong className="text-slate-200 font-mono">gemini-3.5-flash</strong></span>
          </div>
          <div>
            Tool Active:{' '}
            <strong className="text-cyan-300 font-mono">
              {activeSubTab === 'maps' ? 'googleMaps (with latLng retrieval)' : 'googleSearch'}
            </strong>
          </div>
        </div>

        {/* Quota Notice Banner if Rate Limit was hit */}
        {currentQuotaNotice && (
          <div className="bg-[#0b0e14] border-l-2 border-amber-500 rounded-r p-3 text-xs flex items-center justify-between gap-3 text-slate-300 font-mono">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-300">
                Grounding request limit active on free tier; displaying verified regional infrastructure and telemetry bulletin.
              </span>
            </div>
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              Billing-enabled keys can be set in Settings &gt; Secrets
            </span>
          </div>
        )}

        {/* Tab Content 1: Google Maps Grounded Infrastructure */}
        {activeSubTab === 'maps' && (
          <div className="space-y-4">
            {/* Grounded narrative */}
            <div className="bg-[#0b0e14] border border-slate-800 rounded p-4 text-xs font-sans text-slate-300 leading-relaxed whitespace-pre-line">
              {mapsText || (isLoading ? 'Querying Google Maps grounding engine for critical flood response facilities...' : 'Loading infrastructure data...')}
            </div>

            {/* Clickable Google Maps Place Links */}
            <div>
              <div className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Identified Emergency Facilities & Ground Links</span>
                <span className="text-[10px] text-slate-500 font-normal">groundingChunks.maps.uri</span>
              </div>

              {mapsPlaces.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                  {mapsPlaces.map((place, idx) => (
                    <a
                      key={idx}
                      href={place.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded bg-[#0b0e14] border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900/60 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-slate-200 group-hover:text-emerald-300 truncate">
                          {place.title}
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 font-mono p-3 bg-[#0b0e14] rounded border border-slate-800">
                  Loading emergency facility anchors...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content 2: Google Search Grounded News & Advisories */}
        {activeSubTab === 'search' && (
          <div className="space-y-4">
            {/* Grounded narrative */}
            <div className="bg-[#0b0e14] border border-slate-800 rounded p-4 text-xs font-sans text-slate-300 leading-relaxed whitespace-pre-line">
              {searchText || (isLoading ? 'Querying Google Search grounding for latest meteorological bulletins and dam releases...' : 'Loading hydro-bulletin data...')}
            </div>

            {/* Grounded Web Citations & Sources */}
            <div>
              <div className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Verified Web Sources & Agency Bulletins</span>
                <span className="text-[10px] text-slate-500 font-normal">groundingChunks.web.uri</span>
              </div>

              {searchSources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                  {searchSources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded bg-[#0b0e14] border border-slate-800 hover:border-sky-500/60 hover:bg-slate-900/60 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <Newspaper className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="text-slate-200 group-hover:text-sky-300 truncate">
                          {source.title}
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 shrink-0" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 font-mono p-3 bg-[#0b0e14] rounded border border-slate-800">
                  Loading web citations...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
