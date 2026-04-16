import Link from 'next/link';
import type { MatchView } from '@/lib/matches';

function truncate(text: string, max = 140) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export default function MatchCard({ match }: { match: MatchView }) {
  const reasons = match.compatibilityReasons.slice(0, 3);

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex gap-4">
        <img
          src={match.matchedProfile.photoUrl}
          alt={match.matchedProfile.firstName}
          className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-violet-500/30"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold tracking-tight text-slate-100">
            {match.matchedProfile.firstName}
            {typeof match.matchedProfile.age === 'number' ? `, ${match.matchedProfile.age}` : ''}
          </h3>
          <p className="mt-0.5 text-sm text-slate-400">{match.matchedProfile.location || 'Location not shared yet'}</p>
          <p className="mt-2 text-sm text-slate-300">{truncate(match.matchedProfile.bio || 'No bio shared yet.', 120)}</p>
        </div>
      </div>

      {reasons.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm text-violet-200">
          {reasons.map(reason => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <Link
          href={`/matches/${match.id}`}
          className="inline-flex items-center rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-200 hover:bg-violet-500/20"
        >
          View match
        </Link>
      </div>
    </article>
  );
}
