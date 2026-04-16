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
    <main className="min-h-screen bg-[#FAFAF9] px-4 py-10 text-[#111111]">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-[#E5E3DF] bg-white p-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.06em] text-[#4B3FA0]">Matches</p>
            <h1 className="mt-1 text-[28px] font-medium tracking-tight text-[#111111]">Your Real Matches</h1>
            <p className="mt-1 text-sm text-[#777777]">
              {matches.length > 0
                ? `${matches.length} active matches ready to explore`
                : 'No active matches yet. Add manually from Supabase for now.'}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-md border border-[#DDDDDD] px-4 py-2 text-sm text-[#555555] hover:bg-[#F7F6F4]"
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
          <section className="rounded-2xl border border-dashed border-[#DAD6CE] bg-[#FCFBF9] p-8 text-center">
            <p className="text-[#777777]">When you add rows to `matches`, they will appear here with reasons.</p>
          </section>
        )}
      </div>
    </main>
  );
}
