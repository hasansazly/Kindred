import Link from 'next/link';
import { redirect } from 'next/navigation';
import MatchCard from '@/components/matches/MatchCard';
import { getMatchesForUser } from '@/lib/matches';
import { createSupabaseServerClient } from '../../../utils/supabase/server';

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

  const matches = await getMatchesForUser(supabase, user.id);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-violet-300">Matches</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Your Real Matches</h1>
            <p className="mt-1 text-sm text-slate-400">
              {matches.length > 0
                ? `${matches.length} active matches ready to explore`
                : 'No active matches yet. Add manually from Supabase for now.'}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Back to dashboard
          </Link>
        </header>

        {matches.length > 0 ? (
          <section className="grid gap-4 md:grid-cols-2">
            {matches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center">
            <p className="text-slate-400">When you add rows to `matches`, they will appear here with reasons.</p>
          </section>
        )}
      </div>
    </main>
  );
}
