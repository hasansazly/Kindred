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

    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <header className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-violet-300">Dashboard</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                Welcome back, {profile?.first_name || profile?.full_name || user.email}
              </h1>
            </div>
            <LogoutButton className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800" />
          </header>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="text-lg font-medium">Profile Completion</h2>
              <p className="mt-2 text-sm text-slate-400">
                Onboarding status: <span className="text-emerald-400">Complete</span>
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Response categories saved: <span className="text-slate-200">{responsesCount ?? 0}</span>
              </p>
              <Link href="/app/profile" className="mt-4 inline-block text-sm text-violet-300 hover:text-violet-200">
                Go to profile →
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="text-lg font-medium">Daily Matches</h2>
              <p className="mt-2 text-sm text-slate-400">Active matches: {matches.length}</p>
              {matches.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {matches.slice(0, 2).map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                  <Link href="/matches" className="inline-block text-sm text-violet-300 hover:text-violet-200">
                    View all matches →
                  </Link>
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-500">
                  No real matches yet. Add manual rows in `matches`.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    );
  } catch (error) {
    console.error('dashboard page failed:', error);
    redirect('/auth/login');
  }
}
