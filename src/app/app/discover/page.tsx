import Link from 'next/link';
import { redirect } from 'next/navigation';
import MatchCard from '@/components/matches/MatchCard';
import { getDiscoverSections, resolveViewerTier } from '@/lib/curatedMatches';
import { getMatchesForUser } from '@/lib/matches';
import { createSupabaseServerClient } from '../../../../utils/supabase/server';

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
      ? { label: 'NEW', bg: '#7F77DD' }
      : statusLabel === 'active'
        ? { label: 'ACTIVE', bg: '#1D9E75' }
        : { label: '50–64%', bg: '#BA7517' };

  return (
    <section
      className="mb-[10px] rounded-[16px] border border-white/[0.08] p-[14px]"
      style={{ background: 'rgba(255,255,255,0.05)' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-white">{title}</h2>
        <span
          className="rounded-full px-[9px] py-[3px] text-[9px] font-bold tracking-[0.06em] text-white"
          style={{ background: badge.bg }}
        >
          {badge.label}
        </span>
      </div>

      <p className="mb-[10px] text-[11px] leading-[1.5] text-white/45">{desc}</p>

      {matches.length > 0 ? (
        <div className="space-y-3">
          {matches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div className="rounded-[12px] border border-dashed border-white/[0.10] p-[14px] text-center">
          <div className="mb-[6px] text-[20px] opacity-40">{emptyIcon}</div>
          <p className="text-[12px] font-medium text-white/40">{emptyMain}</p>
          <p className="mt-[3px] text-[10px] text-white/[0.22]">{emptySub}</p>
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

  const [{ data: preferenceRow }, { data: profile }, matches] = await Promise.all([
    supabase.from('match_preferences').select('user_id').eq('user_id', user.id).maybeSingle(),
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    getMatchesForUser(supabase, user.id),
  ]);

  if (!preferenceRow) {
    redirect('/onboarding');
  }

  const tier = resolveViewerTier((profile ?? null) as Record<string, unknown> | null);
  const sections = getDiscoverSections(matches, tier);

  return (
    <div className="min-h-screen bg-[#0D0D1A] px-[14px] pt-4 pb-6 text-[#F3F5FF]">
      {/* Page meta */}
      <div className="mb-[14px] flex items-start justify-between">
        <div>
          <p className="mb-1 text-[9px] tracking-[0.1em] text-white/35">DISCOVER</p>
          <h1 className="text-[24px] font-bold leading-[1.1] text-white">
            Curated<br />Matches
          </h1>
          <p className="mt-1 text-[11px] leading-[1.5] text-white/45">
            Focused browsing · no old history
          </p>
        </div>
        <Link
          href="/dashboard"
          className="mt-1 shrink-0 rounded-full border border-white/[0.15] px-3 py-[5px] text-[11px] text-white/55"
        >
          ← Dashboard
        </Link>
      </div>

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
