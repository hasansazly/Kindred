import type { SupabaseClient } from '@supabase/supabase-js';

export type MatchView = {
  id: string;
  userId: string;
  matchedUserId: string;
  status: string;
  explanation: string;
  compatibilityReasons: string[];
  createdAt: string;
  matchedProfile: {
    firstName: string;
    age: number | null;
    location: string;
    bio: string;
    photoUrl: string;
  };
};

const DEFAULT_PROFILE_PHOTO = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80';

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
}

function parseFirstName(fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) return 'Member';
  return trimmed.split(/\s+/)[0] || 'Member';
}

type MatchRow = {
  id: string;
  user_id: string;
  matched_user_id: string;
  status: string;
  explanation: string;
  compatibility_reasons: string[] | null;
  created_at: string;
};

type OnboardingRow = {
  user_id: string;
  category: string;
  response: unknown;
};

export async function getMatchesForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<MatchView[]> {
  const { data: matchRows, error: matchError } = await supabase
    .from('matches')
    .select('id,user_id,matched_user_id,status,explanation,compatibility_reasons,created_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const matchesTableMissing =
    matchError?.code === 'PGRST205' ||
    matchError?.message?.includes('public.matches');
  if (matchError && !matchesTableMissing) {
    throw new Error(matchError.message);
  }
  if (!matchRows || matchRows.length === 0) {
    return [];
  }

  const rows = matchRows as MatchRow[];
  const matchedUserIds = rows.map(row => row.matched_user_id);

  const { data: onboardingRows, error: onboardingError } = await supabase
    .from('onboarding_responses')
    .select('user_id,category,response')
    .in('user_id', matchedUserIds)
    .in('category', ['demographics', 'profile_meta']);

  if (onboardingError) {
    throw new Error(onboardingError.message);
  }

  const byUser = new Map<string, { demographics?: Record<string, unknown>; profileMeta?: Record<string, unknown> }>();
  (onboardingRows as OnboardingRow[] | null)?.forEach(row => {
    if (!row || typeof row.response !== 'object' || row.response === null) return;
    const existing = byUser.get(row.user_id) ?? {};
    if (row.category === 'demographics') {
      existing.demographics = row.response as Record<string, unknown>;
    }
    if (row.category === 'profile_meta') {
      existing.profileMeta = row.response as Record<string, unknown>;
    }
    byUser.set(row.user_id, existing);
  });

  return rows.map(row => {
    const snapshot = byUser.get(row.matched_user_id);
    const demographics = snapshot?.demographics ?? {};
    const profileMeta = snapshot?.profileMeta ?? {};

    const fullName = typeof demographics.fullName === 'string' ? demographics.fullName : '';
    const age = typeof demographics.age === 'number' ? demographics.age : null;
    const location = typeof demographics.location === 'string' ? demographics.location : '';
    const bio = typeof demographics.bio === 'string' ? demographics.bio : '';
    const photos = toStringArray(profileMeta.photos);

    return {
      id: row.id,
      userId: row.user_id,
      matchedUserId: row.matched_user_id,
      status: row.status,
      explanation: row.explanation || '',
      compatibilityReasons: toStringArray(row.compatibility_reasons),
      createdAt: row.created_at,
      matchedProfile: {
        firstName: parseFirstName(fullName),
        age,
        location,
        bio,
        photoUrl: photos[0] ?? DEFAULT_PROFILE_PHOTO,
      },
    };
  });
}

export function findMatchById(matches: MatchView[], id: string) {
  return matches.find(match => match.id === id) ?? null;
}
