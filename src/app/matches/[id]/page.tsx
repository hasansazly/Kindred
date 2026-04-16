import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../../../../utils/supabase/server';
import { findMatchById, getMatchesForUser } from '@/lib/matches';

type MatchDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/matches/${id}`);
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
  const match = findMatchById(matches, id);
  if (!match) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <Link href="/matches" className="inline-flex text-sm text-violet-300 hover:text-violet-200">
          ← Back to matches
        </Link>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-wrap items-start gap-4">
            <img
              src={match.matchedProfile.photoUrl}
              alt={match.matchedProfile.firstName}
              className="h-20 w-20 rounded-full object-cover ring-2 ring-violet-500/30"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                {match.matchedProfile.firstName}
                {typeof match.matchedProfile.age === 'number' ? `, ${match.matchedProfile.age}` : ''}
              </h1>
              <p className="mt-1 text-sm text-slate-400">{match.matchedProfile.location || 'Location not shared yet'}</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {match.matchedProfile.bio || 'No bio shared yet.'}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-medium">Why this match fits</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {match.explanation || 'This match was manually curated based on profile fit and onboarding alignment.'}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-medium">Compatibility reasons</h2>
          {match.compatibilityReasons.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-violet-200">
              {match.compatibilityReasons.map(reason => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No compatibility reasons were added yet.</p>
          )}
        </section>

        <section>
          <Link
            href="/app/messages"
            className="inline-flex items-center rounded-lg border border-violet-500/40 bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-200 hover:bg-violet-500/25"
          >
            Message
          </Link>
        </section>
      </div>
    </main>
  );
}
