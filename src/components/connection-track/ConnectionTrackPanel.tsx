'use client';

import { FormEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, HeartHandshake, TimerReset } from 'lucide-react';

type ModuleQuestion = {
  id: string;
  text: string;
  category: string;
  metadata?: Record<string, unknown>;
};

type ModuleResponse = {
  id: string;
  userId: string;
  text: string;
  value: Record<string, unknown> | null;
  createdAt: string;
};

type ModuleState = {
  question: ModuleQuestion | null;
  cycleKey: string | null;
  status: 'pending_self' | 'waiting_other' | 'complete' | 'not_started';
  responses: ModuleResponse[];
  summary?: string;
};

type TrackState = {
  viewerUserId: string;
  track: {
    id: string;
    status: string;
    matchId: string | null;
    conversationId: string | null;
  };
  modules: {
    daily: ModuleState;
    weekly: ModuleState;
    preDate: ModuleState;
  };
};

function getSingleChoiceOptions(metadata?: Record<string, unknown>) {
  if (!metadata) return [] as string[];
  const raw = metadata.options;
  if (!Array.isArray(raw)) return [];
  return raw.filter(item => typeof item === 'string') as string[];
}

function getScaleBounds(metadata?: Record<string, unknown>) {
  if (!metadata) return null;
  if (metadata.input_type !== 'scale') return null;
  const min = typeof metadata.min === 'number' ? metadata.min : 1;
  const max = typeof metadata.max === 'number' ? metadata.max : 5;
  if (min > max) return null;
  return { min, max };
}

function statusLabel(status: ModuleState['status']) {
  if (status === 'pending_self') return 'Your response needed';
  if (status === 'waiting_other') return 'Waiting for match';
  if (status === 'complete') return 'Both answered';
  return 'Not started';
}

function responsePreview(response: ModuleResponse) {
  if (response.text?.trim()) return response.text;
  if (response.value && typeof response.value.choice === 'string') return response.value.choice;
  if (response.value && typeof response.value.score === 'number') return String(response.value.score);
  return 'No response text';
}

