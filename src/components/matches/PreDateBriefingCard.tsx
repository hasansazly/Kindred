'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarHeart, MessageCircleHeart, RefreshCw } from 'lucide-react';

type PreDateBriefing = {
  connection_summary: string;
  shared_points: string[];
  conversation_starters: string[];
  mindful_note: string;
  date_idea: string;
  communication_tip: string;
  disclaimer: string;
};

type Props = {
  matchId: string;
  isMutualMatch: boolean;
};

export default function PreDateBriefingCard({ matchId, isMutualMatch }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<PreDateBriefing | null>(null);
  const [source, setSource] = useState<'cache' | 'ai' | 'fallback' | null>(null);

  const load = useCallback(async () => {
    if (!isMutualMatch) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/pre-date-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Briefing unavailable right now.');
      }

      if (payload.status !== 'ok' || !payload.briefing) {
        setBriefing(null);
        setSource(null);
        return;
      }

      setBriefing(payload.briefing as PreDateBriefing);
      setSource((payload.source as 'cache' | 'ai' | 'fallback' | undefined) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Briefing unavailable right now.');
    } finally {
      setLoading(false);
    }
  }, [isMutualMatch, matchId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isMutualMatch) {
    return (
      <section className="rounded-3xl border border-slate-700/80 bg-slate-900/65 p-6 backdrop-blur">
        <h2 className="text-lg font-medium text-slate-100">Before You Meet</h2>
        <p className="mt-2 text-sm text-slate-400">This brief unlocks after a confirmed mutual match.</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-700/80 bg-slate-900/65 p-6 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-slate-100">Your Pre-Date Brief</h2>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-violet-400/40 hover:text-violet-200 disabled:opacity-60"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? <p className="mt-3 text-sm text-slate-400">Building your brief...</p> : null}

      {error ? (
        <div className="mt-3 rounded-xl border border-rose-400/30 bg-rose-950/30 p-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {!loading && !error && !briefing ? (
        <p className="mt-3 text-sm text-slate-400">Briefing is currently unavailable. You can still continue your chat and date planning.</p>
      ) : null}

      {briefing ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
            <p className="text-xs uppercase tracking-[0.06em] text-violet-200">Why you may connect</p>
            <p className="mt-1 text-sm text-slate-200">{briefing.connection_summary}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.06em] text-violet-200">Shared points</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {briefing.shared_points.map(point => (
                <li key={point} className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs text-slate-200">
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.06em] text-violet-200">
              <MessageCircleHeart size={12} />
              Good conversation starters
            </p>
            <ul className="mt-2 space-y-2">
              {briefing.conversation_starters.map(starter => (
                <li key={starter} className="rounded-xl border border-slate-700 bg-slate-900/50 p-3 text-sm text-slate-200">
                  {starter}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
            <p className="text-xs uppercase tracking-[0.06em] text-violet-200">One mindful note</p>
            <p className="mt-1 text-sm text-slate-200">{briefing.mindful_note}</p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
            <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.06em] text-violet-200">
              <CalendarHeart size={12} />
              Suggested first-date vibe
            </p>
            <p className="mt-1 text-sm text-slate-200">{briefing.date_idea}</p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
            <p className="text-xs uppercase tracking-[0.06em] text-violet-200">Communication reminder</p>
            <p className="mt-1 text-sm text-slate-200">{briefing.communication_tip}</p>
          </div>

          <p className="text-xs text-slate-400">{briefing.disclaimer}</p>
          {source ? <p className="text-[11px] text-slate-500">Source: {source}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
