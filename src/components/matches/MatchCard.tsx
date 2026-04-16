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
    <article className="group overflow-hidden rounded-[24px] border border-[#2A3158] bg-[#0B1024]/92 shadow-[0_26px_70px_rgba(5,10,30,0.6)] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-[#6D5CE8]">
      <div className="relative h-64">
        {match.matchedProfile.photoUrl ? (
          <img
            src={match.matchedProfile.photoUrl}
            alt={match.matchedProfile.firstName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_20%,rgba(154,87,255,0.22),rgba(11,16,36,0.96)_62%)]">
            <User size={52} className="text-[#5E6B9A]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090E23] via-[#090E23]/35 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="inline-flex items-center rounded-full border border-[#6D5CE8]/45 bg-[#19153B]/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#CBC1FF]">
            {match.matchedProfile.photos.length > 0
              ? `${match.matchedProfile.photos.length} photo${match.matchedProfile.photos.length > 1 ? 's' : ''}`
              : 'Profile pending photos'}
          </div>
          <h3 className="mt-2 text-[38px] font-semibold leading-none tracking-tight text-[#F7F8FF]">
            {match.matchedProfile.firstName}
            {typeof match.matchedProfile.age === 'number' ? `, ${match.matchedProfile.age}` : ''}
          </h3>
          <p className="mt-1 text-sm text-[#B3BCD9]">{match.matchedProfile.location || 'Location not shared yet'}</p>
          <p className="mt-0.5 text-sm text-[#D5DAF2]">{truncate(match.matchedProfile.bio || 'Intentional dater on Vinculo.', 82)}</p>
        </div>
      </div>

      <div className="p-4">
        <div className="rounded-2xl border border-[#5F4EEA]/45 bg-gradient-to-r from-[#251E53]/92 to-[#331A3C]/85 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#BFAFFF]">Why this match fits</p>
          <p className="mt-1.5 text-[16px] font-normal leading-7 text-[#ECEFFF]">{summary}</p>
        </div>

        {reasons.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {reasons.map(reason => (
              <li
                key={reason}
                className="inline-flex items-center rounded-full border border-[#36416D] bg-[#1A2345] px-3 py-1 text-[12px] text-[#D7DEF8]"
              >
                {reason}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          {potentialFit ? (
            <p className="mb-2 rounded-md border border-[#8B6A2E]/55 bg-[#2A2112] px-3 py-1.5 text-xs font-medium text-[#F4C977]">
              Potential Fit (exploratory compatibility range)
            </p>
          ) : null}
          <Link
            href={`/matches/${match.id}`}
            className="inline-flex w-full items-center justify-center rounded-xl border border-[#7E62F2]/60 bg-gradient-to-r from-[#4D5FE6] via-[#7E46DB] to-[#D02E8B] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            View match
          </Link>
        </div>
      </div>
    </article>
  );
}