export default function ConnectionTrackPanel({
  conversationId,
  matchId,
}: {
  conversationId?: string;
  matchId?: string;
}) {
  const [state, setState] = useState<TrackState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingModule, setSavingModule] = useState<'daily' | 'weekly' | 'preDate' | null>(null);
  const [draftDaily, setDraftDaily] = useState('');
  const [draftWeeklyText, setDraftWeeklyText] = useState('');
  const [draftWeeklyChoice, setDraftWeeklyChoice] = useState('');
  const [draftWeeklyScore, setDraftWeeklyScore] = useState<number | null>(null);
  const [draftPreDate, setDraftPreDate] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (conversationId) params.set('conversationId', conversationId);
    if (matchId) params.set('matchId', matchId);
    return params.toString();
  }, [conversationId, matchId]);

  const loadState = useCallback(async () => {
    if (!query) {
      setLoading(false);
      setError('Connection track context is missing.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/connection-track/state?${query}`, {
        method: 'GET',
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Unable to load connection track');
      }
      setState(payload as TrackState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load connection track');
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const submitResponse = async (
    moduleKey: 'daily' | 'weekly' | 'preDate',
    payload: { responseText?: string; responseValue?: Record<string, unknown> }
  ) => {
    if (!state) return;
    const moduleState = state.modules[moduleKey];
    if (!moduleState.question || !moduleState.cycleKey) return;

    setSavingModule(moduleKey);
    setError(null);

    try {
      const res = await fetch('/api/connection-track/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionTrackId: state.track.id,
          questionId: moduleState.question.id,
          cycleKey: moduleState.cycleKey,
          responseText: payload.responseText,
          responseValue: payload.responseValue,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : 'Unable to save response');
      }

      if (moduleKey === 'daily') setDraftDaily('');
      if (moduleKey === 'weekly') {
        setDraftWeeklyText('');
        setDraftWeeklyChoice('');
        setDraftWeeklyScore(null);
      }
      if (moduleKey === 'preDate') setDraftPreDate('');

      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save response');
    } finally {
      setSavingModule(null);
    }
  };

  const startPreDate = async () => {
    if (!state) return;
    setSavingModule('preDate');
    setError(null);

    try {
      const res = await fetch('/api/connection-track/pre-date/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionTrackId: state.track.id,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Unable to start pre-date check');
      }

      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start pre-date check');
    } finally {
      setSavingModule(null);
    }
  };

  const renderResponses = (moduleState: ModuleState) => {
    if (moduleState.responses.length === 0) return null;
    return (
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {moduleState.responses.map(response => (
          <div key={response.id} className="rounded-lg border border-[#36416D] bg-[#151C3C] px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.06em] text-[#A6AED0]">{response.userId === state?.viewerUserId ? 'You' : 'Match'}</p>
            <p className="mt-1 text-sm text-[#E8ECFF]">{responsePreview(response)}</p>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <section className="rounded-xl border border-[#36416D] bg-[#101735] p-4">
        <p className="text-sm text-[#A9B0D0]">Loading Connection Track...</p>
      </section>
    );
  }

  if (error) {
    const softMessage =
      error.toLowerCase().includes('no active match') ||
      error.toLowerCase().includes('unavailable') ||
      error.toLowerCase().includes('forbidden')
        ? 'Connection Track is currently unavailable for this chat.'
        : `Connection Track issue: ${error}`;

    return (
      <section className="rounded-xl border border-[#5A4DB7] bg-[#171338] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[#D5CBFF]">{softMessage}</p>
          <button
            type="button"
            onClick={() => void loadState()}
            className="rounded-md border border-[#6B5CE7] bg-[#1F1A49] px-2.5 py-1 text-[11px] font-medium text-[#F1EEFF] hover:brightness-110"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (!state) {
    return null;
  }

  const weeklyOptions = getSingleChoiceOptions(state.modules.weekly.question?.metadata);
  const weeklyScale = getScaleBounds(state.modules.weekly.question?.metadata);

  const renderCard = (
    moduleKey: 'daily' | 'weekly' | 'preDate',
    moduleState: ModuleState,
    options: {
      title: string;
      subtitle: string;
      icon: ReactNode;
    }
  ) => {
    return (
      <article className="rounded-xl border border-[#36416D] bg-[#101735] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.06em] text-[#A6AED0]">{options.subtitle}</p>
            <h3 className="mt-1 text-base font-medium text-[#F8F9FF]">{options.title}</h3>
          </div>
          <span className="text-[#C9C0FF]">{options.icon}</span>
        </div>

        <div className="mt-3 rounded-lg border border-[#36416D] bg-[#151C3C] px-3 py-2.5">
          <p className="text-sm text-[#E8ECFF]">{moduleState.question?.text ?? 'No prompt available right now.'}</p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.06em] text-[#A6AED0]">{statusLabel(moduleState.status)}</p>
        </div>

        {moduleState.status === 'complete' || moduleState.status === 'waiting_other'
          ? renderResponses(moduleState)
          : null}

        {moduleKey === 'daily' && moduleState.status === 'pending_self' ? (
          <form
            className="mt-3 space-y-2"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              if (!draftDaily.trim()) return;
              void submitResponse('daily', { responseText: draftDaily.trim() });
            }}
          >
            <textarea
              value={draftDaily}
              onChange={event => setDraftDaily(event.target.value)}
              placeholder="Share a short, honest response"
              className="min-h-[82px] w-full rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
            />
            <button
              type="submit"
              disabled={!draftDaily.trim() || savingModule === 'daily'}
              className="inline-flex items-center justify-center rounded-lg bg-[#4B3FA0] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {savingModule === 'daily' ? 'Saving...' : 'Submit answer'}
            </button>
          </form>
        ) : null}

        {moduleKey === 'weekly' && moduleState.status === 'pending_self' ? (
          <div className="mt-3 space-y-2">
            {weeklyOptions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {weeklyOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDraftWeeklyChoice(option)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      draftWeeklyChoice === option
                        ? 'border-[#4B3FA0] bg-[#EDE9FA] text-[#4B3FA0]'
                        : 'border-[#4E5A92] bg-[#121A3A] text-[#D6DDFB]'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}

            {weeklyScale ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: weeklyScale.max - weeklyScale.min + 1 }, (_, index) => weeklyScale.min + index).map(
                  score => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setDraftWeeklyScore(score)}
                      className={`h-8 w-8 rounded-full border text-xs ${
                        draftWeeklyScore === score
                          ? 'border-[#4B3FA0] bg-[#EDE9FA] text-[#4B3FA0]'
                          : 'border-[#4E5A92] bg-[#121A3A] text-[#D6DDFB]'
                      }`}
                    >
                      {score}
                    </button>
                  )
                )}
              </div>
            ) : null}

            {weeklyOptions.length === 0 && !weeklyScale ? (
              <textarea
                value={draftWeeklyText}
                onChange={event => setDraftWeeklyText(event.target.value)}
                placeholder="Share your pulse"
                className="min-h-[82px] w-full rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
              />
            ) : null}

            <button
              type="button"
              disabled={
                savingModule === 'weekly' ||
                (!draftWeeklyChoice && draftWeeklyScore === null && !draftWeeklyText.trim())
              }
              onClick={() => {
                const responseValue: Record<string, unknown> = {};
                if (draftWeeklyChoice) responseValue.choice = draftWeeklyChoice;
                if (typeof draftWeeklyScore === 'number') responseValue.score = draftWeeklyScore;
                void submitResponse('weekly', {
                  responseText: draftWeeklyText.trim() || undefined,
                  responseValue: Object.keys(responseValue).length > 0 ? responseValue : undefined,
                });
              }}
              className="inline-flex items-center justify-center rounded-lg bg-[#4B3FA0] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {savingModule === 'weekly' ? 'Saving...' : 'Submit pulse'}
            </button>
          </div>
        ) : null}

        {moduleKey === 'weekly' && moduleState.summary ? (
          <p className="mt-3 text-sm text-[#A9B0D0]">{moduleState.summary}</p>
        ) : null}

        {moduleKey === 'preDate' && moduleState.status === 'not_started' ? (
          <button
            type="button"
            onClick={() => void startPreDate()}
            disabled={savingModule === 'preDate'}
            className="mt-3 inline-flex items-center justify-center rounded-lg border border-[#4B3FA0] px-4 py-2 text-sm font-medium text-[#4B3FA0] disabled:opacity-60"
          >
            {savingModule === 'preDate' ? 'Starting...' : 'Start pre-date check'}
          </button>
        ) : null}

        {moduleKey === 'preDate' && moduleState.status === 'pending_self' ? (
          <form
            className="mt-3 space-y-2"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              if (!draftPreDate.trim()) return;
              void submitResponse('preDate', { responseText: draftPreDate.trim() });
            }}
          >
            <textarea
              value={draftPreDate}
              onChange={event => setDraftPreDate(event.target.value)}
              placeholder="Share your pre-date intention"
              className="min-h-[82px] w-full rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
            />
            <button
              type="submit"
              disabled={!draftPreDate.trim() || savingModule === 'preDate'}
              className="inline-flex items-center justify-center rounded-lg bg-[#4B3FA0] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {savingModule === 'preDate' ? 'Saving...' : 'Submit intention'}
            </button>
          </form>
        ) : null}
      </article>
    );
  };

  return (
    <section className="space-y-3 rounded-2xl border border-[#36416D] bg-[#0D1431] p-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.06em] text-[#A6AED0]">Connection Track</p>
        <h2 className="mt-1 text-xl font-medium text-[#F8F9FF]">Keep momentum with clarity</h2>
        <p className="mt-1 text-sm text-[#A9B0D0]">
          One daily question, one weekly pulse, and an optional pre-date check.
        </p>
      </div>

      <div className="grid gap-3">
        {renderCard('daily', state.modules.daily, {
          title: 'Today’s Micro-Question',
          subtitle: 'Daily',
          icon: <TimerReset size={18} />,
        })}

        {renderCard('weekly', state.modules.weekly, {
          title: 'Weekly Compatibility Pulse',
          subtitle: 'Weekly',
          icon: <CalendarCheck2 size={18} />,
        })}

        {renderCard('preDate', state.modules.preDate, {
          title: 'Pre-Date Intention Check',
          subtitle: 'Optional',
          icon: <HeartHandshake size={18} />,
        })}
      </div>
    </section>
  );
}
