// Öffentlich-rechtliche Mediatheken weltweit
export const publicBroadcasters: { [country: string]: Array<{ name: string; url: string; search_url?: string }> } = {
  // Deutschland
  DE: [
    { 
      name: 'ARD Mediathek', 
      url: 'https://www.ardmediathek.de',
      search_url: 'https://www.ardmediathek.de/suche/'
    },
    { 
      name: 'ZDF Mediathek', 
      url: 'https://www.zdf.de/suche',
      search_url: 'https://www.zdf.de/suche?q='
    },
    { 
      name: 'Arte Mediathek', 
      url: 'https://www.arte.tv/de/',
      search_url: 'https://www.arte.tv/de/search/?q='
    },
    { 
      name: '3sat Mediathek', 
      url: 'https://www.3sat.de/suche',
      search_url: 'https://www.3sat.de/suche?q='
    }
  ],
  
  // Österreich
  AT: [
    { 
      name: 'ORF TVthek', 
      url: 'https://tvthek.orf.at',
      search_url: 'https://tvthek.orf.at/search?q='
    }
  ],
  
  // Schweiz
  CH: [
    { 
      name: 'SRF Play', 
      url: 'https://www.srf.ch/play',
      search_url: 'https://www.srf.ch/play/suche?q='
    },
    { 
      name: 'RTS Play', 
      url: 'https://www.rts.ch/play',
      search_url: 'https://www.rts.ch/play/recherche?query='
    }
  ],
  
  // UK
  GB: [
    { 
      name: 'BBC iPlayer', 
      url: 'https://www.bbc.co.uk/iplayer',
      search_url: 'https://www.bbc.co.uk/iplayer/search?q='
    },
    { 
      name: 'ITV Hub', 
      url: 'https://www.itv.com',
      search_url: 'https://www.itv.com/hub/search?q='
    },
    { 
      name: 'Channel 4', 
      url: 'https://www.channel4.com',
      search_url: 'https://www.channel4.com/search?q='
    }
  ],
  
  // USA
  US: [
    { 
      name: 'PBS', 
      url: 'https://www.pbs.org/video',
      search_url: 'https://www.pbs.org/search/?q='
    },
    { 
      name: 'ABC', 
      url: 'https://abc.com',
      search_url: 'https://abc.com/search?q='
    }
  ],
  
  // Frankreich
  FR: [
    { 
      name: 'France.tv', 
      url: 'https://www.france.tv',
      search_url: 'https://www.france.tv/recherche/?q='
    },
    { 
      name: 'Arte (FR)', 
      url: 'https://www.arte.tv/fr/',
      search_url: 'https://www.arte.tv/fr/search/?q='
    }
  ],
  
  // Spanien
  ES: [
    { 
      name: 'RTVE Play', 
      url: 'https://www.rtve.es/play/',
      search_url: 'https://www.rtve.es/play/buscador/?q='
    }
  ],
  
  // Italien
  IT: [
    { 
      name: 'RaiPlay', 
      url: 'https://www.raiplay.it',
      search_url: 'https://www.raiplay.it/ricerca?q='
    }
  ],
  
  // Niederlande
  NL: [
    { 
      name: 'NPO Start', 
      url: 'https://www.npostart.nl',
      search_url: 'https://www.npostart.nl/zoeken?query='
    }
  ],
  
  // Belgien
  BE: [
    { 
      name: 'VRT MAX', 
      url: 'https://www.vrt.be/vrtmax/',
      search_url: 'https://www.vrt.be/vrtmax/zoeken/?q='
    }
  ],
  
  // Schweden
  SE: [
    { 
      name: 'SVT Play', 
      url: 'https://www.svtplay.se',
      search_url: 'https://www.svtplay.se/sok?q='
    }
  ],
  
  // Norwegen
  NO: [
    { 
      name: 'NRK TV', 
      url: 'https://tv.nrk.no',
      search_url: 'https://tv.nrk.no/sok?q='
    }
  ],
  
  // Dänemark
  DK: [
    { 
      name: 'DR TV', 
      url: 'https://www.dr.dk/drtv',
      search_url: 'https://www.dr.dk/drtv/search?q='
    }
  ],
  
  // Finnland
  FI: [
    { 
      name: 'Yle Areena', 
      url: 'https://areena.yle.fi',
      search_url: 'https://areena.yle.fi/tv/haku?query='
    }
  ],
  
  // Polen
  PL: [
    { 
      name: 'TVP VOD', 
      url: 'https://vod.tvp.pl',
      search_url: 'https://vod.tvp.pl/search?q='
    }
  ],
  
  // Australien
  AU: [
    { 
      name: 'ABC iView', 
      url: 'https://iview.abc.net.au',
      search_url: 'https://iview.abc.net.au/search?query='
    },
    { 
      name: 'SBS On Demand', 
      url: 'https://www.sbs.com.au/ondemand',
      search_url: 'https://www.sbs.com.au/ondemand/search?query='
    }
  ],
  
  // Kanada
  CA: [
    { 
      name: 'CBC Gem', 
      url: 'https://gem.cbc.ca',
      search_url: 'https://gem.cbc.ca/search?q='
    }
  ],
  
  // Japan
  JP: [
    { 
      name: 'NHK Plus', 
      url: 'https://plus.nhk.jp',
      search_url: 'https://plus.nhk.jp/search?q='
    }
  ]
};

export const getPublicBroadcastersForCountries = (countryCodes: string[]): { country: string; broadcasters: Array<{ name: string; url: string; search_url?: string }> }[] => {
  return countryCodes
    .map(code => ({
      country: code,
      broadcasters: publicBroadcasters[code] || []
    }))
    .filter(item => item.broadcasters.length > 0);
};
