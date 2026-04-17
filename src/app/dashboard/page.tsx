import Link from 'next/link';
import { CheckCircle2, User } from 'lucide-react';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/auth/LogoutButton';
import { getDashboardPreviewLimit, getDashboardTodayPreview, resolveViewerTier } from '@/lib/curatedMatches';
import { getMatchesForUser } from '@/lib/matches';
import { createSupabaseServerClient } from '../../../utils/supabase/server';

type ParticipantRow = {
  conversation_id: string;
  user_id: string;
};

type OnboardingResponseRow = {
  response: unknown;
};

function isMissingTableError(error: { code?: string; message?: string } | null | undefined, table: string) {
  if (!error) return false;
  return error.code === 'PGRST205' || error.message?.includes(`public.${table}`) || false;
}

async function getActiveConversationCount(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
) {
  const { data: myParticipants, error: myParticipantsError } = await supabase
    .from('conversation_participants')
    .select('conversation_id,user_id')
    .eq('user_id', userId)
    .returns<ParticipantRow[]>();

  if (myParticipantsError || !myParticipants?.length) return 0;

  const conversationIds = myParticipants.map(row => row.conversation_id);
  const { data: allParticipants } = await supabase
    .from('conversation_participants')
    .select('conversation_id,user_id')
    .in('conversation_id', conversationIds)
    .returns<ParticipantRow[]>();

  const otherParticipantByConversation = new Map<string, string>();
  for (const row of allParticipants ?? []) {
    if (row.user_id !== userId && !otherParticipantByConversation.has(row.conversation_id)) {
      otherParticipantByConversation.set(row.conversation_id, row.user_id);
    }
  }

  const otherIds = [...new Set([...otherParticipantByConversation.values()])];
  if (otherIds.length === 0) return 0;

  const [{ data: activeMatches }, { data: blockRows }, { data: unmatchRows }] = await Promise.all([
    supabase
      .from('matches')
      .select('matched_user_id,conversation_disabled')
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('matched_user_id', otherIds),
    supabase
      .from('blocks')
      .select('blocker_user_id,blocked_user_id')
      .or(`blocker_user_id.eq.${userId},blocked_user_id.eq.${userId}`),
    supabase
      .from('unmatches')
      .select('initiated_by_user_id,unmatched_user_id')
      .or(`initiated_by_user_id.eq.${userId},unmatched_user_id.eq.${userId}`),
  ]);

  const blocked = new Set<string>();
  for (const row of blockRows ?? []) {
    if (row.blocker_user_id === userId) blocked.add(row.blocked_user_id);
    if (row.blocked_user_id === userId) blocked.add(row.blocker_user_id);
  }

  const unmatched = new Set<string>();
  for (const row of unmatchRows ?? []) {
    if (row.initiated_by_user_id === userId) unmatched.add(row.unmatched_user_id);
    if (row.unmatched_user_id === userId) unmatched.add(row.initiated_by_user_id);
  }

  const allowed = new Set<string>();
  for (const row of activeMatches ?? []) {
    if (!row.conversation_disabled) allowed.add(row.matched_user_id);
  }

  let count = 0;
  for (const [, otherUserId] of otherParticipantByConversation.entries()) {
    if (!allowed.has(otherUserId)) continue;
    if (blocked.has(otherUserId)) continue;
    if (unmatched.has(otherUserId)) continue;
    count += 1;
  }

  return count;
}

