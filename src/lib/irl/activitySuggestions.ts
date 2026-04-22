export type IRLActivityCategory = 'quiet/intimate' | 'social/active' | 'adventurous';

export type IRLCompatibilityProfile = {
  values: string[];
  communicationStyle: string;
};

export type IRLActivitySuggestionCard = {
  category: IRLActivityCategory;
  title: string;
  summary: string;
  ideas: string[];
};

const QUIET_HINTS = new Set([
  'calm',
  'deep',
  'intentional',
  'reflective',
  'cozy',
  'home',
  'quality time',
  'one-on-one',
]);

const SOCIAL_HINTS = new Set([
  'social',
  'playful',
  'community',
  'active',
  'friends',
  'outgoing',
  'group',
]);

const ADVENTURE_HINTS = new Set([
  'adventure',
  'spontaneous',
  'curious',
  'explore',
  'travel',
  'outdoors',
  'risk',
]);

const SUGGESTIONS: Record<IRLActivityCategory, IRLActivitySuggestionCard> = {
  'quiet/intimate': {
    category: 'quiet/intimate',
    title: 'Low-pressure, deeper-conversation date',
    summary: 'A calm setting that helps both of you settle in and talk with focus.',
    ideas: ['Coffee + bookstore stroll', 'Tea room with a short walk', 'Quiet dessert spot and check-in prompts'],
  },
  'social/active': {
    category: 'social/active',
    title: 'Energetic date with easy momentum',
    summary: 'A date with light activity that keeps things natural and fun.',
    ideas: ['Trivia night at a relaxed bar', 'Mini golf or arcade + snacks', 'Farmers market walk and casual lunch'],
  },
  adventurous: {
    category: 'adventurous',
    title: 'Adventure-forward first meet',
    summary: 'A shared novelty moment that still leaves space to connect.',
    ideas: ['Sunset hike + post-walk drink', 'Climbing gym intro session', 'Pop-up food crawl in a new neighborhood'],
  },
};

function normalize(input: string) {
  return input.trim().toLowerCase();
}

function scoreFromHints(tokens: string[], hints: Set<string>) {
  return tokens.reduce((score, token) => (hints.has(token) ? score + 1 : score), 0);
}

export function mapProfileToActivityCategory(profile: IRLCompatibilityProfile): IRLActivityCategory {
  const valueTokens = profile.values.map(normalize);
  const communicationToken = normalize(profile.communicationStyle);
  const tokens = [...valueTokens, communicationToken];

  const quietScore = scoreFromHints(tokens, QUIET_HINTS);
  const socialScore = scoreFromHints(tokens, SOCIAL_HINTS);
  const adventurousScore = scoreFromHints(tokens, ADVENTURE_HINTS);

  if (adventurousScore > socialScore && adventurousScore > quietScore) return 'adventurous';
  if (socialScore > quietScore) return 'social/active';
  return 'quiet/intimate';
}

export function getActivitySuggestionFromProfile(profile: IRLCompatibilityProfile): IRLActivitySuggestionCard {
  const category = mapProfileToActivityCategory(profile);
  return SUGGESTIONS[category];
}

export function getActivitySuggestionByCategory(category: IRLActivityCategory): IRLActivitySuggestionCard {
  return SUGGESTIONS[category];
}
