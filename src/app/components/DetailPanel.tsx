"use client";

import { useEffect, useState } from "react";
import { getPublicBroadcastersForCountries } from "../lib/publicBroadcasters";
import { getProviderGroup, getProviderPopularity } from "../lib/providerUtils";

interface Provider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
}

interface CountryProviders {
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
}

interface WatchProviders {
  [countryCode: string]: CountryProviders;
}

interface Genre {
  id: number;
  name: string;
}

interface Details {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  genres?: Genre[];
  watch_providers?: WatchProviders;
}

interface ProviderAvailability {
  provider: Provider;
  availableInDE: boolean;
  countries: string[];
  types: { [country: string]: ('stream' | 'rent' | 'buy')[] };
  groupName?: string; // For grouped providers like "Netflix" instead of "Netflix basic with Ads"
  variants?: string[]; // List of variant names (e.g., ["Netflix", "Netflix basic with Ads"])
}

interface DetailPanelProps {
  mediaType: 'movie' | 'tv';
  id: number;
  onClose: () => void;
}

const countryNames: { [key: string]: string } = {
  DE: 'Germany', US: 'United States', GB: 'United Kingdom', FR: 'France',
  CA: 'Canada', AU: 'Australia', ES: 'Spain', IT: 'Italy', BR: 'Brazil',
  MX: 'Mexico', JP: 'Japan', KR: 'South Korea', IN: 'India', AT: 'Austria',
  CH: 'Switzerland', NL: 'Netherlands', BE: 'Belgium', SE: 'Sweden',
  NO: 'Norway', DK: 'Denmark', FI: 'Finland', PL: 'Poland', CZ: 'Czech Republic',
  PT: 'Portugal', IE: 'Ireland', NZ: 'New Zealand', AR: 'Argentina',
  CL: 'Chile', CO: 'Colombia'
};

