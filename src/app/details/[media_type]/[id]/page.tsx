"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Typdefinitionen für die Daten, die wir von der API erwarten
interface Provider {
  logo_path: string;
  provider_name: string;
  provider_id: number;
}

interface WatchProviders {
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
}

interface CountryProviders {
  [countryCode: string]: WatchProviders;
}

interface ProviderAvailability {
  provider: Provider;
  availableInDE: boolean;
  countries: string[];
  types: { [country: string]: ('stream' | 'rent' | 'buy')[] };
}

interface Details {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genres?: { id: number; name: string }[];
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  watch_providers?: CountryProviders;
}

export default function DetailPage() {
  const params = useParams();
  const router = useRouter();
  const media_type = params?.media_type as string;
  const id = params?.id as string;
  
  const [details, setDetails] = useState<Details | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProvider, setExpandedProvider] = useState<number | null>(null);

  useEffect(() => {
    if (!media_type || !id) {
      setError('Ungültige Parameter');
      setLoading(false);
      return;
    }

    // Validiere media_type
    if (media_type !== 'movie' && media_type !== 'tv') {
      setError('Ungültiger Medientyp');
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/details/${media_type}/${id}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Fehler beim Laden der Details');
        }
        const data = await response.json();
        setDetails(data);
      } catch (err) {
        console.error('Error fetching details:', err);
        setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [media_type, id]);

  // Funktion zum Aggregieren aller Provider
  const aggregateProviders = (): ProviderAvailability[] => {
    if (!details?.watch_providers) return [];

    const providerMap = new Map<number, ProviderAvailability>();

    Object.entries(details.watch_providers).forEach(([countryCode, providers]) => {
      const processProviders = (providerList: Provider[] | undefined, type: 'stream' | 'rent' | 'buy') => {
        providerList?.forEach(provider => {
          const existing = providerMap.get(provider.provider_id);
          
          if (existing) {
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
            providerMap.set(provider.provider_id, {
              provider,
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

    // Sortieren: Erst DE verfügbar, dann alphabetisch
    return Array.from(providerMap.values()).sort((a, b) => {
      if (a.availableInDE && !b.availableInDE) return -1;
      if (!a.availableInDE && b.availableInDE) return 1;
      return a.provider.provider_name.localeCompare(b.provider.provider_name);
    });
  };

  const renderProviders = (providers: Provider[] | undefined) => {
    if (!providers || providers.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {providers.map((p, index) => (
          <div 
            key={`${p.provider_name}-${index}`} 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded border text-sm"
            style={{ 
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
          >
            {p.logo_path && (
              <div className="relative w-5 h-5 flex-shrink-0">
                <Image
                  src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                  alt={p.provider_name}
                  fill
                  sizes="20px"
                  className="object-contain rounded"
                  loading="lazy"
                />
              </div>
            )}
            <span>{p.provider_name}</span>
          </div>
        ))}
      </div>
    );
  }

  const countryNames: { [key: string]: string } = {
    US: "USA",
    GB: "Vereinigtes Königreich",
    DE: "Deutschland",
    FR: "Frankreich",
    ES: "Spanien",
    IT: "Italien",
    CA: "Kanada",
    AU: "Australien",
    BR: "Brasilien",
    MX: "Mexiko",
    JP: "Japan",
    KR: "Südkorea",
    IN: "Indien",
    AT: "Österreich",
    CH: "Schweiz",
    NL: "Niederlande",
    BE: "Belgien",
    SE: "Schweden",
    NO: "Norwegen",
    DK: "Dänemark",
    FI: "Finnland",
    PL: "Polen",
    CZ: "Tschechien",
    PT: "Portugal",
    IE: "Irland",
    NZ: "Neuseeland",
    AR: "Argentinien",
    CL: "Chile",
    CO: "Kolumbien",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <svg className="animate-spin h-10 w-10 mb-3" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Lade Details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center max-w-md">
          <svg className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--error)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground-bright)' }}>Fehler</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>{error}</p>
          <Link href="/" className="text-sm inline-flex items-center gap-1 hover:underline" style={{ color: 'var(--primary)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Zurück zur Suche
          </Link>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: 'var(--background)' }}>
        <p className="text-sm mb-4" style={{ color: 'var(--foreground-muted)' }}>Keine Details gefunden.</p>
        <Link href="/" className="text-sm inline-flex items-center gap-1 hover:underline" style={{ color: 'var(--primary)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Zurück zur Suche
        </Link>
      </div>
    );
  }

  const title = details.title || details.name || 'Unbekannter Titel';
  const year = details.release_date?.substring(0, 4) || details.first_air_date?.substring(0, 4);
  const userScore = details.vote_average ? Math.round(details.vote_average * 10) : null;

  const providers = aggregateProviders();

  const getTypeLabel = (type: 'stream' | 'rent' | 'buy'): string => {
    switch (type) {
      case 'stream': return 'stream';
      case 'rent': return 'rent';
      case 'buy': return 'buy';
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
        <div className="max-w-7xl mx-auto px-6 py-3">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-mono transition-colors hover:opacity-70"
            style={{ color: 'var(--primary)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>cd ..</span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          {/* Poster */}
          <div className="lg:sticky lg:top-8 self-start">
            {details.poster_path ? (
              <div className="relative w-full max-w-[240px] aspect-[2/3] rounded border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                <Image
                  src={`https://image.tmdb.org/t/p/w500${details.poster_path}`}
                  alt={title}
                  fill
                  priority
                  sizes="240px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-full max-w-[240px] aspect-[2/3] rounded border flex items-center justify-center" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                <svg className="w-16 h-16" style={{ color: 'var(--foreground-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Title & Meta */}
            <div>
              <h1 className="text-2xl font-mono font-semibold mb-2" style={{ color: 'var(--foreground-bright)' }}>{title}</h1>
              <div className="flex items-center gap-3 text-xs font-mono" style={{ color: 'var(--foreground-muted)' }}>
                {year && <span>[{year}]</span>}
                {userScore && <span>{userScore}%</span>}
                {details.genres && details.genres.length > 0 && (
                  <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                    {details.genres.map(g => g.name).join(' • ')}
                  </span>
                )}
              </div>
            </div>

            {/* Overview */}
            {details.overview && (
              <div>
                <h2 className="text-xs font-mono font-semibold mb-2" style={{ color: 'var(--primary)' }}>// overview</h2>
                <p className="text-sm leading-relaxed font-mono" style={{ color: 'var(--foreground)' }}>{details.overview}</p>
              </div>
            )}

            {/* Streaming Providers Table */}
            <div>
              <h2 className="text-xs font-mono font-semibold mb-3" style={{ color: 'var(--primary)' }}>// availability</h2>
              {providers.length > 0 ? (
                <div className="rounded border overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                  {/* Table Header */}
                  <div className="grid grid-cols-[1fr_80px_80px_80px] gap-4 px-4 py-2 border-b text-xs font-mono" style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)' }}>
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

                      const isExpanded = expandedProvider === item.provider.provider_id;

                      return (
                        <div key={item.provider.provider_id}>
                          <div 
                            className="grid grid-cols-[1fr_80px_80px_80px] gap-4 px-4 py-2.5 border-b items-center hover:bg-opacity-50 transition-colors"
                            style={{ 
                              borderColor: 'var(--border)',
                              backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                            }}
                          >
                            {/* Provider Name & Logo */}
                            <div className="flex items-center gap-3">
                              {item.provider.logo_path && (
                                <div className="relative w-7 h-7 flex-shrink-0">
                                  <Image
                                    src={`https://image.tmdb.org/t/p/w92${item.provider.logo_path}`}
                                    alt={item.provider.provider_name}
                                    fill
                                    sizes="28px"
                                    className="object-contain rounded"
                                    loading="lazy"
                                  />
                                </div>
                              )}
                              <span className="text-xs font-mono" style={{ color: 'var(--foreground)' }}>
                                {item.provider.provider_name}
                              </span>
                            </div>

                            {/* Stream */}
                            <div className="flex justify-center">
                              {hasStreamDE && (
                                <button
                                  onClick={() => setExpandedProvider(isExpanded ? null : item.provider.provider_id)}
                                  className="w-5 h-5 flex items-center justify-center rounded transition-all hover:scale-110"
                                  style={{ 
                                    backgroundColor: '#50fa7b',
                                    color: '#0a0a0a'
                                  }}
                                  title="Verfügbar in Deutschland"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                              {!hasStreamDE && hasStreamOther && (
                                <button
                                  onClick={() => setExpandedProvider(isExpanded ? null : item.provider.provider_id)}
                                  className="w-5 h-5 flex items-center justify-center rounded transition-all hover:scale-110"
                                  style={{ 
                                    backgroundColor: '#3a8a5a',
                                    color: '#e0e0e0'
                                  }}
                                  title="Verfügbar in anderen Ländern"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                            </div>

                            {/* Rent */}
                            <div className="flex justify-center">
                              {hasRentDE && (
                                <button
                                  onClick={() => setExpandedProvider(isExpanded ? null : item.provider.provider_id)}
                                  className="w-5 h-5 flex items-center justify-center rounded transition-all hover:scale-110"
                                  style={{ 
                                    backgroundColor: '#50fa7b',
                                    color: '#0a0a0a'
                                  }}
                                  title="Verfügbar in Deutschland"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                              {!hasRentDE && hasRentOther && (
                                <button
                                  onClick={() => setExpandedProvider(isExpanded ? null : item.provider.provider_id)}
                                  className="w-5 h-5 flex items-center justify-center rounded transition-all hover:scale-110"
                                  style={{ 
                                    backgroundColor: '#3a8a5a',
                                    color: '#e0e0e0'
                                  }}
                                  title="Verfügbar in anderen Ländern"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                            </div>

                            {/* Buy */}
                            <div className="flex justify-center">
                              {hasBuyDE && (
                                <button
                                  onClick={() => setExpandedProvider(isExpanded ? null : item.provider.provider_id)}
                                  className="w-5 h-5 flex items-center justify-center rounded transition-all hover:scale-110"
                                  style={{ 
                                    backgroundColor: '#50fa7b',
                                    color: '#0a0a0a'
                                  }}
                                  title="Verfügbar in Deutschland"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                              {!hasBuyDE && hasBuyOther && (
                                <button
                                  onClick={() => setExpandedProvider(isExpanded ? null : item.provider.provider_id)}
                                  className="w-5 h-5 flex items-center justify-center rounded transition-all hover:scale-110"
                                  style={{ 
                                    backgroundColor: '#3a8a5a',
                                    color: '#e0e0e0'
                                  }}
                                  title="Verfügbar in anderen Ländern"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded Country List */}
                          {isExpanded && (
                            <div 
                              className="px-4 py-3 border-b text-xs font-mono"
                              style={{ 
                                borderColor: 'var(--border)',
                                backgroundColor: 'rgba(0, 122, 204, 0.03)',
                                color: 'var(--foreground-muted)'
                              }}
                            >
                              <div className="space-y-1.5">
                                {item.countries.map(country => (
                                  <div key={country} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-base">
                                        {country === 'US' ? '🇺🇸' : country === 'GB' ? '🇬🇧' : country === 'DE' ? '🇩🇪' : 
                                         country === 'FR' ? '🇫🇷' : country === 'CA' ? '🇨🇦' : country === 'AU' ? '🇦🇺' : 
                                         country === 'ES' ? '🇪🇸' : country === 'IT' ? '🇮🇹' : country === 'BR' ? '🇧🇷' : 
                                         country === 'MX' ? '🇲🇽' : country === 'JP' ? '🇯🇵' : country === 'KR' ? '🇰🇷' : 
                                         country === 'IN' ? '🇮🇳' : country === 'AT' ? '�🇹' : country === 'CH' ? '🇨🇭' :
                                         country === 'NL' ? '🇳🇱' : country === 'BE' ? '🇧🇪' : country === 'SE' ? '🇸🇪' :
                                         country === 'NO' ? '🇳🇴' : country === 'DK' ? '🇩🇰' : country === 'FI' ? '🇫🇮' :
                                         country === 'PL' ? '🇵🇱' : country === 'CZ' ? '🇨🇿' : country === 'PT' ? '🇵🇹' :
                                         country === 'IE' ? '🇮🇪' : country === 'NZ' ? '🇳🇿' : country === 'AR' ? '🇦🇷' :
                                         country === 'CL' ? '🇨🇱' : country === 'CO' ? '🇨🇴' : '🌍'}
                                      </span>
                                      <span style={{ color: 'var(--foreground)' }}>
                                        {countryNames[country] || country}
                                      </span>
                                    </div>
                                    <div className="flex gap-2">
                                      {item.types[country]?.map(type => (
                                        <span 
                                          key={type}
                                          className="px-2 py-0.5 rounded text-xs"
                                          style={{ 
                                            backgroundColor: 'var(--surface)',
                                            color: 'var(--foreground)'
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
                <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                  Keine Streaming-Anbieter verfügbar
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
