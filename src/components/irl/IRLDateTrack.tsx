'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { IRLActivitySuggestionCard } from '@/lib/irl/activitySuggestions';

type ReadyPayload = {
  featureEnabled: boolean;
  matchId: string;
  viewerUserId: string;
  participantUserIds: string[];
  connectionTrackDays: number;
  unlocked: boolean;
  readyUserIds: string[];
  bothReady: boolean;
  suggestion: IRLActivitySuggestionCard;
};

type IntentionPayload = {
  featureEnabled: boolean;
  matchId: string;
  bothReady?: boolean;
  unlocked?: boolean;
  submittedUserIds: string[];
  bothSubmitted: boolean;
  answersVisible: boolean;
  answersByUser: Record<string, Record<string, unknown>> | null;
  reflectionDueAt: string | null;
  myReflectionSubmitted: boolean;
  myReflection: {
    feeling: string;
    note: string | null;
    submitted_at: string;
  } | null;
};

const IRLReadyButton = dynamic(() => import('./IRLReadyButton'), { ssr: false });
const IRLIntentionCheck = dynamic(() => import('./IRLIntentionCheck'), { ssr: false });
const IRLActivitySuggestion = dynamic(() => import('./IRLActivitySuggestion'), { ssr: false });
const IRLPostDateReflection = dynamic(() => import('./IRLPostDateReflection'), { ssr: false });

async function parseJson<T>(res: Response): Promise<T> {
  const payload = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(typeof payload.error === 'string' ? payload.error : 'Request failed');
  }
  return payload;
}

export default function IRLDateTrack({ matchId }: { matchId: string }) {
  const [ready, setReady] = useState<ReadyPayload | null>(null);
  const [intention, setIntention] = useState<IntentionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingReady, setSavingReady] = useState(false);
  const [savingIntention, setSavingIntention] = useState(false);
  const [savingReflection, setSavingReflection] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const readiness = await parseJson<ReadyPayload>(await fetch(`/api/irl/ready/${matchId}`));
      setReady(readiness);

      if (!readiness.featureEnabled || !readiness.unlocked) {
        setIntention(null);
        return;
      }

      const intentionPayload = await parseJson<IntentionPayload>(await fetch(`/api/irl/intention/${matchId}`));
      setIntention(intentionPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load IRL Date Track');
      setReady(null);
      setIntention(null);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const reflectionDueNow = useMemo(() => {
    if (!intention?.reflectionDueAt) return false;
    const dueTs = new Date(intention.reflectionDueAt).getTime();
    return Number.isFinite(dueTs) && Date.now() >= dueTs;
  }, [intention?.reflectionDueAt]);

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-700/80 bg-slate-900/65 p-6">
        <p className="text-sm text-slate-400">Loading IRL Date Track...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-rose-400/35 bg-rose-950/25 p-6">
        <p className="text-sm text-rose-200">{error}</p>
      </section>
    );
  }

  if (!ready || !ready.featureEnabled) {
    return null;
  }

  if (!ready.unlocked) {
    return (
      <section className="rounded-3xl border border-slate-700/80 bg-slate-900/65 p-6">
        <h3 className="text-lg font-semibold text-slate-100">IRL Date Track</h3>
        <p className="mt-1 text-sm text-slate-400">
          Complete 3+ consecutive Connection Track days to unlock. Current streak: {ready.connectionTrackDays}.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-500/20 via-slate-900/70 to-slate-900/75 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-violet-100">IRL Date Track</h3>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md border border-slate-600/80 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-300"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <IRLReadyButton
          viewerUserId={ready.viewerUserId}
          participantUserIds={ready.participantUserIds}
          readyUserIds={ready.readyUserIds}
          busy={savingReady}
          onReady={async () => {
            try {
              setSavingReady(true);
              const response = await fetch('/api/irl/ready', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId }),
              });
              await parseJson(response);
              await load();
            } finally {
              setSavingReady(false);
            }
          }}
        />

        <IRLActivitySuggestion suggestion={ready.suggestion} />
      </div>

      <div className="mt-4 space-y-4">
        <IRLIntentionCheck
          viewerUserId={ready.viewerUserId}
          participantUserIds={ready.participantUserIds}
          submittedUserIds={intention?.submittedUserIds ?? []}
          bothReady={ready.bothReady}
          bothSubmitted={Boolean(intention?.bothSubmitted)}
          answersVisible={Boolean(intention?.answersVisible)}
          answersByUser={intention?.answersByUser ?? null}
          busy={savingIntention}
          onSubmit={async answers => {
            try {
              setSavingIntention(true);
              const response = await fetch('/api/irl/intention', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, answers }),
              });
              await parseJson(response);
              await load();
            } finally {
              setSavingIntention(false);
            }
          }}
        />

        <IRLPostDateReflection
          reflectionDueAt={intention?.reflectionDueAt ?? null}
          dueNow={reflectionDueNow}
          alreadySubmitted={Boolean(intention?.myReflectionSubmitted)}
          submittedReflection={intention?.myReflection ?? null}
          busy={savingReflection}
          onSubmit={async payload => {
            try {
              setSavingReflection(true);
              const response = await fetch('/api/irl/reflection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, feeling: payload.feeling, note: payload.note }),
              });
              await parseJson(response);
              await load();
            } finally {
              setSavingReflection(false);
            }
          }}
        />
      </div>
    </section>
  );
}
