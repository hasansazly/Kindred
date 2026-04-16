import { CURRENT_USER, MATCHES, PROFILES } from '@/lib/mockData';
import type { AttachmentStyle, Gender, LoveLanguage, RelationshipGoal, UserProfile } from '@/lib/types';
import { createSupabaseServerClient } from '../../../utils/supabase/server';
import type {
  MatchmakingCandidateScore,
  MatchmakingRun,
  MatchmakingSignal,
  MatchmakingStore,
  MatchShownHistory,
  UserReport,
} from './types';

declare global {
  var __vinculoMatchStore:
    | {
        signals: MatchmakingSignal[];
        recs: Map<string, MatchmakingCandidateScore[]>;
        runs: MatchmakingRun[];
      }
    | undefined;
}

type ProfileRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  age?: number | null;
  gender?: string | null;
  location?: string | null;
  bio?: string | null;
  occupation?: string | null;
  education?: string | null;
  interests?: unknown;
  core_values?: unknown;
  onboarding_complete?: boolean | null;
  profile_completeness?: number | null;
  photos_count?: number | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type PreferenceRow = {
  user_id: string;
  relationship_intent?: string | null;
  communication_style?: string | null;
  values?: unknown;
  lifestyle?: unknown;
  dealbreakers?: unknown;
  interested_in?: unknown;
  min_age?: number | null;
  max_age?: number | null;
  distance_km?: number | null;
};

type OnboardingRow = {
  user_id: string;
  category: string;
  response: unknown;
};

function getState() {
  if (!globalThis.__vinculoMatchStore) {
    globalThis.__vinculoMatchStore = {
      signals: [],
      recs: new Map<string, MatchmakingCandidateScore[]>(),
      runs: [],
    };
  }
  return globalThis.__vinculoMatchStore;
}

const ALL_USERS: UserProfile[] = [CURRENT_USER, ...PROFILES];

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(item => typeof item === 'string').map(item => String(item).trim()).filter(Boolean);
}

function normalizeGender(value: unknown): Gender {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'man') return 'man';
  if (normalized === 'woman') return 'woman';
  if (normalized === 'nonbinary') return 'nonbinary';
  return 'other';
}

function normalizeRelationshipGoal(value: unknown): RelationshipGoal {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw.includes('long') || raw.includes('marriage') || raw.includes('serious') || raw === 'relationship') {
    return 'relationship';
  }
  if (raw.includes('casual')) return 'casual';
  if (raw.includes('friend')) return 'friendship';
  return 'unsure';
}

function normalizeAttachmentStyle(value: unknown): AttachmentStyle {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'secure' || raw === 'anxious' || raw === 'avoidant' || raw === 'disorganized') {
    return raw;
  }
  return 'secure';
}

function normalizeLoveLanguage(value: unknown): LoveLanguage {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'words' || raw === 'acts' || raw === 'gifts' || raw === 'time' || raw === 'touch') {
    return raw;
  }
  return 'time';
}

function toInClause(ids: string[]): string {
  return `(${ids.map(id => `'${id.replace(/'/g, "''")}'`).join(',')})`;
}

function lowerStrings(values: string[]): string[] {
  return values.map(v => v.trim().toLowerCase()).filter(Boolean);
}

function normalizeGenderPreferences(value: unknown): string[] {
  return lowerStrings(toStringArray(value)).map(item => {
    if (item.startsWith('men') || item === 'male' || item === 'man') return 'man';
    if (item.startsWith('women') || item === 'female' || item === 'woman') return 'woman';
    if (item.includes('non')) return 'nonbinary';
    if (item === 'other') return 'other';
    return item;
  });
}

function findResponseMap(rows: OnboardingRow[]): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    if (!row || typeof row.response !== 'object' || row.response === null) continue;
    map.set(`${row.user_id}:${row.category}`, row.response as Record<string, unknown>);
  }
  return map;
}

