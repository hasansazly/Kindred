import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ImageIcon, Lock, MapPin, ShieldCheck, Sparkles, User } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../../../../utils/supabase/server';
import { findMatchById, getMatchesForUser } from '@/lib/matches';
import StartConversationButton from '@/components/messages/StartConversationButton';
import ConnectionSafetyActions from '@/components/safety/ConnectionSafetyActions';
import TrustSignals from '@/components/matches/TrustSignals';
import PreDateBriefingCard from '@/components/matches/PreDateBriefingCard';
import { isDatingLockedForUser } from '@/server/couples/mode';

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

  if (await isDatingLockedForUser(supabase, user.id)) {
    redirect('/app/couples');
  }

  const matches = await getMatchesForUser(supabase, user.id);
  const match = findMatchById(matches, id);
  if (!match) {
    notFound();
  }
  const createdAtLabel = new Date(match.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const trustSignals = [
    match.matchedProfile.profileCompleteness !== null
      ? `Profile completeness ${Math.round(match.matchedProfile.profileCompleteness * 100)}%`
      : 'Profile completeness still updating',
    match.matchedProfile.isVerified ? 'Verified profile' : 'Verification pending',
    `Intent: ${match.matchedProfile.relationshipIntent}`,
    match.canViewPhotos
      ? match.matchedProfile.photos.length > 0
        ? `${match.matchedProfile.photos.length} profile photo${match.matchedProfile.photos.length > 1 ? 's' : ''}`
        : 'Profile ready for photos'
      : 'Photos unlock after mutual match',
    match.compatibilityReasons.length >= 3 ? 'Strong compatibility coverage' : 'Early compatibility snapshot',
    `Matched on ${createdAtLabel}`,
  ];
  const potentialFit =
    typeof match.compatibilityScore === 'number' &&
    match.compatibilityScore >= 50 &&
    match.compatibilityScore < 65;

  return (
    <main className="app-interior-page mobile-premium-screen match-detail-screen min-h-screen bg-slate-950 px-4 pb-28 pt-6 text-slate-100 sm:pb-10">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(1200px 700px at -10% -10%, rgba(168,85,247,0.18), transparent 55%), radial-gradient(1100px 700px at 110% 0%, rgba(236,72,153,0.14), transparent 55%), radial-gradient(900px 500px at 50% 120%, rgba(59,130,246,0.14), transparent 60%)',
        }}
      />

      <div className="app-page-shell relative max-w-5xl space-y-6 pb-24 sm:pb-8">
        <Link
          href="/matches"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-sm text-slate-300 backdrop-blur hover:border-violet-400/40 hover:text-violet-200"
        >
          <ArrowLeft size={14} />
          Back to matches
        </Link>

        <section className="overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900/70 shadow-[0_36px_120px_rgba(2,6,23,0.55)] backdrop-blur">
          <div className="relative h-64 sm:h-80">
            {match.canViewPhotos && match.matchedProfile.photoUrl ? (
              <img
                src={match.matchedProfile.photoUrl}
                alt={match.matchedProfile.firstName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
                <div className="rounded-full border border-slate-600/50 bg-slate-800/60 p-6 backdrop-blur">
                  <User size={52} className="text-slate-400" />
                </div>
                {!match.canViewPhotos ? (
                  <div className="absolute inset-x-0 bottom-20 mx-auto w-fit rounded-full border border-violet-300/35 bg-slate-900/75 px-3 py-1.5 text-xs text-violet-100 backdrop-blur">
                    Photos unlock after mutual match
                  </div>
                ) : null}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
            <div className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-slate-900/65 px-3 py-1.5 text-xs font-medium text-violet-200 backdrop-blur">
              <Sparkles size={12} />
              Premium match
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {match.matchedProfile.firstName}
                {typeof match.matchedProfile.age === 'number' ? `, ${match.matchedProfile.age}` : ''}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-200/90">
                <MapPin size={13} />
                {match.matchedProfile.location || 'Location not shared yet'}
              </p>
            </div>
          </div>
          <div className="border-t border-slate-800/80 bg-slate-950/55 p-6">
            <p className="text-sm leading-6 text-slate-300">
              {match.matchedProfile.bio || 'No bio shared yet.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {trustSignals.map(signal => (
                <span
                  key={signal}
                  className="rounded-full border border-slate-700/80 bg-slate-800/75 px-3 py-1.5 text-xs text-slate-300"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-700/80 bg-slate-900/65 p-6 backdrop-blur">
          <h2 className="flex items-center gap-2 text-lg font-medium">
            <ImageIcon size={17} className="text-slate-300" />
            Photos
          </h2>
          {match.canViewPhotos ? (
            match.matchedProfile.photos.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {match.matchedProfile.photos.map(photo => (
                  <div
                    key={photo}
                    className="group aspect-square overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-950"
                  >
                    <img src={photo} alt={match.matchedProfile.firstName} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">No photos uploaded yet.</p>
            )
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-600/80 bg-slate-900/60 p-5 text-center">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-200">
                <Lock size={14} className="text-violet-300" />
                {match.photosLockedReason || 'Photos unlock after mutual match'}
              </p>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/8 to-slate-900/65 p-6">
          <h2 className="text-lg font-medium text-violet-100">Why this match fits</h2>
          <p className="mt-2 text-sm leading-6 text-slate-200/95">
            {match.explanation || 'This match was manually curated based on profile fit and onboarding alignment.'}
          </p>
        </section>

        <section className="rounded-3xl border border-slate-700/80 bg-slate-900/65 p-6 backdrop-blur">
          <h2 className="text-lg font-medium">Compatibility reasons</h2>
          {match.compatibilityReasons.length > 0 ? (
            <ul className="mt-4 grid gap-2.5">
              {match.compatibilityReasons.map(reason => (
                <li
                  key={reason}
                  className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200"
                >
                  <CheckCircle2 size={14} className="shrink-0 text-violet-300" />
                  {reason}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No compatibility reasons were added yet.</p>
          )}
        </section>

        <TrustSignals signals={trustSignals} potentialFit={potentialFit} />

        <PreDateBriefingCard
          matchId={match.id}
          isMutualMatch={match.isMutualMatch}
        />


        <section className="rounded-3xl border border-slate-700/80 bg-slate-900/65 p-6 backdrop-blur">
          <h2 className="flex items-center gap-2 text-lg font-medium">
            <ShieldCheck size={17} className="text-rose-300" />
            Safety actions
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            You stay in control. Report keeps a record; block and unmatch close this connection.
          </p>
          <div className="mt-4">
            <ConnectionSafetyActions targetUserId={match.matchedUserId} />
          </div>
        </section>

        <section className="app-bottom-sheet sm:static sm:border-none sm:bg-transparent sm:px-0 sm:py-0">
          <StartConversationButton
            matchUserId={match.matchedUserId}
            disabled={match.conversationDisabled}
            disabledReason={match.conversationDisabledReason}
          />
        </section>
      </div>
    </main>
  );
}
