import { NextRequest, NextResponse } from 'next/server';

// Since JustWatch API is not publicly available and doesn't work reliably,
// we use a heuristic approach: Show public broadcasters for content that's likely available
// This is more honest than showing a broken API integration

interface MediathekHeuristics {
  showForCountries: string[];
  preferTVShows: boolean;
  minAgeMonths?: number;
}

const MEDIATHEK_CONFIG: { [name: string]: MediathekHeuristics } = {
  'ARD Mediathek': {
    showForCountries: ['DE', 'AT', 'CH'],
    preferTVShows: true,
    minAgeMonths: 0 // Shows current and recent content
  },
  'ZDF Mediathek': {
    showForCountries: ['DE', 'AT', 'CH'],
    preferTVShows: true,
    minAgeMonths: 0
  },
  'Arte Mediathek': {
    showForCountries: ['DE', 'AT', 'CH', 'FR'],
    preferTVShows: false, // Arte has movies and shows
    minAgeMonths: 0
  },
  '3sat Mediathek': {
    showForCountries: ['DE', 'AT', 'CH'],
    preferTVShows: false,
    minAgeMonths: 0
  },
  'ORF TVthek': {
    showForCountries: ['AT'],
    preferTVShows: true,
    minAgeMonths: 0
  },
  'SRF Play': {
    showForCountries: ['CH'],
    preferTVShows: true,
    minAgeMonths: 0
  },
  'BBC iPlayer': {
    showForCountries: ['GB'],
    preferTVShows: true,
    minAgeMonths: 0
  },
  'ITV Hub': {
    showForCountries: ['GB'],
    preferTVShows: true,
    minAgeMonths: 0
  },
  'Channel 4': {
    showForCountries: ['GB'],
    preferTVShows: true,
    minAgeMonths: 0
  },
  'PBS': {
    showForCountries: ['US'],
    preferTVShows: false,
    minAgeMonths: 0
  },
  'France.tv': {
    showForCountries: ['FR'],
    preferTVShows: true,
    minAgeMonths: 0
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const country = searchParams.get('country') || 'DE';
    const mediaType = searchParams.get('media_type'); // 'movie' or 'tv'

    if (!title) {
      return NextResponse.json(
        { error: 'Title parameter is required' },
        { status: 400 }
      );
    }

    const availableOn: string[] = [];
    const isTVShow = mediaType === 'tv';

    // Apply heuristics to determine which mediatheken to show
    Object.entries(MEDIATHEK_CONFIG).forEach(([name, config]) => {
      // Check if this mediathek serves the current country
      if (!config.showForCountries.includes(country)) {
        return;
      }

      // If mediathek prefers TV shows and this is a movie, skip (unless it's Arte which shows both)
      if (config.preferTVShows && !isTVShow && name !== 'Arte Mediathek' && name !== '3sat Mediathek') {
        return;
      }

      // Show the mediathek as potentially available
      availableOn.push(name);
    });

    return NextResponse.json(
      { 
        available: availableOn,
        note: 'Public broadcasters shown based on content type and region. Click to search their platforms.'
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
        }
      }
    );

  } catch (error) {
    console.error('Mediathek check error:', error);
    return NextResponse.json(
      { available: [], error: 'Failed to check availability' },
      { status: 200 }
    );
  }
}
