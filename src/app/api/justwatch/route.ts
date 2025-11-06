import { NextRequest, NextResponse } from 'next/server';

// JustWatch API endpoint (unofficial)
const JUSTWATCH_API_BASE = 'https://apis.justwatch.com/content';

interface JustWatchProvider {
  provider_id: number;
  monetization_type: string;
}

interface JustWatchOffer {
  monetization_type: string;
  presentation_type: string;
  provider_id: number;
  urls?: {
    standard_web?: string;
  };
}

// Public broadcaster provider IDs in JustWatch
const PUBLIC_BROADCASTER_IDS: { [country: string]: { [name: string]: number } } = {
  DE: {
    'ARD Mediathek': 360,
    'ZDF Mediathek': 362,
    'Arte': 234,
    '3sat': 513
  },
  AT: {
    'ORF TVthek': 283
  },
  CH: {
    'SRF': 457
  },
  GB: {
    'BBC iPlayer': 38,
    'ITV Hub': 65,
    'Channel 4': 103
  },
  US: {
    'PBS': 209
  },
  FR: {
    'France.tv': 263,
    'Arte': 234
  },
  // Add more as needed
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const country = searchParams.get('country') || 'DE';
    const mediaType = searchParams.get('media_type'); // 'movie' or 'show'

    if (!title) {
      return NextResponse.json(
        { error: 'Title parameter is required' },
        { status: 400 }
      );
    }

    // Search for the title on JustWatch
    const searchUrl = `${JUSTWATCH_API_BASE}/titles/${country.toLowerCase()}/popular`;
    
    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        query: title,
        content_types: mediaType === 'tv' ? ['show'] : ['movie'],
        page_size: 5
      })
    });

    if (!searchResponse.ok) {
      console.error('JustWatch search failed:', searchResponse.status);
      return NextResponse.json(
        { available: [], error: 'JustWatch search failed' },
        { status: 200 }
      );
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({ available: [] }, { status: 200 });
    }

    // Get the first matching item
    const item = searchData.items[0];
    const offers: JustWatchOffer[] = item.offers || [];

    // Filter for public broadcasters
    const publicBroadcasterIds = PUBLIC_BROADCASTER_IDS[country] || {};
    const availableOn: string[] = [];

    Object.entries(publicBroadcasterIds).forEach(([name, providerId]) => {
      const hasOffer = offers.some(
        offer => 
          offer.provider_id === providerId && 
          (offer.monetization_type === 'flatrate' || offer.monetization_type === 'free')
      );
      
      if (hasOffer) {
        availableOn.push(name);
      }
    });

    return NextResponse.json(
      { available: availableOn },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
        }
      }
    );

  } catch (error) {
    console.error('JustWatch API error:', error);
    return NextResponse.json(
      { available: [], error: 'Failed to check availability' },
      { status: 200 }
    );
  }
}
