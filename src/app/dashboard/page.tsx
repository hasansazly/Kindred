import Link from 'next/link';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/auth/LogoutButton';
import MatchCard from '@/components/matches/MatchCard';
import { getMatchesForUser } from '@/lib/matches';
import { createSupabaseServerClient } from '../../../utils/supabase/server';

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const { count: rawResponsesCount, error: responsesCountError } = await supabase
      .from('onboarding_responses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    const responsesTableMissing =
      responsesCountError?.code === 'PGRST205' ||
      responsesCountError?.message?.includes("public.onboarding_responses");
    const responsesCount = responsesTableMissing ? 0 : rawResponsesCount;
    const matches = await getMatchesForUser(supabase, user.id);
    const displayName =
      profile?.first_name ||
      profile?.full_name ||
      user.email?.split('@')[0] ||
      user.email ||
      'Member';

    return (
      <main className="min-h-screen bg-[#060814] px-4 py-8 text-[#F3F5FF] sm:py-10">
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
                <p className="text-xs uppercase tracking-[0.14em] text-[#A18BFF]">Dashboard</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#F8F9FF] sm:text-5xl">Welcome back, {displayName}</h1>
                <p className="mt-2 text-sm text-[#A9B0D0] sm:text-base">
                  {matches.length > 0
                    ? `${matches.length} active match${matches.length > 1 ? 'es' : ''} ready with compatibility insights.`
                    : 'Your dashboard is ready. New matches will appear here as soon as they are available.'}
                </p>
              </div>
              <LogoutButton className="rounded-xl border border-[#3A4270] bg-[#101735] px-4 py-2.5 text-sm font-medium text-[#D4D9F4] transition hover:border-[#6B5CE7] hover:text-[#FFFFFF]" />
            </div>
          </header>

          <section className="grid gap-4 xl:grid-cols-[1fr,1.1fr]">
            <div className="space-y-4">
              <article className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/88 p-6 shadow-[0_20px_64px_rgba(5,10,30,0.55)] backdrop-blur">
                <h2 className="text-[34px] font-semibold leading-none text-[#F7F8FF]">Profile Completion</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#343E69] bg-[#151C3C] p-3.5">
                    <p className="text-[11px] uppercase tracking-[0.07em] text-[#99A4D4]">Onboarding status</p>
                    <p className="mt-1 text-base font-medium text-[#F8F9FF]">Complete</p>
                  </div>
                  <div className="rounded-xl border border-[#343E69] bg-[#151C3C] p-3.5">
                    <p className="text-[11px] uppercase tracking-[0.07em] text-[#99A4D4]">Saved categories</p>
                    <p className="mt-1 text-base font-medium text-[#F8F9FF]">{responsesCount ?? 0}</p>
                  </div>
                </div>
                <Link
                  href="/app/profile"
                  className="mt-5 inline-flex items-center justify-center rounded-xl border border-[#7E62F2]/60 bg-gradient-to-r from-[#4D5FE6] via-[#7E46DB] to-[#D02E8B] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Go to profile →
                </Link>
              </article>

              <article className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/88 p-6 shadow-[0_20px_64px_rgba(5,10,30,0.55)] backdrop-blur">
                <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-[#A18BFF]">Today at a glance</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#343E69] bg-[#151C3C] p-3.5">
                    <p className="text-[11px] uppercase tracking-[0.07em] text-[#99A4D4]">Best matches</p>
                    <p className="mt-1 text-2xl font-medium text-[#F8F9FF]">{matches.length}</p>
                  </div>
                  <div className="rounded-xl border border-[#343E69] bg-[#151C3C] p-3.5">
                    <p className="text-[11px] uppercase tracking-[0.07em] text-[#99A4D4]">Profile quality</p>
                    <p className="mt-1 text-2xl font-medium text-[#F8F9FF]">Strong</p>
                  </div>
                </div>
              </article>
            </div>

            <article className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-5 shadow-[0_24px_80px_rgba(5,10,30,0.6)] backdrop-blur">
              <div className="mb-4">
                <h2 className="text-[34px] font-semibold tracking-tight text-[#F8F9FF]">Your Best Matches</h2>
                <p className="mt-1 text-sm text-[#A9B0D0]">
                  {matches.length > 0
                    ? `${matches.length} active match${matches.length > 1 ? 'es' : ''} with compatibility insight`
                    : 'No active matches yet.'}
                </p>
              </div>

              {matches.length > 0 ? (
                <div className="space-y-4">
                  {matches.slice(0, 1).map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                  <Link
                    href="/matches"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-[#4B57A0] bg-[#151C3C] px-4 py-2.5 text-sm font-medium text-[#D5DBF6] transition hover:border-[#6E60EB] hover:text-[#FFFFFF]"
                  >
                    View all matches →
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#3A4270] bg-[#0E1430] px-4 py-8 text-center text-sm text-[#A9B0D0]">
                  No real matches yet. Add manual rows in `matches`.
                </div>
              )}
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
