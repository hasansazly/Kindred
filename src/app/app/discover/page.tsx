import Link from 'next/link';
import { redirect } from 'next/navigation';
import MatchCard from '@/components/matches/MatchCard';
import { getDiscoverSections, resolveViewerTier } from '@/lib/curatedMatches';
import { getMatchesForUser } from '@/lib/matches';
import { createSupabaseServerClient } from '../../../../utils/supabase/server';
import { isDatingLockedForUser } from '@/server/couples/mode';

type WaitlistRow = {
  user_id: string;
  segment: string;
  status: 'waiting' | 'ready' | 'released';
  joined_at: string;
};

function shouldShowWaitlistMessage(waitlistEntry: WaitlistRow | null, matchesCount: number): boolean {
  if (waitlistEntry?.status === 'waiting' || waitlistEntry?.status === 'ready') return true;
  if (waitlistEntry?.status === 'released') return false;
  return matchesCount === 0;
}

type SectionProps = {
  title: string;
  desc: string;
  matches: Awaited<ReturnType<typeof getMatchesForUser>>;
  emptyMain: string;
  emptySub: string;
  emptyIcon: string;
  statusLabel: 'new' | 'active' | 'potential_fit';
};

function Section({ title, desc, matches, emptyMain, emptySub, emptyIcon, statusLabel }: SectionProps) {
  const badge =
    statusLabel === 'new'
      ? { label: 'NEW', bg: 'rgba(168, 85, 247, 0.95)', color: 'rgb(245, 238, 248)' }
      : statusLabel === 'active'
        ? { label: 'ACTIVE', bg: 'rgba(39, 185, 118, 0.92)', color: 'rgb(245, 238, 248)' }
        : { label: '50–64%', bg: 'rgba(198, 131, 30, 0.95)', color: 'rgb(245, 238, 248)' };

  return (
    <section className="mb-5">
      <div className="mb-2.5 flex items-center justify-between">
        <h2
          className="text-[34px] font-semibold leading-[1.05]"
          style={{ color: '#FFFFFF', fontFamily: 'Playfair Display, Georgia, serif', letterSpacing: '-0.02em' }}
        >
          {title}
        </h2>
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.06em]"
          style={{ background: badge.bg, color: badge.color }}
        >
          {badge.label}
        </span>
      </div>

      <p className="mb-3 text-[12px] leading-[1.55]" style={{ color: '#FFFFFF' }}>{desc}</p>

      {matches.length > 0 ? (
        <div className="space-y-4">
          {matches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div
          className="rounded-[18px] border border-dashed p-4 text-center"
          style={{ borderColor: 'rgba(255, 255, 255, 0.18)', background: '#1E1A2C' }}
        >
          <div className="mb-1.5 text-[20px] opacity-70" style={{ color: '#FFFFFF' }}>{emptyIcon}</div>
          <p className="text-[13px] font-medium" style={{ color: '#FFFFFF' }}>{emptyMain}</p>
          <p className="mt-1 text-[11px]" style={{ color: '#FFFFFF' }}>{emptySub}</p>
        </div>
      )}
    </section>
  );
}

export default async function AppDiscoverPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?next=/app/discover');
  }

  const [{ data: preferenceRow }, { data: profile }, { data: waitlistEntry }, matches] = await Promise.all([
    supabase.from('match_preferences').select('user_id').eq('user_id', user.id).maybeSingle(),
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase
      .from('matchmaking_waitlist')
      .select('user_id,segment,status,joined_at')
      .eq('user_id', user.id)
      .maybeSingle<WaitlistRow>(),
    getMatchesForUser(supabase, user.id),
  ]);

  if (!preferenceRow) {
    redirect('/onboarding');
  }

  if (await isDatingLockedForUser(supabase, user.id)) {
    redirect('/app/couples');
  }

  const tier = resolveViewerTier((profile ?? null) as Record<string, unknown> | null);
  const sections = getDiscoverSections(matches, tier);
  const showWaitlistMessage = shouldShowWaitlistMessage(waitlistEntry ?? null, matches.length);

  return (
    <div className="app-interior-page discover-screen min-h-full bg-[#12101A] px-4 pt-4 pb-8 text-[#F5EEF8]">
      {/* Page meta */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] tracking-[0.1em]" style={{ color: '#FFFFFF', fontFamily: 'DM Sans, Inter, sans-serif' }}>DISCOVER</p>
          <p className="mt-1 text-[12px] leading-[1.55]" style={{ color: '#FFFFFF' }}>
            Focused browsing with clear intent
          </p>
        </div>
        <Link
          href="/dashboard"
          className="mt-1 inline-flex min-h-9 min-w-[110px] shrink-0 items-center justify-center rounded-full border px-4 py-1.5 text-center text-[12px]"
          style={{ borderColor: 'rgba(255,255,255,0.22)', color: '#F5EEF8', background: 'rgba(255,255,255,0.04)' }}
        >
          ⚙ Dashboard
        </Link>
      </div>

      {showWaitlistMessage ? (
        <section className="mb-5 rounded-[18px] border p-4" style={{ borderColor: 'rgba(168,85,247,0.45)', background: '#1B1630' }}>
          <p className="text-[14px] font-semibold" style={{ color: '#FFFFFF' }}>Thank you, you&apos;re on the waitlist</p>
          <p className="mt-1 text-[12px] leading-[1.55]" style={{ color: 'rgba(255,255,255,0.78)' }}>
            We&apos;re preparing your curated reveal. Matches will unlock after the waitlist release window.
          </p>
        </section>
      ) : null}

      <Section
        title="New Today"
        desc="Fresh curated matches land here daily"
        matches={sections.newToday}
        emptyMain="No new matches yet today"
        emptySub="Check back soon — they refresh daily"
        emptyIcon="⏳"
        statusLabel="new"
      />

      <Section
        title="Active Matches"
        desc="Current matches worth exploring now"
        matches={sections.activeMatches}
        emptyMain="No active matches right now"
        emptySub="Your curated picks will appear here"
        emptyIcon="✦"
        statusLabel="active"
      />

      <Section
        title="Potential Fit"
        desc="Exploratory range · upgrade to unlock full view"
        matches={sections.potentialFit}
        emptyMain="No potential fits right now"
        emptySub="Available on paid plans"
        emptyIcon="✦"
        statusLabel="potential_fit"
      />
    </div>
  );
}
