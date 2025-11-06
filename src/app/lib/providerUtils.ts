// Provider popularity ranking (higher = more popular)
export const providerPopularity: { [providerName: string]: number } = {
  // Tier 1: Most popular global services
  'Netflix': 1000,
  'Netflix basic with Ads': 1000,
  'Amazon Prime Video': 950,
  'Prime Video': 950,
  'Amazon Video': 950,
  'Disney Plus': 900,
  'Disney+': 900,
  'Apple TV Plus': 850,
  'Apple TV': 850,
  
  // Tier 2: Popular streaming services
  'HBO Max': 800,
  'Max': 800,
  'Paramount Plus': 750,
  'Paramount+': 750,
  'Sky': 700,
  'Sky Go': 700,
  'WOW': 700,
  'RTL+': 650,
  'Joyn': 650,
  'Joyn Plus': 650,
  
  // Tier 3: Regional/specialized
  'MagentaTV': 600,
  'Crunchyroll': 550,
  'DAZN': 500,
  'YouTube Premium': 480,
  'Rakuten TV': 450,
  'Apple iTunes': 440,
  'Google Play Movies': 430,
  'Microsoft Store': 420,
  'Chili': 400,
  'maxdome Store': 390,
  'Videobuster': 380,
  'Pantaflix': 370,
  'Freevee': 360,
  'Pluto TV': 350,
  'Plex': 340,
  
  // Default for unknown providers
};

// Provider grouping - map variant names to primary name
export const providerGroups: { [variant: string]: string } = {
  'Netflix basic with Ads': 'Netflix',
  'Netflix Kids': 'Netflix',
  'Amazon Video': 'Prime Video',
  'Amazon Prime Video': 'Prime Video',
  'Prime Video Amazon Channel': 'Prime Video',
  'Disney+': 'Disney Plus',
  'Apple TV': 'Apple TV Plus',
  'Apple TV+': 'Apple TV Plus',
  'HBO Max': 'Max',
  'Paramount+': 'Paramount Plus',
  'Sky Go': 'Sky',
  'Sky Ticket': 'Sky',
  'Sky Store': 'Sky',
  'WOW Presents Plus': 'WOW',
  'Joyn Plus': 'Joyn',
  'Google Play Movies': 'Google Play',
  'YouTube Premium': 'YouTube',
  'Crunchyroll Amazon Channel': 'Crunchyroll',
  'iTunes': 'Apple iTunes',
  'Apple iTunes': 'Apple TV',
};

export const getProviderGroup = (providerName: string): string => {
  return providerGroups[providerName] || providerName;
};

export const getProviderPopularity = (providerName: string): number => {
  const groupName = getProviderGroup(providerName);
  return providerPopularity[groupName] || providerPopularity[providerName] || 100;
};
