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
      <main className="min-h-screen bg-[#FAFAF9] px-4 py-8 text-[#111111] sm:py-10">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 opacity-100"
          style={{
            background: 'transparent',
          }}
        />

        <div className="relative mx-auto w-full max-w-6xl space-y-6">
          <header className="rounded-2xl border border-[#E5E3DF] bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#4B3FA0]">Dashboard</p>
                <h1 className="mt-2 text-3xl font-medium tracking-tight text-[#111111] sm:text-4xl">Welcome back, {displayName}</h1>
                <p className="mt-2 text-sm text-[#777777]">
                  {matches.length > 0
                    ? `${matches.length} active match${matches.length > 1 ? 'es' : ''} ready with compatibility insights.`
                    : 'Your dashboard is ready. New matches will appear here as soon as they are available.'}
                </p>
              </div>
              <LogoutButton className="rounded-lg border border-[#DDD9D1] bg-transparent px-4 py-2.5 text-sm text-[#555555] hover:bg-[#F7F6F4]" />
            </div>
          </header>

          <section className="grid gap-4 xl:grid-cols-[1fr,1.1fr]">
            <div className="space-y-4">
              <article className="rounded-2xl border border-[#E5E3DF] bg-white p-6">
                <h2 className="text-[22px] font-medium text-[#111111]">Profile Completion</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#E5E3DF] bg-white p-3.5">
                    <p className="text-[11px] uppercase tracking-[0.06em] text-[#888888]">Onboarding status</p>
                    <p className="mt-1 text-base font-medium text-[#111111]">Complete</p>
                  </div>
                  <div className="rounded-xl border border-[#E5E3DF] bg-white p-3.5">
                    <p className="text-[11px] uppercase tracking-[0.06em] text-[#888888]">Saved categories</p>
                    <p className="mt-1 text-base font-medium text-[#111111]">{responsesCount ?? 0}</p>
                  </div>
                </div>
                <Link
                  href="/app/profile"
                  className="mt-5 inline-flex items-center justify-center rounded-lg border border-[#4B3FA0] bg-transparent px-4 py-2.5 text-sm font-medium text-[#4B3FA0] hover:bg-[#F4F3FF]"
                >
                  Go to profile →
                </Link>
              </article>

              <article className="rounded-2xl border border-[#E5E3DF] bg-white p-6">
                <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-[#888888]">Today at a glance</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#E5E3DF] bg-white p-3.5">
                    <p className="text-[11px] uppercase tracking-[0.06em] text-[#888888]">Best matches</p>
                    <p className="mt-1 text-2xl font-medium text-[#111111]">{matches.length}</p>
                  </div>
                  <div className="rounded-xl border border-[#E5E3DF] bg-white p-3.5">
                    <p className="text-[11px] uppercase tracking-[0.06em] text-[#888888]">Profile quality</p>
                    <p className="mt-1 text-2xl font-medium text-[#111111]">Strong</p>
                  </div>
                </div>
              </article>
            </div>

            <article className="rounded-2xl border border-[#E5E3DF] bg-white p-5">
              <div className="mb-4">
                <h2 className="text-[28px] font-medium tracking-tight text-[#111111]">Your Best Matches</h2>
                <p className="mt-1 text-sm text-[#777777]">
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
                    className="inline-flex w-full items-center justify-center rounded-lg border border-[#4B3FA0] bg-transparent px-4 py-2.5 text-sm font-medium text-[#4B3FA0] hover:bg-[#F4F3FF]"
                  >
                    View all matches →
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#DAD6CE] bg-[#FCFBF9] px-4 py-8 text-center text-sm text-[#777777]">
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