function mapProfileToUser(
  profile: ProfileRow,
  preference: PreferenceRow | undefined,
  responseMap: Map<string, Record<string, unknown>>,
  selfLocation: string | undefined
): UserProfile {
  const demographics = responseMap.get(`${profile.id}:demographics`) ?? {};
  const relationshipIntent = responseMap.get(`${profile.id}:relationship_intent`) ?? {};
  const valuesResponse = responseMap.get(`${profile.id}:values`) ?? {};
  const communication = responseMap.get(`${profile.id}:communication_style`) ?? {};
  const lifestyle = responseMap.get(`${profile.id}:lifestyle`) ?? {};
  const profileMeta = responseMap.get(`${profile.id}:profile_meta`) ?? {};

  const explicitPhotos = toStringArray((profileMeta as { photos?: unknown }).photos);
  const photosCount = typeof profile.photos_count === 'number' ? Math.max(0, profile.photos_count) : 0;
  const photos = explicitPhotos.length > 0 ? explicitPhotos : Array.from({ length: photosCount }, () => '');

  const interests =
    toStringArray(profile.interests).length > 0
      ? toStringArray(profile.interests)
      : toStringArray((demographics as { interests?: unknown }).interests);

  const values =
    toStringArray(profile.core_values).length > 0
      ? toStringArray(profile.core_values)
      : toStringArray(valuesResponse.values ?? preference?.values);

  const communicationStyle = String(
    communication.communicationStyle ?? preference?.communication_style ?? 'secure'
  ).toLowerCase();

  const personalityTraits = communicationStyle
    .split(/[ ,/]+/)
    .map(token => token.trim())
    .filter(Boolean)
    .slice(0, 4);

  const lifestyleTags = toStringArray(lifestyle.lifestyle ?? preference?.lifestyle);
  const smoking = lifestyleTags.find(tag => tag.toLowerCase().includes('smok')) ?? 'Never';
  const drinking = lifestyleTags.find(tag => tag.toLowerCase().includes('drink')) ?? 'Socially';
  const kids = lifestyleTags.find(tag => tag.toLowerCase().includes('kid')) ?? 'Open to it';

  return {
    id: profile.id,
    name:
      profile.full_name?.trim() ||
      (typeof demographics.fullName === 'string' ? demographics.fullName.trim() : '') ||
      profile.email?.split('@')[0] ||
      'Member',
    age:
      typeof profile.age === 'number'
        ? profile.age
        : typeof demographics.age === 'number'
          ? demographics.age
          : 28,
    gender: normalizeGender(profile.gender ?? demographics.gender),
    location:
      profile.location?.trim() ||
      (typeof demographics.location === 'string' ? demographics.location.trim() : '') ||
      'Location not shared yet',
    bio:
      profile.bio?.trim() ||
      (typeof demographics.bio === 'string' ? demographics.bio.trim() : '') ||
      'Intentional dater on Vinculo.',
    occupation:
      profile.occupation?.trim() ||
      (typeof demographics.occupation === 'string' ? demographics.occupation.trim() : '') ||
      'Professional',
    education: profile.education?.trim() || 'Not shared',
    photos,
    interests,
    values,
    personalityTraits: personalityTraits.length > 0 ? personalityTraits : ['Curious', 'Warm', 'Intentional'],
    relationshipGoal: normalizeRelationshipGoal(
      preference?.relationship_intent ?? relationshipIntent.relationshipIntent
    ),
    attachmentStyle: normalizeAttachmentStyle(communicationStyle),
    loveLanguage: normalizeLoveLanguage((communication as { loveLanguage?: unknown }).loveLanguage),
    height: undefined,
    religion: undefined,
    politics: undefined,
    drinking,
    smoking,
    kids,
    auraScore: 80,
    isVerified: true,
    lastActive: profile.updated_at || profile.created_at || new Date().toISOString(),
    distance:
      selfLocation && profile.location && selfLocation.toLowerCase() === profile.location.toLowerCase()
        ? 5
        : undefined,
  };
}

function seededRecommendation(match: (typeof MATCHES)[number]): MatchmakingCandidateScore {
  const breakdown = {
    ...match.compatibilityBreakdown,
    datingPace: match.compatibilityBreakdown.goals,
  };
  const reasons = [
    `Intent alignment and communication fit are both strong in this match (${match.compatibilityScore}%).`,
    `Lifestyle and routine compatibility score high for practical dating momentum.`,
    `Shared values and emotional alignment suggest lower ambiguity early on.`,
  ];

  return {
    userId: match.profile.id,
    compatibilityScore: match.compatibilityScore,
    rankingScore: match.compatibilityScore,
    breakdown,
    reasons,
    explanation: {
      summary: match.aiReason,
      reasons,
    },
    whySignals: ['Seeded from existing compatibility dataset'],
    confidence: 'medium',
    tierLabel: 'core',
    generatedAt: new Date().toISOString(),
  };
}

