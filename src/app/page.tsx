"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import DetailPanel from "./components/DetailPanel";

// Definiert die Struktur eines Suchergebnisses
interface SearchResult {
  id: number;
  title?: string; // Für Filme
  name?: string; // Für Serien
  poster_path: string | null;
  media_type: 'movie' | 'tv' | 'person';
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ mediaType: 'movie' | 'tv'; id: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [newReleases, setNewReleases] = useState<SearchResult[]>([]);
  const [loadingReleases, setLoadingReleases] = useState(true);

  // Detect mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load search history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('searchHistory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSearchHistory(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load search history:', err);
      localStorage.removeItem('searchHistory');
    }
  }, []);

  // Load new releases on mount
  useEffect(() => {
    const fetchNewReleases = async () => {
      try {
        const response = await fetch('/api/new-releases');
        if (response.ok) {
          const data = await response.json();
          setNewReleases(data.results || []);
        }
      } catch (err) {
        console.error('Failed to load new releases:', err);
      } finally {
        setLoadingReleases(false);
      }
    };

    fetchNewReleases();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      setResults([]);
      setError(null);
      return;
    }

    // Add to search history
    if (!searchHistory.includes(trimmedQuery)) {
      const newHistory = [trimmedQuery, ...searchHistory.slice(0, 9)]; // Keep last 10
      setSearchHistory(newHistory);
      try {
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      } catch (err) {
        console.error('Failed to save search history:', err);
      }
    }
    setShowHistory(false);

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(trimmedQuery)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Suche fehlgeschlagen');
      }
      
      const data = await response.json();
      
      // Sicherstellen, dass results ein Array ist
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Ungültige Antwort vom Server');
      }
      
      // Filtere Personen aus und behalte nur Filme und Serien
      const filteredResults = data.results.filter(
        (item: SearchResult) => item.media_type === 'movie' || item.media_type === 'tv'
      );
      
      setResults(filteredResults);
    } catch (err) {
      console.error("Fehler bei der Suche:", err);
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard navigation for search history
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowHistory(false);
    }
  };

  return (
    <main className="min-h-screen h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Left Side - Search and Results */}
      <div className={`${selectedItem && !isMobile ? 'w-1/2' : 'w-full'} ${isMobile && showMobileDetail ? 'hidden' : 'flex'} transition-all duration-300 flex-col h-screen`}>
        {/* Header */}
        <header className="border-b flex-shrink-0" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
          <div className="px-4 md:px-6 py-3 flex items-center gap-3">
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                setSelectedItem(null);
                setError(null);
                if (isMobile) {
                  setShowMobileDetail(false);
                }
              }}
              className="flex items-center gap-3 hover:opacity-70 transition-opacity"
            >
              <span className="text-base font-mono" style={{ color: 'var(--primary)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                  <polyline points="17 2 12 7 7 2"></polyline>
                  <circle cx="6" cy="11" r="0.5" fill="currentColor"></circle>
                  <circle cx="9" cy="11" r="0.5" fill="currentColor"></circle>
                </svg>
              </span>
              <h1 className="text-sm font-mono" style={{ color: 'var(--primary)' }}>streaming_finder</h1>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-6 py-6 md:py-8">
        {/* Search Bar */}
        <div className="mb-8 relative">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center gap-3 px-5 py-4 md:py-5 rounded border transition-colors" 
              style={{ 
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <span className="text-xl md:text-2xl font-mono" style={{ color: 'var(--primary)' }}>›</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowHistory(true)}
                onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                onKeyDown={handleKeyDown}
                placeholder="search movies and series..."
                className="flex-1 bg-transparent text-base md:text-lg outline-none font-mono"
                style={{ color: 'var(--foreground-bright)' }}
                maxLength={500}
                autoComplete="off"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="transition-opacity"
                style={{ color: loading ? 'var(--foreground-muted)' : 'var(--primary)', opacity: loading ? 0.5 : 1 }}
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>
            </div>
          </form>

          {/* Search History Dropdown */}
          {showHistory && searchHistory.length > 0 && (
            <div 
              className="absolute top-full mt-2 w-full rounded border z-10"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="px-3 py-2 border-b text-xs font-mono" style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)' }}>
                recent searches
              </div>
              {searchHistory.map((term, index) => (
                <button
                  key={index}
                  onClick={async () => {
                    setQuery(term);
                    setShowHistory(false);
                    
                    // Trigger search immediately
                    setLoading(true);
                    setError(null);
                    
                    try {
                      const response = await fetch(`/api/search?query=${encodeURIComponent(term)}`);
                      
                      if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || 'Suche fehlgeschlagen');
                      }
                      
                      const data = await response.json();
                      
                      if (!data.results || !Array.isArray(data.results)) {
                        throw new Error('Ungültige Antwort vom Server');
                      }
                      
                      const filteredResults = data.results.filter((item: SearchResult) => 
                        item.media_type === 'movie' || item.media_type === 'tv'
                      );
                      
                      setResults(filteredResults);
                    } catch (err) {
                      console.error("Fehler bei der Suche:", err);
                      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
                      setResults([]);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full px-4 py-2 text-left text-sm font-mono transition-colors"
                  style={{ 
                    color: 'var(--foreground)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(80, 250, 123, 0.05)';
                    e.currentTarget.style.color = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--foreground)';
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 px-3 py-2 rounded border font-mono text-xs flex items-center justify-between" style={{ backgroundColor: 'rgba(244, 67, 54, 0.1)', borderColor: '#f44336', color: '#f44336' }}>
            <span>[error] {error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-2 hover:opacity-70"
              aria-label="Dismiss error"
            >
              [x]
            </button>
          </div>
        )}

        {/* Results */}
        <section>
          {query && !error && (
            <h2 className="text-xs font-mono mb-4" style={{ color: 'var(--foreground-muted)' }}>
              [{results.length}] results for "{query}"
            </h2>
          )}
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <svg className="animate-spin h-8 w-8 mb-3" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-xs font-mono" style={{ color: 'var(--foreground-muted)' }}>searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.media_type === 'movie' || item.media_type === 'tv') {
                      setSelectedItem({ mediaType: item.media_type, id: item.id });
                      if (isMobile) {
                        setShowMobileDetail(true);
                      }
                    }
                  }}
                  className="group w-full flex items-center gap-3 md:gap-4 px-3 md:px-3 py-2 rounded border transition-all text-left"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.backgroundColor = 'rgba(80, 250, 123, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.backgroundColor = 'var(--surface)';
                  }}
                >
                  {/* Small Poster */}
                  <div className="flex-shrink-0">
                    {item.poster_path ? (
                      <div className="relative w-10 h-[60px] md:w-12 md:h-[72px] rounded overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
                        <img
                          src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                          alt={item.title || item.name || 'Poster'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-[60px] md:w-12 md:h-[72px] rounded flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}>
                        <svg className="w-4 h-4 md:w-5 md:h-5" style={{ color: 'var(--foreground-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Title and Type */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-mono truncate" style={{ color: 'var(--foreground-bright)' }}>
                      {item.title || item.name || 'Unknown'}
                    </h3>
                    <p className="text-xs font-mono" style={{ color: 'var(--foreground-muted)' }}>
                      {item.media_type === 'movie' ? 'movie' : 'tv series'}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0">
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
              ))}
            </div>
          ) : query && !error ? (
            <div className="text-center py-20">
              <p className="font-mono text-xs" style={{ color: 'var(--foreground-muted)' }}>no results found</p>
            </div>
          ) : !error && !query ? (
            // Show new releases when no search query
            <div>
              <h2 className="text-xs font-mono mb-4" style={{ color: 'var(--primary)' }}>
                // new releases (last 30 days)
              </h2>
              
              {loadingReleases ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <svg className="animate-spin h-8 w-8 mb-3" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-xs font-mono" style={{ color: 'var(--foreground-muted)' }}>loading new releases...</p>
                </div>
              ) : newReleases.length > 0 ? (
                <div className="space-y-2">
                  {newReleases.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.media_type === 'movie' || item.media_type === 'tv') {
                          setSelectedItem({ mediaType: item.media_type, id: item.id });
                          if (isMobile) {
                            setShowMobileDetail(true);
                          }
                        }
                      }}
                      className="group w-full flex items-center gap-3 md:gap-4 px-3 md:px-3 py-2 rounded border transition-all text-left"
                      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.backgroundColor = 'rgba(80, 250, 123, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.backgroundColor = 'var(--surface)';
                      }}
                    >
                      {/* Small Poster */}
                      <div className="flex-shrink-0">
                        {item.poster_path ? (
                          <div className="relative w-10 h-[60px] md:w-12 md:h-[72px] rounded overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
                            <img
                              src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                              alt={item.title || item.name || 'Poster'}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-[60px] md:w-12 md:h-[72px] rounded flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}>
                            <svg className="w-4 h-4 md:w-5 md:h-5" style={{ color: 'var(--foreground-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Title and Type */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-mono truncate" style={{ color: 'var(--foreground-bright)' }}>
                          {item.title || item.name || 'Unknown'}
                        </h3>
                        <p className="text-xs font-mono" style={{ color: 'var(--foreground-muted)' }}>
                          {item.media_type === 'movie' ? 'movie' : 'tv series'}
                        </p>
                      </div>

                      {/* Arrow */}
                      <div className="flex-shrink-0">
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="font-mono text-xs" style={{ color: 'var(--foreground-muted)' }}>no new releases available</p>
                </div>
              )}
            </div>
          ) : !error ? (
            <div className="text-center py-20">
              <svg className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--foreground-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-xs font-mono" style={{ color: 'var(--foreground-muted)' }}>start searching...</p>
            </div>
          ) : null}
        </section>
      </div>
        </div>
      </div>

      {/* Right Side - Detail Panel */}
      {selectedItem && (
        <div className={`${isMobile ? 'fixed inset-0 z-50' : 'w-1/2'} ${isMobile && !showMobileDetail ? 'hidden' : 'flex'} h-screen border-l flex-col overflow-hidden`} style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
          {/* Mobile Back Button */}
          {isMobile && (
            <div className="border-b px-4 py-3 flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => {
                  setShowMobileDetail(false);
                  setSelectedItem(null);
                }}
                className="flex items-center gap-2 text-sm font-mono hover:opacity-70 transition-opacity"
                style={{ color: 'var(--primary)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                back to results
              </button>
            </div>
          )}
          
          <DetailPanel
            mediaType={selectedItem.mediaType}
            id={selectedItem.id}
            onClose={() => {
              setSelectedItem(null);
              if (isMobile) {
                setShowMobileDetail(false);
              }
            }}
          />
        </div>
      )}
    </main>
  );
}
