import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_URL = 'https://api.themoviedb.org/3';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  // Validierung der Eingabe
  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  // Begrenzung der Suchlänge
  if (query.length > 500) {
    return NextResponse.json({ error: 'Query is too long (max 500 characters)' }, { status: 400 });
  }

  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_api_key_goes_here') {
    console.error("TMDB_API_KEY not configured.");
    return NextResponse.json({ error: 'TMDB API key is not configured on the server.' }, { status: 500 });
  }

  try {
    const url = `${TMDB_API_URL}/search/multi?api_key=${TMDB_API_KEY}&language=de-DE&query=${encodeURIComponent(query.trim())}&page=1`;
    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache für 1 Stunde
    });

    if (!response.ok) {
      // Log the error response from TMDB
      const errorBody = await response.json().catch(() => ({ message: "Could not parse error body" }));
      console.error('TMDB API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      
      // Spezifische Fehlerbehandlung
      if (response.status === 401) {
        return NextResponse.json({ error: 'API authentication failed' }, { status: 500 });
      }
      if (response.status === 404) {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
      }
      if (response.status === 429) {
        return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
      }
      
      return NextResponse.json(
        { error: `Failed to fetch data from TMDB: ${response.statusText}`, details: errorBody },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Validierung der Antwortstruktur
    if (!data.results || !Array.isArray(data.results)) {
      console.error('Invalid response structure from TMDB:', data);
      return NextResponse.json({ error: 'Invalid response from TMDB' }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Internal Server Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch data from TMDB', details: errorMessage }, { status: 500 });
  }
}