export class InMemoryMatchmakingStore implements MatchmakingStore {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const supabase = await createSupabaseServerClient();
      const [{ data: profile }, { data: preference }, { data: onboardingRows }] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'id,email,full_name,age,gender,location,bio,occupation,education,interests,core_values,onboarding_complete,profile_completeness,photos_count,updated_at,created_at'
          )
          .eq('id', userId)
          .maybeSingle<ProfileRow>(),
        supabase
          .from('match_preferences')
          .select('user_id,relationship_intent,communication_style,values,lifestyle,dealbreakers,interested_in,min_age,max_age,distance_km')
          .eq('user_id', userId)
          .maybeSingle<PreferenceRow>(),
        supabase
          .from('onboarding_responses')
          .select('user_id,category,response')
          .eq('user_id', userId)
          .in('category', ['demographics', 'relationship_intent', 'values', 'communication_style', 'lifestyle', 'profile_meta'])
          .returns<OnboardingRow[]>(),
      ]);

      if (!profile) {
        return ALL_USERS.find(u => u.id === userId) ?? null;
      }

      const responseMap = findResponseMap(onboardingRows ?? []);
      return mapProfileToUser(profile, preference ?? undefined, responseMap, profile.location ?? undefined);
    } catch {
      return ALL_USERS.find(u => u.id === userId) ?? null;
    }
  }

  async listCandidateProfiles(userId: string): Promise<UserProfile[]> {
    const supabase = await createSupabaseServerClient();

    const [{ data: selfProfile }, { data: selfPreference }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id,age,gender,location,max_distance_km,preferred_min_age,preferred_max_age')
        .eq('id', userId)
        .maybeSingle<{
          id: string;
          age?: number | null;
          gender?: string | null;
          location?: string | null;
          max_distance_km?: number | null;
          preferred_min_age?: number | null;
          preferred_max_age?: number | null;
        }>(),
      supabase
        .from('match_preferences')
        .select('user_id,min_age,max_age,distance_km,interested_in')
        .eq('user_id', userId)
        .maybeSingle<Pick<PreferenceRow, 'user_id' | 'min_age' | 'max_age' | 'distance_km' | 'interested_in'>>(),
    ]);

    const [blockRows, reportRows, shownRows] = await Promise.all([
      supabase
        .from('blocks')
        .select('blocker_user_id,blocked_user_id')
        .or(`blocker_user_id.eq.${userId},blocked_user_id.eq.${userId}`)
        .returns<Array<{ blocker_user_id: string; blocked_user_id: string }>>(),
      supabase
        .from('reports')
        .select('reporter_user_id,reported_user_id,target_user_id')
        .or(`reporter_user_id.eq.${userId},reported_user_id.eq.${userId},target_user_id.eq.${userId}`)
        .returns<Array<{ reporter_user_id: string; reported_user_id?: string; target_user_id?: string }>>(),
      supabase
        .from('matches_shown_history')
        .select('candidate_user_id,shown_at')
        .eq('user_id', userId)
        .gte('shown_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .returns<Array<{ candidate_user_id: string; shown_at: string }>>(),
    ]);

    const excludedIds = new Set<string>([userId]);
    for (const row of blockRows.data ?? []) {
      if (row.blocker_user_id === userId) excludedIds.add(row.blocked_user_id);
      if (row.blocked_user_id === userId) excludedIds.add(row.blocker_user_id);
    }
    for (const row of reportRows.data ?? []) {
      const reported = row.reported_user_id ?? row.target_user_id;
      if (row.reporter_user_id === userId && reported) excludedIds.add(reported);
      if (reported === userId) excludedIds.add(row.reporter_user_id);
    }
    for (const row of shownRows.data ?? []) {
      excludedIds.add(row.candidate_user_id);
    }

    const minAge = selfPreference?.min_age ?? selfProfile?.preferred_min_age ?? 18;
    const maxAge = selfPreference?.max_age ?? selfProfile?.preferred_max_age ?? 99;
    const maxDistanceKm = selfPreference?.distance_km ?? selfProfile?.max_distance_km ?? 100;
    const interestedIn = normalizeGenderPreferences(selfPreference?.interested_in);

    let profileQuery = supabase
      .from('profiles')
      .select(
        'id,email,full_name,age,gender,location,bio,occupation,education,interests,core_values,onboarding_complete,profile_completeness,photos_count,updated_at,created_at'
      )
      .eq('onboarding_complete', true)
      .gte('profile_completeness', 0.7)
      .gte('photos_count', 1)
      .gte('age', minAge)
      .lte('age', maxAge)
      .neq('id', userId)
      .returns<ProfileRow[]>();

    if (interestedIn.length > 0) {
      profileQuery = profileQuery.in('gender', interestedIn);
    }

    if (maxDistanceKm <= 30 && selfProfile?.location) {
      const city = selfProfile.location.split(',')[0]?.trim();
      if (city) {
        profileQuery = profileQuery.ilike('location', `${city}%`);
      }
    }

    const excluded = [...excludedIds];
    if (excluded.length > 0) {
      profileQuery = profileQuery.not('id', 'in', toInClause(excluded));
    }

    const { data: candidateRows, error: candidateError } = await profileQuery;
    if (candidateError) {
      throw candidateError;
    }

    const candidateIds = (candidateRows ?? []).map(row => row.id);
    if (candidateIds.length === 0) return [];

    const [{ data: candidatePreferences }, { data: candidateResponses }] = await Promise.all([
      supabase
        .from('match_preferences')
        .select('user_id,relationship_intent,communication_style,values,lifestyle,dealbreakers,interested_in,min_age,max_age,distance_km')
        .in('user_id', candidateIds)
        .returns<PreferenceRow[]>(),
      supabase
        .from('onboarding_responses')
        .select('user_id,category,response')
        .in('user_id', candidateIds)
        .in('category', ['demographics', 'relationship_intent', 'values', 'communication_style', 'lifestyle', 'profile_meta'])
        .returns<OnboardingRow[]>(),
    ]);

    const preferenceByUserId = new Map<string, PreferenceRow>();
    for (const pref of candidatePreferences ?? []) {
      preferenceByUserId.set(pref.user_id, pref);
    }

    const responseMap = findResponseMap(candidateResponses ?? []);
    const userGender = normalizeGender(selfProfile?.gender);
    const userAge = typeof selfProfile?.age === 'number' ? selfProfile.age : undefined;

    const reciprocalFilteredRows = (candidateRows ?? []).filter(row => {
      const pref = preferenceByUserId.get(row.id);
      if (!pref) return true;

      const candidateInterestedIn = normalizeGenderPreferences(pref.interested_in);
      if (candidateInterestedIn.length > 0 && !candidateInterestedIn.includes(userGender)) {
        return false;
      }

      if (typeof userAge === 'number') {
        const cMin = typeof pref.min_age === 'number' ? pref.min_age : 18;
        const cMax = typeof pref.max_age === 'number' ? pref.max_age : 99;
        if (userAge < cMin || userAge > cMax) {
          return false;
        }
      }

      return true;
    });

    return reciprocalFilteredRows.map(row =>
      mapProfileToUser(row, preferenceByUserId.get(row.id), responseMap, selfProfile?.location ?? undefined)
    );
  }

  async listShownHistory(userId: string, lookbackDays: number): Promise<MatchShownHistory[]> {
    try {
      const supabase = await createSupabaseServerClient();
      const cutoffIso = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('matches_shown_history')
        .select('user_id,candidate_user_id,shown_at')
        .eq('user_id', userId)
        .gte('shown_at', cutoffIso)
        .returns<Array<{ user_id: string; candidate_user_id: string; shown_at: string }>>();

      return (data ?? []).map(item => ({
        userId: item.user_id,
        candidateId: item.candidate_user_id,
        shownAt: item.shown_at,
      }));
    } catch {
      return [];
    }
  }

  async listBlocks(userId: string): Promise<string[]> {
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase
        .from('blocks')
        .select('blocker_user_id,blocked_user_id')
        .or(`blocker_user_id.eq.${userId},blocked_user_id.eq.${userId}`)
        .returns<Array<{ blocker_user_id: string; blocked_user_id: string }>>();

      const blockedByUser = (data ?? []).filter(b => b.blocker_user_id === userId).map(b => b.blocked_user_id);
      const blockedUser = (data ?? []).filter(b => b.blocked_user_id === userId).map(b => b.blocker_user_id);
      return Array.from(new Set([...blockedByUser, ...blockedUser]));
    } catch {
      return [];
    }
  }

  async listReports(userId: string): Promise<UserReport[]> {
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase
        .from('reports')
        .select('reporter_user_id,reported_user_id,target_user_id,created_at')
        .or(`reporter_user_id.eq.${userId},reported_user_id.eq.${userId},target_user_id.eq.${userId}`)
        .returns<Array<{ reporter_user_id: string; reported_user_id?: string; target_user_id?: string; created_at: string }>>();

      return (data ?? [])
        .map(report => ({
          reporterUserId: report.reporter_user_id,
          targetUserId: report.reported_user_id ?? report.target_user_id,
          createdAt: report.created_at,
        }))
        .filter((report): report is UserReport => Boolean(report.targetUserId));
    } catch {
      return [];
    }
  }

  async isQueuedForUser(userId: string, candidateId: string): Promise<boolean> {
    const state = getState();
    const candidateQueue = state.recs.get(candidateId) ?? [];
    return candidateQueue.some(entry => entry.userId === userId);
  }

  async saveShownHistory(entries: MatchShownHistory[]): Promise<void> {
    const state = getState();
    const timestamped = entries.map(item => ({
      user_id: item.userId,
      candidate_user_id: item.candidateId,
      shown_at: item.shownAt,
    }));

    try {
      const supabase = await createSupabaseServerClient();
      await supabase.from('matches_shown_history').insert(timestamped);
    } catch {
      // Non-blocking persistence fallback.
    }

    state.runs.push({
      id: `shown-${Date.now()}`,
      userId: entries[0]?.userId ?? 'unknown',
      candidateCount: entries.length,
      createdAt: new Date().toISOString(),
      durationMs: 0,
      version: 'shown-history-v1',
    });
  }

  async listPairSignals(userId: string, candidateId: string, lookbackDays: number): Promise<MatchmakingSignal[]> {
    const state = getState();
    const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
    return state.signals.filter(signal => {
      const ts = new Date(signal.createdAt).getTime();
      if (ts < cutoff) return false;
      const isForward = signal.actorUserId === userId && signal.targetUserId === candidateId;
      const isBackward = signal.actorUserId === candidateId && signal.targetUserId === userId;
      return isForward || isBackward;
    });
  }

  async getSignalsByIdempotencyKey(idempotencyKey: string): Promise<MatchmakingSignal | null> {
    const state = getState();
    return state.signals.find(signal => signal.idempotencyKey === idempotencyKey) ?? null;
  }

  async insertSignal(signal: MatchmakingSignal): Promise<void> {
    const state = getState();
    state.signals.push(signal);

    if (signal.type === 'report') {
      try {
        const supabase = await createSupabaseServerClient();
        await supabase.from('reports').insert({
          reporter_user_id: signal.actorUserId,
          reported_user_id: signal.targetUserId,
          created_at: signal.createdAt,
        });
      } catch {
        // Non-blocking fallback: signal remains in memory.
      }
    }
  }

  async saveRun(run: MatchmakingRun): Promise<void> {
    const state = getState();
    state.runs.push(run);
  }

  async saveRecommendations(userId: string, recommendations: MatchmakingCandidateScore[]): Promise<void> {
    const state = getState();
    state.recs.set(userId, recommendations);
  }

  async getRecommendations(userId: string, limit: number): Promise<MatchmakingCandidateScore[]> {
    const state = getState();
    const existing = state.recs.get(userId);
    if (existing?.length) return existing.slice(0, limit);

    const seeded = MATCHES.map(match => seededRecommendation(match));
    state.recs.set(userId, seeded);
    return seeded.slice(0, limit);
  }
}

export function getMatchmakingStore(): MatchmakingStore {
  return new InMemoryMatchmakingStore();
}
