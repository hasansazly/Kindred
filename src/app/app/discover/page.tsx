import Link from 'next/link';
import { redirect } from 'next/navigation';
import MatchCard from '@/components/matches/MatchCard';
import { getDiscoverSections, resolveViewerTier } from '@/lib/curatedMatches';
import { getMatchesForUser } from '@/lib/matches';
import { createSupabaseServerClient } from '../../../../utils/supabase/server';

type SectionProps = {
  title: string;
  subtitle: string;
  matches: Awaited<ReturnType<typeof getMatchesForUser>>;
  emptyText: string;
  statusLabel: 'new' | 'active' | 'potential_fit';
};

function Section({ title, subtitle, matches, emptyText, statusLabel }: SectionProps) {
  const badgeStyles =
    statusLabel === 'new'
      ? { background: '#7F77DD', border: '#7F77DD', text: '#FFFFFF' }
      : statusLabel === 'active'
        ? { background: '#1D9E75', border: '#1D9E75', text: '#FFFFFF' }
        : { background: '#3B2E12', border: '#8B6A2E', text: '#F4C977' };

  return (
    <section className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-5 shadow-[0_24px_80px_rgba(5,10,30,0.6)] backdrop-blur">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#F8F9FF]">{title}</h2>
          <p className="mt-1 text-sm text-[#A9B0D0]">{subtitle}</p>
        </div>
        <span
          className="rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.05em]"
          style={{
            background: badgeStyles.background,
            borderColor: badgeStyles.border,
            color: badgeStyles.text,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {matches.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {matches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#3A4270] bg-[#0E1430] p-6 text-sm text-[#A9B0D0]">
          {emptyText}
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
              <p className="section-label">Discover</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#F8F9FF] sm:text-5xl">Curated Matches</h1>
              <p className="body-on-dark mt-2 text-sm text-white/70 sm:text-base">
                Focused browsing for relevant matches now. No endless inventory, no old history.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-xl border border-[#3A4270] bg-[#101735] px-4 py-2.5 text-sm font-medium text-[#D4D9F4] transition hover:border-[#6B5CE7] hover:text-[#FFFFFF]"
            >
              Back to dashboard
            </Link>
          </div>
        </header>

        <Section
          title="New Today"
          subtitle={`${sections.newToday.length} fresh curated match${sections.newToday.length === 1 ? '' : 'es'} available now.`}
          matches={sections.newToday}
          emptyText="No new curated matches have landed yet today."
          statusLabel="new"
        />

        <Section
          title="Active Matches"
          subtitle={`${sections.activeMatches.length} current match${sections.activeMatches.length === 1 ? '' : 'es'} worth exploring.`}
          matches={sections.activeMatches}
          emptyText="No active curated matches right now."
          statusLabel="active"
        />

        <Section
          title="Potential Fit"
          subtitle="Exploratory compatibility range (50-64)."
          matches={sections.potentialFit}
          emptyText="No potential-fit explorations right now."
          statusLabel="potential_fit"
        />
      </div>
    </main>
  );
}