export default function DetailPanel({ mediaType, id, onClose }: DetailPanelProps) {
  const [details, setDetails] = useState<Details | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProvider, setExpandedProvider] = useState<number | null>(null);
  const [availableMediathekenByCountry, setAvailableMediathekenByCountry] = useState<{ [country: string]: string[] }>({});

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/details/${mediaType}/${id}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch details');
        }

        const data = await response.json();
        
        // Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format');
        }
        
        setDetails(data);
      } catch (err) {
        console.error('Error fetching details:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [mediaType, id]);

  // Fetch JustWatch availability for public mediatheken
  useEffect(() => {
    const checkMediathekAvailability = async () => {
      if (!details) return;

      const title = details.title || details.name;
      if (!title) return;

      // Always check DE, AT, CH for German-speaking mediatheken
      // Plus any countries from watch_providers
      const providerCountries = Object.keys(details.watch_providers || {});
      const allCountries = Array.from(new Set(['DE', 'AT', 'CH', ...providerCountries]));

      // Check each country
      const results: { [country: string]: string[] } = {};
      
      for (const country of allCountries) {
        try {
          const response = await fetch(
            `/api/justwatch?title=${encodeURIComponent(title)}&country=${country}&media_type=${mediaType}`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.available && data.available.length > 0) {
              results[country] = data.available;
            }
          }
        } catch (err) {
          console.error(`Failed to check mediathek availability for ${country}:`, err);
        }
      }

      setAvailableMediathekenByCountry(results);
    };

    checkMediathekAvailability();
  }, [details, mediaType]);

  const aggregateProviders = (): ProviderAvailability[] => {
    if (!details?.watch_providers) return [];

    const providerMap = new Map<string, ProviderAvailability>(); // Changed to use string key (group name)

    try {
      Object.entries(details.watch_providers).forEach(([countryCode, providers]) => {
        if (!providers || typeof providers !== 'object') return;
        
        const processProviders = (providerList: Provider[] | undefined, type: 'stream' | 'rent' | 'buy') => {
          if (!Array.isArray(providerList)) return;
          
          providerList.forEach(provider => {
            if (!provider?.provider_id || !provider?.provider_name) return;
            
            const groupName = getProviderGroup(provider.provider_name);
            const existing = providerMap.get(groupName);

            if (existing) {
              // Add variant name if not already included
              if (!existing.variants?.includes(provider.provider_name)) {
                existing.variants = existing.variants || [];
                existing.variants.push(provider.provider_name);
              }
              
              if (!existing.countries.includes(countryCode)) {
                existing.countries.push(countryCode);
              }
              if (!existing.types[countryCode]) {
                existing.types[countryCode] = [];
              }
              if (!existing.types[countryCode].includes(type)) {
                existing.types[countryCode].push(type);
              }
              if (countryCode === 'DE') {
                existing.availableInDE = true;
              }
            } else {
              providerMap.set(groupName, {
                provider,
                groupName,
                variants: [provider.provider_name],
                availableInDE: countryCode === 'DE',
                countries: [countryCode],
                types: { [countryCode]: [type] }
              });
            }
          });
        };

        processProviders(providers.flatrate, 'stream');
        processProviders(providers.rent, 'rent');
        processProviders(providers.buy, 'buy');
      });
    } catch (err) {
      console.error('Error aggregating providers:', err);
      return [];
    }

    // Sort by: 1) Availability in DE, 2) Popularity, 3) Name
    return Array.from(providerMap.values()).sort((a, b) => {
      // First: DE availability
      if (a.availableInDE && !b.availableInDE) return -1;
      if (!a.availableInDE && b.availableInDE) return 1;
      
      // Second: Popularity
      const popA = getProviderPopularity(a.groupName || a.provider.provider_name);
      const popB = getProviderPopularity(b.groupName || b.provider.provider_name);
      if (popA !== popB) return popB - popA;
      
      // Third: Alphabetical
      const nameA = a.groupName || a.provider.provider_name;
      const nameB = b.groupName || b.provider.provider_name;
      return nameA.localeCompare(nameB);
    });
  };

  const getTypeLabel = (type: 'stream' | 'rent' | 'buy'): string => {
    switch (type) {
      case 'stream': return 'stream';
      case 'rent': return 'rent';
      case 'buy': return 'buy';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <svg className="animate-spin h-8 w-8" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="h-full flex items-center justify-center p-6" style={{ backgroundColor: 'var(--background)' }}>
        <p className="text-sm font-mono" style={{ color: 'var(--error)' }}>[error] {error || 'Failed to load'}</p>
      </div>
    );
  }

  const title = details.title || details.name || 'Unknown';
  const year = details.release_date?.split('-')[0] || details.first_air_date?.split('-')[0];
  const userScore = details.vote_average ? Math.round(details.vote_average * 10) : null;
  const providers = aggregateProviders();
  
  // Show public media for all checked countries (not just where providers exist)
  const publicMedia = Object.entries(availableMediathekenByCountry)
    .map(([country, availableNames]) => {
      if (availableNames.length === 0) return null;
      
      const broadcasters = getPublicBroadcastersForCountries([country])[0]?.broadcasters || [];
      const filteredBroadcasters = broadcasters.filter(b => availableNames.includes(b.name));
      
      return filteredBroadcasters.length > 0 ? { country, broadcasters: filteredBroadcasters } : null;
    })
    .filter((item): item is { country: string; broadcasters: Array<{ name: string; url: string; search_url?: string }> } => item !== null);

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--background)' }}>
      {/* Close Button - Hidden on mobile (back button in parent) */}
      <div className="hidden md:flex flex-shrink-0 px-4 md:px-8 py-3 border-b justify-between items-center" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
        <span className="text-xs font-mono" style={{ color: 'var(--foreground-muted)' }}>details</span>
        <button
          onClick={onClose}
          className="text-sm font-mono transition-colors hover:opacity-70"
          style={{ color: 'var(--primary)' }}
        >
          [x] close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Poster */}
        {details.poster_path && (
          <div className="relative w-full max-w-[160px] md:max-w-[200px] aspect-[2/3] rounded overflow-hidden mx-auto" style={{ backgroundColor: 'var(--surface)' }}>
            <img
              src={`https://image.tmdb.org/t/p/w500${details.poster_path}`}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Title & Meta */}
        <div>
          <h1 className="text-xl font-mono font-semibold mb-2" style={{ color: 'var(--foreground-bright)' }}>{title}</h1>
          <div className="flex items-center gap-3 text-xs font-mono" style={{ color: 'var(--foreground-muted)' }}>
            {year && <span>[{year}]</span>}
            {userScore && <span>{userScore}%</span>}
          </div>
          {details.genres && details.genres.length > 0 && (
            <p className="mt-2 text-xs font-mono" style={{ color: 'var(--foreground-muted)' }}>
              {details.genres.map(g => g.name).join(' • ')}
            </p>
          )}
        </div>

        {/* Overview */}
        {details.overview && (
          <div>
            <h2 className="text-xs font-mono font-semibold mb-2" style={{ color: 'var(--primary)' }}>// overview</h2>
            <p className="text-sm leading-relaxed font-mono" style={{ color: 'var(--foreground)' }}>{details.overview}</p>
          </div>
        )}

        {/* Providers */}
        <div>
          <h2 className="text-xs font-mono font-semibold mb-3" style={{ color: 'var(--primary)' }}>// availability</h2>
          {providers.length > 0 ? (
            <div className="rounded border overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 px-3 py-2 border-b text-xs font-mono" style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)' }}>
                <div>provider</div>
                <div className="text-center">stream</div>
                <div className="text-center">rent</div>
                <div className="text-center">buy</div>
              </div>

              {/* Table Body */}
              <div>
                {providers.map((item: ProviderAvailability, index: number) => {
                  const hasStreamDE = item.types['DE']?.includes('stream');
                  const hasRentDE = item.types['DE']?.includes('rent');
                  const hasBuyDE = item.types['DE']?.includes('buy');

                  const hasStreamOther = Object.entries(item.types).some(([country, types]) =>
                    country !== 'DE' && types.includes('stream')
                  );
                  const hasRentOther = Object.entries(item.types).some(([country, types]) =>
                    country !== 'DE' && types.includes('rent')
                  );
                  const hasBuyOther = Object.entries(item.types).some(([country, types]) =>
                    country !== 'DE' && types.includes('buy')
                  );

                  const isExpanded = expandedProvider === index;
                  const displayName = item.groupName || item.provider.provider_name;

                  return (
                    <div key={`${item.groupName || item.provider.provider_id}-${index}`}>
                      <div
                        className="grid grid-cols-[1fr_60px_60px_60px] md:grid-cols-[1fr_80px_80px_80px] gap-2 px-3 py-2 border-b items-center"
                        style={{
                          borderColor: 'var(--border)',
                          backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                        }}
                      >
                        {/* Provider Name */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono truncate" style={{ color: 'var(--foreground)' }}>
                            {displayName}
                          </span>
                          {item.variants && item.variants.length > 1 && (
                            <span className="text-xs font-mono hidden md:inline" style={{ color: 'var(--foreground-muted)' }}>
                              ({item.variants.length})
                            </span>
                          )}
                        </div>

                        {/* Stream */}
                        <div className="flex justify-center">
                          {hasStreamDE && (
                            <button
                              onClick={() => setExpandedProvider(isExpanded ? null : index)}
                              className="w-4 h-4 flex items-center justify-center rounded transition-all hover:scale-110"
                              style={{
                                backgroundColor: '#50fa7b',
                                color: '#0a0a0a'
                              }}
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          {!hasStreamDE && hasStreamOther && (
                            <button
                              onClick={() => setExpandedProvider(isExpanded ? null : index)}
                              className="w-4 h-4 flex items-center justify-center rounded transition-all hover:scale-110"
                              style={{
                                backgroundColor: '#ff9500',
                                color: '#0a0a0a'
                              }}
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* Rent */}
                        <div className="flex justify-center">
                          {hasRentDE && (
                            <button
                              onClick={() => setExpandedProvider(isExpanded ? null : index)}
                              className="w-4 h-4 flex items-center justify-center rounded transition-all hover:scale-110"
                              style={{
                                backgroundColor: '#50fa7b',
                                color: '#0a0a0a'
                              }}
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          {!hasRentDE && hasRentOther && (
                            <button
                              onClick={() => setExpandedProvider(isExpanded ? null : index)}
                              className="w-4 h-4 flex items-center justify-center rounded transition-all hover:scale-110"
                              style={{
                                backgroundColor: '#ff9500',
                                color: '#0a0a0a'
                              }}
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* Buy */}
                        <div className="flex justify-center">
                          {hasBuyDE && (
                            <button
                              onClick={() => setExpandedProvider(isExpanded ? null : index)}
                              className="w-4 h-4 flex items-center justify-center rounded transition-all hover:scale-110"
                              style={{
                                backgroundColor: '#50fa7b',
                                color: '#0a0a0a'
                              }}
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          {!hasBuyDE && hasBuyOther && (
                            <button
                              onClick={() => setExpandedProvider(isExpanded ? null : index)}
                              className="w-4 h-4 flex items-center justify-center rounded transition-all hover:scale-110"
                              style={{
                                backgroundColor: '#ff9500',
                                color: '#0a0a0a'
                              }}
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Country List */}
                      {isExpanded && (
                        <div
                          className="px-3 py-2 border-b text-xs font-mono"
                          style={{
                            borderColor: 'var(--border)',
                            backgroundColor: 'rgba(80, 250, 123, 0.03)',
                            color: 'var(--foreground-muted)'
                          }}
                        >
                          {/* Show variants if available */}
                          {item.variants && item.variants.length > 1 && (
                            <div className="mb-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                              <div className="text-xs font-mono mb-1" style={{ color: 'var(--primary)' }}>
                                Variants:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {item.variants.map((variant: string) => (
                                  <span
                                    key={variant}
                                    className="px-1.5 py-0.5 rounded text-xs font-mono"
                                    style={{
                                      backgroundColor: 'var(--surface)',
                                      color: 'var(--foreground)',
                                      border: '1px solid var(--border)'
                                    }}
                                  >
                                    {variant}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-1">
                            {item.countries.map((country: string) => (
                              <div key={country} className="flex items-center justify-between py-0.5">
                                <span className="font-mono text-xs" style={{ color: 'var(--foreground)' }}>
                                  {countryNames[country] || country}
                                </span>
                                <div className="flex gap-1">
                                  {item.types[country]?.map((type: 'stream' | 'rent' | 'buy') => (
                                    <span
                                      key={type}
                                      className="px-1.5 py-0.5 rounded text-xs font-mono"
                                      style={{
                                        backgroundColor: 'var(--surface)',
                                        color: 'var(--primary)',
                                        border: '1px solid var(--border)'
                                      }}
                                    >
                                      {getTypeLabel(type)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs font-mono" style={{ color: 'var(--foreground-muted)' }}>
              no availability data
            </p>
          )}
        </div>

        {/* Public Broadcasters / Mediatheken */}
        {publicMedia.length > 0 && (
          <div>
            <h2 className="text-xs font-mono font-semibold mb-3" style={{ color: 'var(--primary)' }}>// public media libraries</h2>
            <div className="space-y-3">
              {publicMedia.map(({ country, broadcasters }) => (
                <div key={country}>
                  <div className="text-xs font-mono mb-2" style={{ color: 'var(--foreground-muted)' }}>
                    {countryNames[country] || country}
                  </div>
                  <div className="space-y-2">
                    {broadcasters.map((broadcaster) => (
                      <a
                        key={broadcaster.name}
                        href={broadcaster.search_url ? `${broadcaster.search_url}${encodeURIComponent(title)}` : broadcaster.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-3 py-2 rounded border transition-all text-sm font-mono"
                        style={{ 
                          borderColor: 'var(--border)',
                          backgroundColor: 'var(--surface)',
                          color: 'var(--foreground)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.backgroundColor = 'rgba(80, 250, 123, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.backgroundColor = 'var(--surface)';
                        }}
                      >
                        {broadcaster.name}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs font-mono mt-3" style={{ color: 'var(--foreground-muted)' }}>
              // hint: click to search on these free platforms
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
