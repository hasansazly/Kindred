import type { MatchView } from '@/lib/matches';

export type ViewerTier = 'free' | 'paid';

const DEFAULT_CURRENT_WINDOW_DAYS = 14;

function normalizeTierValue(value: unknown): ViewerTier | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (
    normalized.includes('paid') ||
    normalized.includes('premium') ||
    normalized.includes('pro') ||
    normalized.includes('plus')
  ) {
    return 'paid';
  }
  if (normalized.includes('free')) return 'free';
  return null;
}

export function resolveViewerTier(profile: Record<string, unknown> | null | undefined): ViewerTier {
  // Subscription is removed: all users are on a single free plan.
  void profile;
  return 'free';
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function parseDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isPotentialFit(match: MatchView): boolean {
  return typeof match.compatibilityScore === 'number' && match.compatibilityScore >= 50 && match.compatibilityScore < 65;
}

function isEligibleForTier(match: MatchView, tier: ViewerTier): boolean {
  if (match.conversationDisabled) return false;
  if (tier === 'free' && typeof match.compatibilityScore === 'number' && match.compatibilityScore < 65) {
    return false;
  }
  return true;
}

export function getDashboardPreviewLimit(tier: ViewerTier): number {
  void tier;
  return 3;
}

export function getDashboardTodayPreview(matches: MatchView[], tier: ViewerTier, now = new Date()): MatchView[] {
  const todayMatches = matches
    .filter(match => isEligibleForTier(match, tier))
    .filter(match => {
      const createdAt = parseDate(match.createdAt);
      return createdAt ? isSameLocalDay(createdAt, now) : false;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return todayMatches.slice(0, getDashboardPreviewLimit(tier));
}

export function getDiscoverSections(
  matches: MatchView[],
  tier: ViewerTier,
  now = new Date(),
  currentWindowDays = DEFAULT_CURRENT_WINDOW_DAYS
) {
  const cutoff = new Date(now.getTime() - currentWindowDays * 24 * 60 * 60 * 1000);

  const currentCurated = matches
    .filter(match => isEligibleForTier(match, tier))
    .filter(match => {
      const createdAt = parseDate(match.createdAt);
      return createdAt ? createdAt >= cutoff : false;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const potentialFit: MatchView[] = [];

  const newToday = currentCurated.filter(match => {
    const createdAt = parseDate(match.createdAt);
    if (!createdAt) return false;
    if (!isSameLocalDay(createdAt, now)) return false;
    return true;
  });

  const activeMatches = currentCurated.filter(match => {
    const createdAt = parseDate(match.createdAt);
    if (!createdAt) return false;
    if (isSameLocalDay(createdAt, now)) return false;
    return true;
  });

  return {
    newToday,
    activeMatches,
    potentialFit,
    currentCurated,
  };
}
