import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request: NextRequest) {
  try {
    if (!TMDB_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Get current date and date from 1 month ago
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];

    // Fetch recent movies and TV shows
    const [moviesResponse, tvResponse] = await Promise.all([
      fetch(
        `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=de-DE&region=DE&sort_by=popularity.desc&primary_release_date.gte=${oneMonthAgoStr}&primary_release_date.lte=${todayStr}&with_release_type=3|2&vote_count.gte=10`,
        { next: { revalidate: 3600 } } // Cache for 1 hour
      ),
      fetch(
        `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=de-DE&sort_by=popularity.desc&first_air_date.gte=${oneMonthAgoStr}&first_air_date.lte=${todayStr}&vote_count.gte=10`,
        { next: { revalidate: 3600 } }
      )
    ]);

    if (!moviesResponse.ok || !tvResponse.ok) {
      throw new Error('Failed to fetch new releases');
    }

    const moviesData = await moviesResponse.json();
    const tvData = await tvResponse.json();

    // Combine and sort by popularity
    const combined = [
      ...moviesData.results.slice(0, 10).map((item: any) => ({ ...item, media_type: 'movie' })),
      ...tvData.results.slice(0, 10).map((item: any) => ({ ...item, media_type: 'tv' }))
    ].sort((a, b) => b.popularity - a.popularity).slice(0, 12);

    return NextResponse.json(
      { results: combined },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
        }
      }
    );

  } catch (error) {
    console.error('Error fetching new releases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch new releases', results: [] },
      { status: 500 }
    );
  }
}