async function getConnectionTrackSummary(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
) {
  const { data: activeTracks, error: activeTracksError } = await supabase
    .from('connection_tracks')
    .select('id')
    .eq('status', 'active')
    .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`);

  if (isMissingTableError(activeTracksError, 'connection_tracks')) {
    return { activeTracks: 0, recentUpdates: 0 };
  }

  if (activeTracksError || !activeTracks?.length) {
    return { activeTracks: 0, recentUpdates: 0 };
  }

  const trackIds = activeTracks.map(track => track.id);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count: recentUpdates, error: eventsError } = await supabase
    .from('connection_track_events')
    .select('*', { count: 'exact', head: true })
    .in('connection_track_id', trackIds)
    .eq('event_type', 'response_submitted')
    .gte('created_at', since);

  if (isMissingTableError(eventsError, 'connection_track_events')) {
    return { activeTracks: trackIds.length, recentUpdates: 0 };
  }

  return {
    activeTracks: trackIds.length,
    recentUpdates: eventsError ? 0 : recentUpdates ?? 0,
  };
}

export default async function DashboardPage() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/auth/login');
    }

    const { data: preferenceRow } = await supabase
      .from('match_preferences')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!preferenceRow) {
      redirect('/onboarding');
    }

    const [{ data: profile }, { count: rawResponsesCount, error: responsesCountError }, { data: demographicsRow }, { data: profileMetaRow }, matches] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('onboarding_responses').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase
        .from('onboarding_responses')
        .select('response')
        .eq('user_id', user.id)
        .eq('category', 'demographics')
        .maybeSingle<OnboardingResponseRow>(),
      supabase
        .from('onboarding_responses')
        .select('response')
        .eq('user_id', user.id)
        .eq('category', 'profile_meta')
        .maybeSingle<OnboardingResponseRow>(),
      getMatchesForUser(supabase, user.id),
    ]);

    const tier = resolveViewerTier((profile ?? null) as Record<string, unknown> | null);
    const todayPreview = getDashboardTodayPreview(matches, tier);
    const previewLimit = getDashboardPreviewLimit(tier);
    const [activeConversationCount, connectionTrackSummary] = await Promise.all([
      getActiveConversationCount(supabase, user.id),
      getConnectionTrackSummary(supabase, user.id),
    ]);

    const responsesTableMissing = isMissingTableError(responsesCountError, 'onboarding_responses');
    const responsesCount = responsesTableMissing ? 0 : rawResponsesCount ?? 0;
    const demographics =
      demographicsRow && typeof demographicsRow.response === 'object' && demographicsRow.response !== null
        ? (demographicsRow.response as Record<string, unknown>)
        : {};
    const profileMeta =
      profileMetaRow && typeof profileMetaRow.response === 'object' && profileMetaRow.response !== null
        ? (profileMetaRow.response as Record<string, unknown>)
        : {};
    const photos = Array.isArray(profileMeta.photos)
      ? (profileMeta.photos as unknown[]).filter(item => typeof item === 'string')
      : [];
    const profilePhoto = photos.length > 0 ? (photos[0] as string) : null;
    const profileAge =
      typeof profile?.age === 'number'
        ? profile.age
        : typeof demographics.age === 'number'
          ? demographics.age
          : null;
    const profileLocation =
      profile?.location ||
      (typeof demographics.location === 'string' ? demographics.location : '') ||
      'Location not shared yet';
    const isVerified = profile?.is_verified !== false;
    const auraScore = Math.min(99, 60 + responsesCount * 4);
    const displayName =
      profile?.first_name ||
      profile?.full_name ||
      (typeof demographics.fullName === 'string' ? demographics.fullName : '') ||
      user.email?.split('@')[0] ||
      user.email ||
      'Member';

    return (
      <main className="min-h-screen bg-[#0D0D1A] text-[#F3F5FF]">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(1100px 540px at 14% -8%, rgba(124,58,237,0.2), transparent 58%), radial-gradient(980px 520px at 92% -2%, rgba(236,72,153,0.15), transparent 55%)',
          }}
        />

        <div className="relative w-full pb-6">
          {/* Topbar */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <span className="text-[10px] font-medium tracking-[0.1em] text-white/35">DASHBOARD</span>
            <LogoutButton className="rounded-full border border-white/[0.12] px-3 py-1.5 text-[11px] text-white/40" />
          </div>

          {/* Profile hero */}
          <article
            className="mx-3 flex items-end gap-3 overflow-hidden rounded-[20px] p-4"
            style={{
              background: 'linear-gradient(135deg,#C4A8E8,#F0B8C8,#F5D5A8)',
              minHeight: '110px',
            }}
          >
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/50 bg-[#1A1A2E]">
              {profilePhoto ? (
                <img src={profilePhoto} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <User size={20} className="text-[#AEB6D1]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-[#15803D]">
                <CheckCircle2 size={10} />
                {isVerified ? 'Verified' : 'Unverified'}
              </span>
              <h1 className="truncate text-[15px] font-semibold leading-tight text-[#1A1A2E]">
                {displayName}{typeof profileAge === 'number' ? `, ${profileAge}` : ''}
              </h1>
              <p className="mt-0.5 text-[12px] text-[#1A1A2E]/65">{profileLocation}</p>
            </div>
            <div className="flex h-[52px] w-[52px] shrink-0 flex-col items-center justify-center rounded-full border-[2.5px] border-[#7F77DD] bg-white/90">
              <span className="text-[16px] font-bold leading-none text-[#3C3489]">{auraScore}</span>
              <span className="text-[7px] tracking-wide text-[#534AB7]">AURA</span>
            </div>
          </article>

          {/* Inner padded content */}
          <div className="px-3">
            {/* Today's Activity */}
            <p className="mb-2 mt-[14px] text-[10px] font-medium tracking-[0.09em] text-white/35">TODAY&apos;S ACTIVITY</p>
            <div className="grid grid-cols-3 gap-[6px]">
              <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.06] px-3 py-4">
                <p className="text-[9px] tracking-[0.05em] text-white/40">MATCHES</p>
                <p className="mt-1 text-[22px] font-bold leading-none text-white">{todayPreview.length}</p>
                <p className="mt-[3px] text-[9px] text-white/35">Up to {previewLimit} today</p>
              </div>
              <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.06] px-3 py-4">
                <p className="text-[9px] tracking-[0.05em] text-white/40">CHATS</p>
                <p className="mt-1 text-[22px] font-bold leading-none text-white">{activeConversationCount}</p>
                <p className="mt-[3px] text-[9px] text-white/35">Active threads</p>
              </div>
              <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.06] px-3 py-4">
                <p className="text-[9px] tracking-[0.05em] text-white/40">TRACKS</p>
                <p className="mt-1 text-[22px] font-bold leading-none text-white">{connectionTrackSummary.recentUpdates}</p>
                <p className="mt-[3px] text-[9px] text-white/35">Connection</p>
              </div>
            </div>

            {/* Today's matches row */}
            <div className="mb-2 mt-[14px] flex items-center justify-between">
              <span className="text-[16px] font-semibold text-white">Today&apos;s matches</span>
              <Link
                href="/app/discover"
                className="rounded-full bg-gradient-to-r from-[#D4537E] to-[#7F77DD] px-3 py-[5px] text-[11px] font-semibold text-white"
              >
                View all
              </Link>
            </div>

            {todayPreview.length > 0 ? (
              <div className="space-y-2">
                {todayPreview.map(match => {
                  const potential =
                    typeof match.compatibilityScore === 'number' &&
                    match.compatibilityScore >= 50 &&
                    match.compatibilityScore < 65;
                  return (
                    <Link
                      key={match.id}
                      href={`/matches/${match.id}`}
                      className="block rounded-[14px] border border-white/[0.08] bg-white/[0.06] p-3"
                    >
                      <p className="text-[14px] font-semibold text-white">
                        {match.matchedProfile.firstName}
                        {typeof match.matchedProfile.age === 'number' ? `, ${match.matchedProfile.age}` : ''}
                      </p>
                      <p className="mt-0.5 text-[11px] text-white/60">
                        {match.matchedProfile.location || 'Location not shared yet'}
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-[11px] text-white/75">{match.explanation || 'Compatibility summary available in Discover.'}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {potential ? (
                          <span className="rounded-full border border-[#8B6A2E]/55 bg-[#2A2112] px-2 py-0.5 text-[10px] font-medium text-[#F4C977]">
                            Potential Fit
                          </span>
                        ) : null}
                        {match.compatibilityReasons.slice(0, 2).map(reason => (
                          <span key={reason} className="rounded-full border border-[#4E5A92] bg-[#1B2550] px-2 py-0.5 text-[10px] text-[#D8E1FF]">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[14px] border border-dashed border-white/[0.12] bg-white/[0.04] p-4 text-center">
                <p className="text-[12px] text-white/35">No fresh matches yet today</p>
                <p className="mt-[3px] text-[10px] text-white/20">Check back soon</p>
              </div>
            )}

            {/* Bottom 2-col grid */}
            <div className="mt-[6px] grid grid-cols-2 gap-[6px]">
              <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.06] p-3">
                <p className="text-[9px] tracking-[0.07em] text-white/35">ONBOARDING</p>
                <p className="mt-1 text-[14px] font-semibold text-white">Complete</p>
                <p className="mt-0.5 text-[10px] text-white/40">{responsesCount} categories saved</p>
              </div>
              <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.06] p-3">
                <p className="text-[9px] tracking-[0.07em] text-white/35">YOUR AURA</p>
                <p className="mt-1 text-[14px] font-semibold text-[#A78BFA]">Score {auraScore}</p>
                <p className="mt-0.5 text-[10px] text-white/40">Top 5%</p>
              </div>
            </div>

            {/* Tip card */}
            <div className="mt-[6px] rounded-[14px] border border-[rgba(127,119,221,0.25)] bg-[rgba(127,119,221,0.12)] p-3">
              <p className="text-[9px] tracking-[0.07em] text-[rgba(167,139,250,0.8)]">MOMENTUM TIP</p>
              <div className="mt-1.5 space-y-1">
                <div className="flex items-start gap-[5px] text-[11px] leading-[1.4] text-white/75">
                  <span className="mt-1 h-[5px] w-[5px] shrink-0 rounded-full bg-[#7F77DD]" />
                  <span>Open Discover to act on today&apos;s best fits</span>
                </div>
                <div className="flex items-start gap-[5px] text-[11px] leading-[1.4] text-white/75">
                  <span className="mt-1 h-[5px] w-[5px] shrink-0 rounded-full bg-[#7F77DD]" />
                  <span>Move one active conversation forward today</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error('dashboard page failed:', error);
    redirect('/auth/login');
  }
}
