import Link from 'next/link';
import { redirect } from 'next/navigation';
import MatchCard from '@/components/matches/MatchCard';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import { getMatchesForUser } from '@/lib/matches';
import { createSupabaseServerClient } from '../../../utils/supabase/server';
import { isDatingLockedForUser } from '@/server/couples/mode';

export default async function MatchesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?next=/matches');
  }

  const { data: preferenceRow } = await supabase
    .from('match_preferences')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!preferenceRow) {
    redirect('/onboarding');
  }

  if (await isDatingLockedForUser(supabase, user.id)) {
    redirect('/app/couples');
  }

  const matches = await getMatchesForUser(supabase, user.id);

  return (
    <main className="app-interior-page mobile-premium-screen matches-screen min-h-screen bg-[#060814] px-4 py-8 pb-24 text-[#F3F5FF]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(1100px 540px at 14% -8%, rgba(124,58,237,0.25), transparent 58%), radial-gradient(980px 520px at 92% -2%, rgba(236,72,153,0.2), transparent 55%), radial-gradient(820px 460px at 50% 110%, rgba(59,130,246,0.17), transparent 60%)',
        }}
      />

      <div className="app-page-shell with-mobile-nav relative max-w-6xl">
        <header className="mb-6 flex items-center justify-between rounded-[26px] border border-[#2A3158] bg-[#0B1024]/90 p-6 shadow-[0_24px_80px_rgba(5,10,30,0.6)] backdrop-blur">
          <div>
            <p className="section-label">Matches</p>
            <h1 className="mt-1 text-[40px] font-semibold tracking-tight text-[#F8F9FF]">Your Real Matches</h1>
            <p className="body-on-dark mt-1 text-[18px] text-white/70">
              {matches.length > 0
                ? `${matches.length} active matches ready to explore`
                : 'No active matches yet. Add manually from Supabase for now.'}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/30 bg-transparent px-4 py-2 text-sm font-medium text-white transition hover:border-white/60"
          >
            Back to dashboard
          </Link>
        </header>

        {matches.length > 0 ? (
          <section className="matches-grid grid gap-5 md:grid-cols-2">
            {matches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-[#3A4270] bg-[#0B1024]/70 p-8 text-center">
            <p className="text-[#A9B0D0]">When you add rows to `matches`, they will appear here with reasons.</p>
          </section>
        )}
      </div>
      <MobileBottomNav />
    </main>
  );
}
