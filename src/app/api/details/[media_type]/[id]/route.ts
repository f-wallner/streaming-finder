import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_URL = 'https://api.themoviedb.org/3';

interface RouteParams {
  params: Promise<{
    media_type: string;
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { media_type, id } = await params;

  // Validierung von media_type
  if (media_type !== 'movie' && media_type !== 'tv') {
    return NextResponse.json({ error: 'Invalid media type. Must be "movie" or "tv".' }, { status: 400 });
  }

  // Validierung von ID
  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid ID parameter. Must be a number.' }, { status: 400 });
  }

  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_api_key_goes_here') {
    console.error("TMDB_API_KEY not configured.");
    return NextResponse.json({ error: 'TMDB API key is not configured on the server.' }, { status: 500 });
  }

  try {
    // Zwei Anfragen parallel starten: eine für die Details, eine für die Anbieter
    const [detailsResponse, providersResponse] = await Promise.all([
      fetch(`${TMDB_API_URL}/${media_type}/${id}?api_key=${TMDB_API_KEY}&language=de-DE`, {
        next: { revalidate: 86400 } // Cache für 24 Stunden
      }),
      fetch(`${TMDB_API_URL}/${media_type}/${id}/watch/providers?api_key=${TMDB_API_KEY}`, {
        next: { revalidate: 3600 } // Cache für 1 Stunde (Anbieter ändern sich häufiger)
      })
    ]);

    if (!detailsResponse.ok) {
      const errorBody = await detailsResponse.json().catch(() => ({}));
      console.error('TMDB Details API Error:', {
        status: detailsResponse.status,
        statusText: detailsResponse.statusText,
        body: errorBody,
      });
      
      if (detailsResponse.status === 404) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 });
      }
      if (detailsResponse.status === 401) {
        return NextResponse.json({ error: 'API authentication failed' }, { status: 500 });
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch details from TMDB', details: errorBody },
        { status: detailsResponse.status }
      );
    }
    
    if (!providersResponse.ok) {
      const errorBody = await providersResponse.json().catch(() => ({}));
      console.error('TMDB Providers API Error:', {
        status: providersResponse.status,
        statusText: providersResponse.statusText,
        body: errorBody,
      });
      
      // Providers sind optional - fahren ohne sie fort
      const details = await detailsResponse.json();
      return NextResponse.json({
        ...details,
        watch_providers: {},
      });
    }

    const details = await detailsResponse.json();
    const providers = await providersResponse.json();

    // Die Ergebnisse kombinieren
    const combinedData = {
      ...details,
      watch_providers: providers.results || {},
    };

    return NextResponse.json(combinedData);
  } catch (error) {
    console.error('Internal Server Error fetching details:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch data from TMDB', details: errorMessage }, { status: 500 });
  }
}
