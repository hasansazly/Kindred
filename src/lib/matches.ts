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
    fullName: string;
    firstName: string;
    age: number | null;
    location: string;
    bio: string;
    photoUrl: string | null;
    photos: string[];
    interests: string[];
  };
};

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

type ProfileRow = {
  id: string;
  [key: string]: unknown;
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

  if (matchError) {
    return [];
  }
  if (!matchRows || matchRows.length === 0) {
    return [];
  }

  const rows = matchRows as MatchRow[];
  const matchedUserIds = rows.map(row => row.matched_user_id);

  const { data: profileRows, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', matchedUserIds);

  const { data: onboardingRows, error: onboardingError } = await supabase
    .from('onboarding_responses')
    .select('user_id,category,response')
    .in('user_id', matchedUserIds)
    .in('category', ['demographics', 'profile_meta']);

  const byUser = new Map<string, { demographics?: Record<string, unknown>; profileMeta?: Record<string, unknown> }>();
  (onboardingError ? [] : (onboardingRows as OnboardingRow[] | null))?.forEach(row => {
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

  const profilesById = new Map<string, ProfileRow>();
  (profileError ? [] : (profileRows as ProfileRow[] | null))?.forEach(profile => {
    profilesById.set(profile.id, profile);
  });

  return rows.map(row => {
    const snapshot = byUser.get(row.matched_user_id);
    const profile = profilesById.get(row.matched_user_id);
    const demographics = snapshot?.demographics ?? {};
    const profileMeta = snapshot?.profileMeta ?? {};

    const fullName =
      (typeof demographics.fullName === 'string' ? demographics.fullName : '') ||
      (typeof profile?.full_name === 'string' ? profile.full_name : '') ||
      (typeof profile?.first_name === 'string' ? profile.first_name : '') ||
      'Vinculo Match';
    const age =
      typeof demographics.age === 'number'
        ? demographics.age
        : typeof profile?.age === 'number'
          ? profile.age
          : null;
    const location =
      (typeof demographics.location === 'string' ? demographics.location : '') ||
      (typeof profile?.location === 'string' ? profile.location : '') ||
      '';
    const bio =
      (typeof demographics.bio === 'string' ? demographics.bio : '') ||
      (typeof profile?.bio === 'string' ? profile.bio : '') ||
      'Intentional dater on Vinculo.';
    const photos = toStringArray(profileMeta.photos);
    const interests = toStringArray(demographics.interests).length
      ? toStringArray(demographics.interests)
      : toStringArray(profile?.interests);

    return {
      id: row.id,
      userId: row.user_id,
      matchedUserId: row.matched_user_id,
      status: row.status,
      explanation: row.explanation || '',
      compatibilityReasons: toStringArray(row.compatibility_reasons),
      createdAt: row.created_at,
      matchedProfile: {
        fullName,
        firstName: parseFirstName(fullName),
        age,
        location,
        bio,
        photoUrl: photos[0] ?? null,
        photos,
        interests,
      },
    };
  });
}

export function findMatchById(matches: MatchView[], id: string) {
  return matches.find(match => match.id === id) ?? null;
}
