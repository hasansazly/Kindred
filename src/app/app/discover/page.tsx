import Link from 'next/link';
import { redirect } from 'next/navigation';
import MatchCard from '@/components/matches/MatchCard';
import { getDiscoverSections, resolveViewerTier } from '@/lib/curatedMatches';
import { getMatchesForUser } from '@/lib/matches';
import { createSupabaseServerClient } from '../../../../utils/supabase/server';
import { isDatingLockedForUser } from '@/server/couples/mode';

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
      ? { label: 'NEW', bg: '#FF5864', color: 'rgb(245, 238, 248)' }
      : statusLabel === 'active'
        ? { label: 'ACTIVE', bg: '#1D9E75', color: 'rgb(245, 238, 248)' }
        : { label: '50–64%', bg: '#BA7517', color: 'rgb(245, 238, 248)' };

  return (
    <section
      className="mb-3 rounded-[16px] border p-4"
      style={{
        background: '#FFFFFF',
        borderColor: 'rgba(255, 88, 100, 0.2)',
        boxShadow: '0 8px 22px rgba(26, 10, 30, 0.05)',
      }}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <h2
          className="text-[17px] font-semibold"
          style={{ color: '#1A0A1E', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}
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

      <p className="mb-3 text-[12px] leading-[1.55]" style={{ color: '#6B4B5E' }}>{desc}</p>

      {matches.length > 0 ? (
        <div className="space-y-3">
          {matches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div
          className="rounded-[12px] border border-dashed p-4 text-center"
          style={{ borderColor: 'rgba(255, 88, 100, 0.2)', background: '#FAF8F5' }}
        >
          <div className="mb-1.5 text-[20px] opacity-60" style={{ color: '#9B7099' }}>{emptyIcon}</div>
          <p className="text-[13px] font-medium" style={{ color: '#1A0A1E' }}>{emptyMain}</p>
          <p className="mt-1 text-[11px]" style={{ color: '#6B4B5E' }}>{emptySub}</p>
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

  if (await isDatingLockedForUser(supabase, user.id)) {
    redirect('/app/couples');
  }

  const tier = resolveViewerTier((profile ?? null) as Record<string, unknown> | null);
  const sections = getDiscoverSections(matches, tier);

  return (
    <div className="app-interior-page min-h-full bg-[#FAF8F5] px-4 pt-6 pb-8 text-[#1A0A1E]">
      {/* Page meta */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] tracking-[0.1em]" style={{ color: '#9B7099', fontFamily: 'Inter, sans-serif' }}>DISCOVER</p>
          <h1
            className="text-[26px] font-bold leading-[1.1]"
            style={{ color: '#1A0A1E', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            Curated<br />Matches
          </h1>
          <p className="mt-1 text-[12px] leading-[1.55]" style={{ color: '#6B4B5E' }}>
            Focused browsing · no old history
          </p>
        </div>
        <Link
          href="/dashboard"
          className="mt-1 shrink-0 rounded-full border px-3 py-1.5 text-[12px]"
          style={{ borderColor: 'rgba(255, 88, 100, 0.35)', color: '#FF3B5C', background: '#FFF0F1' }}
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
