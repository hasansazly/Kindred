import Link from 'next/link';
import { MessageCircle, Sparkles } from 'lucide-react';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/auth/LogoutButton';
import { getDashboardPreviewLimit, getDashboardTodayPreview, resolveViewerTier } from '@/lib/curatedMatches';
import { getMatchesForUser } from '@/lib/matches';
import { createSupabaseServerClient } from '../../../utils/supabase/server';

type ParticipantRow = {
  conversation_id: string;
  user_id: string;
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

    const [{ data: profile }, { count: rawResponsesCount, error: responsesCountError }, matches] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('onboarding_responses').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
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
    const displayName =
      profile?.first_name ||
      profile?.full_name ||
      user.email?.split('@')[0] ||
      user.email ||
      'Member';

    return (
      <main className="app-interior-page min-h-screen bg-[#060814] px-4 py-8 text-[#F3F5FF] sm:py-10">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(1100px 540px at 14% -8%, rgba(124,58,237,0.25), transparent 58%), radial-gradient(980px 520px at 92% -2%, rgba(236,72,153,0.2), transparent 55%), radial-gradient(820px 460px at 50% 110%, rgba(59,130,246,0.17), transparent 60%)',
          }}
        />

        <div className="relative mx-auto w-full max-w-6xl space-y-6">
          <header className="rounded-[26px] border border-[#2A3158] bg-[#0B1024]/90 p-6 shadow-[0_24px_80px_rgba(5,10,30,0.6)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-label">Dashboard</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#F8F9FF] sm:text-5xl">
                  Welcome back, {displayName}
                </h1>
                <p className="body-on-dark mt-2 text-sm text-[#A9B0D0] sm:text-base">
                  Summary only: today&apos;s curated matches, active conversations, and connection momentum.
                </p>
              </div>
              <LogoutButton className="rounded-xl border border-[#3A4270] bg-[#101735] px-4 py-2.5 text-sm font-medium text-[#D4D9F4] transition hover:border-[#6B5CE7] hover:text-[#FFFFFF]" />
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            <article className="stat-card rounded-2xl border border-white/10 bg-[#1E1E35] p-5 shadow-[0_20px_64px_rgba(5,10,30,0.55)] backdrop-blur">
              <p className="section-label stat-label">Today&apos;s matches</p>
              <p className="stat-value mt-2 text-3xl font-semibold text-[#F8F9FF]">{todayPreview.length}</p>
              <p className="stat-desc mt-1 text-xs text-white/75">Showing today&apos;s curated preview (up to 6).</p>
            </article>

            <article className="stat-card rounded-2xl border border-white/10 bg-[#1E1E35] p-5 shadow-[0_20px_64px_rgba(5,10,30,0.55)] backdrop-blur">
              <p className="section-label stat-label">Active conversations</p>
              <p className="stat-value mt-2 text-3xl font-semibold text-[#F8F9FF]">{activeConversationCount}</p>
              <p className="stat-desc mt-1 text-xs text-white/75">Only currently active and messageable threads.</p>
            </article>

            <article className="stat-card rounded-2xl border border-white/10 bg-[#1E1E35] p-5 shadow-[0_20px_64px_rgba(5,10,30,0.55)] backdrop-blur">
              <p className="section-label stat-label">Connection Track updates</p>
              <p className="stat-value mt-2 text-3xl font-semibold text-[#F8F9FF]">{connectionTrackSummary.recentUpdates}</p>
              <p className="stat-desc mt-1 text-xs text-white/75">
                {connectionTrackSummary.activeTracks} active track{connectionTrackSummary.activeTracks === 1 ? '' : 's'}.
              </p>
            </article>
          </section>

          <section className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-5 shadow-[0_24px_80px_rgba(5,10,30,0.6)] backdrop-blur">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-[#F8F9FF]">Today&apos;s matches</h2>
                <p className="body-on-dark mt-1 text-sm text-[#A9B0D0]">
                  Showing {todayPreview.length} of up to {previewLimit} curated match{previewLimit === 1 ? '' : 'es'}.
                </p>
              </div>
              <Link
                href="/app/discover"
                className="inline-flex items-center justify-center rounded-xl border border-[#7E62F2]/60 bg-gradient-to-r from-[#4D5FE6] via-[#7E46DB] to-[#D02E8B] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                View all matches
              </Link>
            </div>

            {todayPreview.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {todayPreview.map(match => {
                  const potential =
                    typeof match.compatibilityScore === 'number' &&
                    match.compatibilityScore >= 50 &&
                    match.compatibilityScore < 65;
                  return (
                    <Link
                      key={match.id}
                      href={`/matches/${match.id}`}
                      className="rounded-xl border border-[#343E69] bg-[#151C3C] p-4 transition hover:border-[#6B5CE7]"
                    >
                      <p className="text-lg font-semibold text-[#F8F9FF]">
                        {match.matchedProfile.firstName}
                        {typeof match.matchedProfile.age === 'number' ? `, ${match.matchedProfile.age}` : ''}
                      </p>
                      <p className="mt-1 text-sm text-[#A9B0D0]">
                        {match.matchedProfile.location || 'Location not shared yet'}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-[#CBD3F5]">{match.explanation || 'Compatibility summary available in Discover.'}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {potential ? (
                          <span className="rounded-full border border-[#8B6A2E]/55 bg-[#2A2112] px-2.5 py-1 text-[11px] font-medium text-[#F4C977]">
                            Potential Fit
                          </span>
                        ) : null}
                        {match.compatibilityReasons.slice(0, 2).map(reason => (
                          <span
                            key={reason}
                            className="rounded-full border border-[#4E5A92] bg-[#1B2550] px-2.5 py-1 text-[11px] text-[#D8E1FF]"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#3A4270] bg-[#0E1430] p-6 text-center text-sm text-[#A9B0D0]">
                No fresh curated matches for today yet.
              </div>
            )}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/88 p-5 shadow-[0_20px_64px_rgba(5,10,30,0.55)] backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.07em] text-[#99A4D4]">Onboarding status</p>
              <p className="mt-2 text-base font-medium text-[#F8F9FF]">Complete</p>
              <p className="mt-1 text-sm text-[#A9B0D0]">{responsesCount} saved categories</p>
            </article>

            <article className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/88 p-5 shadow-[0_20px_64px_rgba(5,10,30,0.55)] backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.07em] text-[#99A4D4]">Momentum tip</p>
              <p className="mt-2 flex items-center gap-2 text-base font-medium text-[#F8F9FF]">
                <Sparkles size={16} className="text-[#C9C0FF]" />
                Open Discover to act on today&apos;s best fits.
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm text-[#A9B0D0]">
                <MessageCircle size={14} />
                Move one active conversation forward today.
              </p>
            </article>
          </section>
        </div>
      </main>
    );
  } catch (error) {
    console.error('dashboard page failed:', error);
    redirect('/auth/login');
  }
}
