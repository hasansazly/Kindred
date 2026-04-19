'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, Heart, HeartHandshake, Loader2, MessageCircleHeart, Shield } from 'lucide-react';

type ModuleResponse = {
  id: string;
  userId: string;
  createdAt: string;
  text: string;
  value: Record<string, unknown>;
  preview: string;
};

type ModuleState = {
  type: 'daily_micro_question' | 'weekly_pulse';
  question: {
    id: string;
    text: string;
    category: string;
    metadata: Record<string, unknown>;
  };
  cycleKey: string;
  status: 'pending_self' | 'waiting_partner' | 'complete';
  responses: ModuleResponse[];
};

type LoveNote = {
  id: string;
  body: string;
  createdAt: string;
  senderUserId: string;
  isMine: boolean;
};

type CoupleState = {
  enabled: boolean;
  hasCouple: boolean;
  viewerUserId?: string;
  unavailableReason?: string;
  couple?: {
    id: string;
    partnerUserId: string;
    partnerName: string;
    partnerPhotoUrl: string | null;
    confirmedAt: string;
  };
  modules?: {
    daily: ModuleState;
    weekly: ModuleState;
  };
  loveNotes?: LoveNote[];
  timeline?: Array<{
    id: string;
    type: 'prompt' | 'checkin' | 'love_note';
    title: string;
    summary: string;
    createdAt: string;
  }>;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CouplesPage() {
  const [state, setState] = useState<CoupleState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyDraft, setDailyDraft] = useState('');
  const [weeklyScore, setWeeklyScore] = useState<number | null>(null);
  const [weeklyGood, setWeeklyGood] = useState('');
  const [weeklyMore, setWeeklyMore] = useState('');
  const [loveNoteDraft, setLoveNoteDraft] = useState('');
  const [saving, setSaving] = useState<'daily' | 'weekly' | 'note' | null>(null);

  const loadState = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/couples/state', { method: 'GET' });
      const payload = (await res.json().catch(() => ({}))) as CoupleState & { error?: string };
      if (!res.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Unable to load Couple Mode');
      }
      setState(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Couple Mode');
      setState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const submitDaily = async (event: FormEvent) => {
    event.preventDefault();
    if (!dailyDraft.trim()) return;
    setSaving('daily');
    setError(null);
    try {
      const res = await fetch('/api/couples/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'daily', responseText: dailyDraft.trim() }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to submit response');
      }
      setDailyDraft('');
      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setSaving(null);
    }
  };

  const submitWeekly = async (event: FormEvent) => {
    event.preventDefault();
    if (weeklyScore === null && !weeklyGood.trim() && !weeklyMore.trim()) return;

    setSaving('weekly');
    setError(null);
    try {
      const res = await fetch('/api/couples/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'weekly',
          responseValue: {
            connectedScore: weeklyScore,
            feltGood: weeklyGood.trim(),
            wantMore: weeklyMore.trim(),
          },
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to submit check-in');
      }
      setWeeklyScore(null);
      setWeeklyGood('');
      setWeeklyMore('');
      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit check-in');
    } finally {
      setSaving(null);
    }
  };

  const submitLoveNote = async (event: FormEvent) => {
    event.preventDefault();
    if (!loveNoteDraft.trim()) return;

    setSaving('note');
    setError(null);
    try {
      const res = await fetch('/api/couples/love-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: loveNoteDraft.trim() }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to send love note');
      }
      setLoveNoteDraft('');
      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send love note');
    } finally {
      setSaving(null);
    }
  };

  const daily = state?.modules?.daily;
  const weekly = state?.modules?.weekly;
  const notes = state?.loveNotes ?? [];
  const timeline = state?.timeline ?? [];
  const partnerName = state?.couple?.partnerName ?? 'Partner';
  const confirmedLabel = state?.couple?.confirmedAt ? formatDate(state.couple.confirmedAt) : '';

  const statusText = useMemo(() => {
    if (!daily) return '';
    if (daily.status === 'pending_self') return 'Your response needed';
    if (daily.status === 'waiting_partner') return `Waiting for ${partnerName}`;
    return 'Both answers unlocked';
  }, [daily, partnerName]);

  return (
    <div className="min-h-screen bg-[#060814] px-4 pb-10 pt-6 text-[#F3F5FF]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(1100px 540px at 14% -8%, rgba(124,58,237,0.25), transparent 58%), radial-gradient(980px 520px at 92% -2%, rgba(236,72,153,0.2), transparent 55%), radial-gradient(820px 460px at 50% 110%, rgba(59,130,246,0.17), transparent 60%)',
        }}
      />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-4">
        <header className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-5 shadow-[0_24px_80px_rgba(5,10,30,0.6)] backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#A6AED0]">Private Couple Space</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Couple Mode</h1>
          <p className="mt-2 text-sm text-[#A9B0D0]">
            A calm shared space for rituals, check-ins, memories, and appreciation.
          </p>
        </header>

        {loading ? (
          <section className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-6">
            <p className="inline-flex items-center gap-2 text-sm text-[#A9B0D0]">
              <Loader2 size={16} className="animate-spin" />
              Loading Couple Mode...
            </p>
          </section>
        ) : null}

        {error ? (
          <section className="rounded-2xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200">
            {error}
          </section>
        ) : null}

        {!loading && state && !state.enabled ? (
          <section className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-6">
            <p className="text-sm text-[#A9B0D0]">Couple Mode is currently disabled.</p>
          </section>
        ) : null}

        {!loading && state?.enabled && !state.hasCouple ? (
          <section className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-6">
            <h2 className="text-lg font-medium text-white">Not in Couple Mode yet</h2>
            <p className="mt-2 text-sm text-[#A9B0D0]">
              Couple Mode unlocks after a confirmed couple status is set for your pair.
            </p>
            {state.unavailableReason === 'pair_unavailable' ? (
              <p className="mt-2 text-xs text-[#D6DDFB]/75">
                This pair is currently unavailable because of a safety or unmatch state.
              </p>
            ) : null}
          </section>
        ) : null}

        {!loading && state?.enabled && state.hasCouple && daily && weekly ? (
          <>
            <section className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-full border border-[#4B3FA0] bg-[#171E3A]">
                  {state.couple?.partnerPhotoUrl ? (
                    <img
                      src={state.couple.partnerPhotoUrl}
                      alt={partnerName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg text-[#A6AED0]">
                      <Heart size={20} />
                    </div>
                  )}
                </div>
                <div className="min-w-[180px] flex-1">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#A6AED0]">Confirmed Couple</p>
                  <h2 className="text-xl font-semibold text-white">You & {partnerName}</h2>
                  {confirmedLabel ? <p className="text-xs text-[#A9B0D0]">Confirmed on {confirmedLabel}</p> : null}
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#4B3FA0]/45 bg-[#1A1640] px-3 py-1 text-xs text-[#D6D1FF]">
                  <Shield size={13} />
                  Private
                </span>
              </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <section className="space-y-4">
                <article className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.08em] text-[#A6AED0]">Today&apos;s Prompt</p>
                      <h3 className="mt-1 text-lg font-medium text-white">{daily.question.text}</h3>
                    </div>
                    <span className="rounded-full border border-[#36416D] bg-[#121A3A] px-3 py-1 text-[11px] text-[#D6DDFB]">
                      {statusText}
                    </span>
                  </div>

                  {daily.status === 'pending_self' ? (
                    <form className="mt-4 space-y-2" onSubmit={submitDaily}>
                      <textarea
                        value={dailyDraft}
                        onChange={event => setDailyDraft(event.target.value)}
                        placeholder="Share a thoughtful answer..."
                        className="min-h-[92px] w-full rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                      />
                      <button
                        type="submit"
                        disabled={!dailyDraft.trim() || saving === 'daily'}
                        className="inline-flex items-center justify-center rounded-lg bg-[#4B3FA0] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                      >
                        {saving === 'daily' ? 'Saving...' : 'Submit answer'}
                      </button>
                    </form>
                  ) : null}

                  {daily.responses.length > 0 ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {daily.responses.map(response => (
                        <div key={response.id} className="rounded-xl border border-[#36416D] bg-[#121A3A] p-3">
                          <p className="text-[11px] uppercase tracking-[0.06em] text-[#A6AED0]">
                            {response.userId === state.viewerUserId ? 'You' : partnerName}
                          </p>
                          <p className="mt-1 text-sm text-[#E8ECFF]">{response.preview}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>

                <article className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-5">
                  <div className="flex items-center gap-2">
                    <CalendarCheck2 size={16} className="text-[#C9C0FF]" />
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[#A6AED0]">Weekly Check-In</p>
                  </div>
                  <h3 className="mt-1 text-lg font-medium text-white">{weekly.question.text}</h3>
                  <p className="mt-1 text-xs text-[#A9B0D0]">
                    Keep it short and honest: how connected, what felt good, and what you want more of.
                  </p>

                  {weekly.status === 'pending_self' ? (
                    <form className="mt-4 space-y-3" onSubmit={submitWeekly}>
                      <div>
                        <p className="mb-2 text-xs text-[#D6DDFB]">How connected did you feel this week?</p>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map(score => (
                            <button
                              key={score}
                              type="button"
                              onClick={() => setWeeklyScore(score)}
                              className={`h-8 w-8 rounded-full border text-xs ${
                                weeklyScore === score
                                  ? 'border-[#4B3FA0] bg-[#EDE9FA] text-[#4B3FA0]'
                                  : 'border-[#4E5A92] bg-[#121A3A] text-[#D6DDFB]'
                              }`}
                            >
                              {score}
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        value={weeklyGood}
                        onChange={event => setWeeklyGood(event.target.value)}
                        placeholder="What felt good this week?"
                        className="min-h-[70px] w-full rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                      />
                      <textarea
                        value={weeklyMore}
                        onChange={event => setWeeklyMore(event.target.value)}
                        placeholder="What would you like more of next week?"
                        className="min-h-[70px] w-full rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                      />
                      <button
                        type="submit"
                        disabled={saving === 'weekly' || (weeklyScore === null && !weeklyGood.trim() && !weeklyMore.trim())}
                        className="inline-flex items-center justify-center rounded-lg bg-[#4B3FA0] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                      >
                        {saving === 'weekly' ? 'Saving...' : 'Submit weekly check-in'}
                      </button>
                    </form>
                  ) : null}

                  {weekly.responses.length > 0 ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {weekly.responses.map(response => (
                        <div key={response.id} className="rounded-xl border border-[#36416D] bg-[#121A3A] p-3">
                          <p className="text-[11px] uppercase tracking-[0.06em] text-[#A6AED0]">
                            {response.userId === state.viewerUserId ? 'You' : partnerName}
                          </p>
                          <p className="mt-1 text-sm text-[#E8ECFF]">{response.preview}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              </section>

              <section className="space-y-4">
                <article className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-5">
                  <div className="flex items-center gap-2">
                    <MessageCircleHeart size={16} className="text-[#C9C0FF]" />
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[#A6AED0]">Love Notes</p>
                  </div>
                  <form className="mt-3 space-y-2" onSubmit={submitLoveNote}>
                    <textarea
                      value={loveNoteDraft}
                      onChange={event => setLoveNoteDraft(event.target.value)}
                      placeholder={`Send a quick appreciation to ${partnerName}...`}
                      className="min-h-[82px] w-full rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                    />
                    <button
                      type="submit"
                      disabled={!loveNoteDraft.trim() || saving === 'note'}
                      className="inline-flex items-center justify-center rounded-lg bg-[#4B3FA0] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {saving === 'note' ? 'Sending...' : 'Send love note'}
                    </button>
                  </form>
                  {notes.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {notes.slice(0, 5).map(note => (
                        <div key={note.id} className="rounded-xl border border-[#36416D] bg-[#121A3A] p-3">
                          <p className="text-xs text-[#D6DDFB]">{note.body}</p>
                          <p className="mt-1 text-[11px] text-[#A6AED0]">
                            {note.isMine ? 'You' : partnerName} · {formatDateTime(note.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>

                <article className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-5">
                  <div className="flex items-center gap-2">
                    <HeartHandshake size={16} className="text-[#C9C0FF]" />
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[#A6AED0]">Shared Memory Timeline</p>
                  </div>

                  {timeline.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {timeline.map(item => (
                        <li key={item.id} className="rounded-xl border border-[#36416D] bg-[#121A3A] p-3">
                          <p className="text-xs uppercase tracking-[0.06em] text-[#A6AED0]">{item.title}</p>
                          <p className="mt-1 text-sm text-[#E8ECFF]">{item.summary}</p>
                          <p className="mt-1 text-[11px] text-[#A6AED0]">{formatDateTime(item.createdAt)}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-[#A9B0D0]">
                      Shared memories will appear here after you both answer prompts/check-ins or send notes.
                    </p>
                  )}
                </article>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
