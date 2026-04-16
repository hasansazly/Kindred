import Link from 'next/link';
import { User } from 'lucide-react';
import type { MatchView } from '@/lib/matches';

function truncate(text: string, max = 140) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export default function MatchCard({ match }: { match: MatchView }) {
  const reasons = match.compatibilityReasons.slice(0, 3);
  const summary = truncate(match.explanation || 'Strong intent and value alignment with clear relationship potential.', 108);
  const potentialFit =
    typeof match.compatibilityScore === 'number' && match.compatibilityScore >= 50 && match.compatibilityScore < 65;

  return (
    <article className="overflow-hidden rounded-[14px] border border-[#E5E3DF] bg-white">
      <div className="relative h-52">
        {match.matchedProfile.photoUrl ? (
          <img
            src={match.matchedProfile.photoUrl}
            alt={match.matchedProfile.firstName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#F0EEE8]">
            <User size={42} className="text-[#9A968F]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="inline-flex items-center rounded-[4px] border border-[#DDD8FA] bg-[#EDE9FA] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-[#5B4FCF]">
            {match.matchedProfile.photos.length > 0
              ? `${match.matchedProfile.photos.length} photo${match.matchedProfile.photos.length > 1 ? 's' : ''}`
              : 'Profile pending photos'}
          </div>
          <h3 className="mt-2 text-[20px] font-medium tracking-tight text-[#111111]">
            {match.matchedProfile.firstName}
            {typeof match.matchedProfile.age === 'number' ? `, ${match.matchedProfile.age}` : ''}
          </h3>
          <p className="text-[13px] text-[#777777]">{match.matchedProfile.location || 'Location not shared yet'}</p>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm leading-6 text-[#555555]">{truncate(match.matchedProfile.bio || 'No bio shared yet.', 120)}</p>

        <div className="mt-4 rounded-xl border border-[#E5E3DF] bg-[#FCFBF9] p-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#888888]">Why this match fits</p>
          <p className="mt-1.5 text-sm font-normal text-[#333333]">{summary}</p>
        </div>

        {reasons.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {reasons.map(reason => (
              <li
                key={reason}
                className="inline-flex items-center rounded-[20px] border border-[#DDD8FA] bg-[#EDE9FA] px-3 py-1 text-[12px] text-[#4B3FA0]"
              >
                {reason}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          {potentialFit ? (
            <p className="mb-2 rounded-md border border-[#E2D8B8] bg-[#FFF8EC] px-3 py-1.5 text-xs font-medium text-[#A05A00]">
              Potential Fit (exploratory compatibility range)
            </p>
          ) : null}
          <Link
            href={`/matches/${match.id}`}
            className="inline-flex w-full items-center justify-center rounded-lg border border-[#4B3FA0] bg-[#4B3FA0] px-4 py-3 text-sm font-medium text-white hover:bg-[#43388F]"
          >
            View match
          </Link>
        </div>
      </div>
    </article>
  );
}
