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
  datePlans?: Array<{
    id: string;
    title: string;
    summary: string;
    steps: string[];
    createdAt: string;
  }>;
  reminders?: Array<{
    id: string;
    title: string;
    note: string;
    dueAt: string;
    completed: boolean;
    completedAt: string | null;
    createdAt: string;
  }>;
  dashboard?: {
    openReminderCount: number;
    nextReminder: {
      id: string;
      title: string;
      dueAt: string;
    } | null;
    memoryCount: number;
    completedCheckins: number;
    lastDatePlanTitle: string | null;
  };
  mode?: {
    selfEnabled: boolean;
    partnerEnabled: boolean | null;
    effectiveOn: boolean;
    migrationRequired?: boolean;
  };
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
  const [plannerSaving, setPlannerSaving] = useState(false);
  const [reminderSaving, setReminderSaving] = useState(false);
  const [modeSaving, setModeSaving] = useState(false);
  const [plannerVibe, setPlannerVibe] = useState('cozy');
  const [plannerBudget, setPlannerBudget] = useState('$$');
  const [plannerDuration, setPlannerDuration] = useState('2-3h');
  const [plannerLocation, setPlannerLocation] = useState('');
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderNote, setReminderNote] = useState('');
  const [reminderDate, setReminderDate] = useState('');

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

  const generateDatePlan = async (event: FormEvent) => {
    event.preventDefault();
    setPlannerSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/couples/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vibe: plannerVibe,
          budget: plannerBudget,
          duration: plannerDuration,
          locationHint: plannerLocation.trim(),
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to generate date plan');
      }
      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate date plan');
    } finally {
      setPlannerSaving(false);
    }
  };

  const submitReminder = async (event: FormEvent) => {
    event.preventDefault();
    if (!reminderTitle.trim() || !reminderDate) return;
    setReminderSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/couples/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reminderTitle.trim(),
          note: reminderNote.trim(),
          dueAt: reminderDate,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to add reminder');
      }
      setReminderTitle('');
      setReminderNote('');
      setReminderDate('');
      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reminder');
    } finally {
      setReminderSaving(false);
    }
  };

  const completeReminder = async (id: string) => {
    setReminderSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/couples/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completeId: id }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to complete reminder');
      }
      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete reminder');
    } finally {
      setReminderSaving(false);
    }
  };

  const toggleMode = async (nextEnabled: boolean) => {
    setModeSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/couples/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextEnabled }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to update Couple Mode');
      }
      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update Couple Mode');
    } finally {
      setModeSaving(false);
    }
  };

  const daily = state?.modules?.daily;
  const weekly = state?.modules?.weekly;
  const notes = state?.loveNotes ?? [];
  const timeline = state?.timeline ?? [];
  const datePlans = state?.datePlans ?? [];
  const reminders = state?.reminders ?? [];
  const openReminders = reminders.filter(item => !item.completed);
  const dashboard = state?.dashboard;
  const partnerName = state?.couple?.partnerName ?? 'Partner';
  const confirmedLabel = state?.couple?.confirmedAt ? formatDate(state.couple.confirmedAt) : '';
  const selfModeOn = Boolean(state?.mode?.selfEnabled);
  const partnerModeOn = Boolean(state?.mode?.partnerEnabled);
  const effectiveModeOn = Boolean(state?.mode?.effectiveOn);

  const statusText = useMemo(() => {
    if (!daily) return '';
    if (daily.status === 'pending_self') return 'Your response needed';
    if (daily.status === 'waiting_partner') return `Waiting for ${partnerName}`;
    return 'Both answers unlocked';
  }, [daily, partnerName]);

  return (
    <div className="app-interior-page min-h-screen text-[#F3F5FF]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(1100px 540px at 14% -8%, rgba(124,58,237,0.25), transparent 58%), radial-gradient(980px 520px at 92% -2%, rgba(236,72,153,0.2), transparent 55%), radial-gradient(820px 460px at 50% 110%, rgba(59,130,246,0.17), transparent 60%)',
        }}
      />
      <div className="app-page-shell relative flex max-w-5xl flex-col gap-4 pt-6">
        <header className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-5 shadow-[0_24px_80px_rgba(5,10,30,0.6)] backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#A6AED0]">Private Couple Space</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Couple Mode</h1>
          <p className="mt-2 text-sm text-[#A9B0D0]">
            A calm shared space for rituals, check-ins, memories, and appreciation.
          </p>
        </header>

        {!loading && state?.hasCouple ? (
          <section className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#A6AED0]">Couple Mode Status</p>
                <p className="mt-1 text-sm text-[#E8ECFF]">
                  You: <span className={selfModeOn ? 'text-emerald-300' : 'text-[#A9B0D0]'}>{selfModeOn ? 'ON' : 'OFF'}</span>
                  {' · '}
                  {partnerName}: <span className={partnerModeOn ? 'text-emerald-300' : 'text-[#A9B0D0]'}>{partnerModeOn ? 'ON' : 'OFF'}</span>
                </p>
                <p className="mt-1 text-xs text-[#A9B0D0]">
                  {effectiveModeOn
                    ? 'Both partners are ON. Dating sections are hidden and only your couple connection is visible.'
                    : 'Turn this ON so your partner can see your commitment status.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void toggleMode(!selfModeOn)}
                disabled={modeSaving}
                className={`inline-flex min-w-[120px] items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white ${
                  selfModeOn ? 'bg-rose-600/90' : 'bg-[#4B3FA0]'
                } disabled:opacity-60`}
              >
                {modeSaving ? 'Updating...' : selfModeOn ? 'Turn OFF' : 'Turn ON'}
              </button>
            </div>
          </section>
        ) : null}

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

        {!loading && state?.enabled && state.hasCouple && selfModeOn && daily && weekly ? (
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

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#A6AED0]">Next Reminder</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {dashboard?.nextReminder?.title ?? 'No pending reminders'}
                </p>
                {dashboard?.nextReminder?.dueAt ? (
                  <p className="mt-1 text-xs text-[#A9B0D0]">{formatDateTime(dashboard.nextReminder.dueAt)}</p>
                ) : null}
              </article>
              <article className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#A6AED0]">Open Reminders</p>
                <p className="mt-2 text-2xl font-semibold text-white">{dashboard?.openReminderCount ?? 0}</p>
                <p className="mt-1 text-xs text-[#A9B0D0]">Shared responsibilities at a glance.</p>
              </article>
              <article className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#A6AED0]">Memory Timeline</p>
                <p className="mt-2 text-2xl font-semibold text-white">{dashboard?.memoryCount ?? 0}</p>
                <p className="mt-1 text-xs text-[#A9B0D0]">Moments saved together.</p>
              </article>
              <article className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#A6AED0]">Latest Date Plan</p>
                <p className="mt-2 text-sm font-medium text-white">{dashboard?.lastDatePlanTitle ?? 'Not planned yet'}</p>
                <p className="mt-1 text-xs text-[#A9B0D0]">{dashboard?.completedCheckins ?? 0} completed weekly check-ins</p>
              </article>
            </section>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <section className="space-y-4">
                <article className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-5">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#A6AED0]">Date Concierge</p>
                  <h3 className="mt-1 text-lg font-medium text-white">Generate your next date plan</h3>
                  <p className="mt-1 text-xs text-[#A9B0D0]">
                    Quick planning based on your vibe, budget, and time.
                  </p>
                  <form className="mt-4 grid gap-2 sm:grid-cols-2" onSubmit={generateDatePlan}>
                    <select
                      value={plannerVibe}
                      onChange={event => setPlannerVibe(event.target.value)}
                      className="rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                    >
                      <option value="cozy">Cozy</option>
                      <option value="playful">Playful</option>
                      <option value="romantic">Romantic</option>
                      <option value="creative">Creative</option>
                    </select>
                    <select
                      value={plannerBudget}
                      onChange={event => setPlannerBudget(event.target.value)}
                      className="rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                    >
                      <option value="$">$</option>
                      <option value="$$">$$</option>
                      <option value="$$$">$$$</option>
                    </select>
                    <input
                      value={plannerDuration}
                      onChange={event => setPlannerDuration(event.target.value)}
                      placeholder="Duration (e.g. 2-3h)"
                      className="rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                    />
                    <input
                      value={plannerLocation}
                      onChange={event => setPlannerLocation(event.target.value)}
                      placeholder="Area or city"
                      className="rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                    />
                    <button
                      type="submit"
                      disabled={plannerSaving}
                      className="inline-flex items-center justify-center rounded-lg bg-[#4B3FA0] px-4 py-2 text-sm font-medium text-white disabled:opacity-60 sm:col-span-2"
                    >
                      {plannerSaving ? 'Generating...' : 'Generate date plan'}
                    </button>
                  </form>

                  {datePlans.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {datePlans.slice(0, 3).map(plan => (
                        <div key={plan.id} className="rounded-xl border border-[#36416D] bg-[#121A3A] p-3">
                          <p className="text-sm font-medium text-[#E8ECFF]">{plan.title}</p>
                          <p className="mt-1 text-xs text-[#D6DDFB]">{plan.summary}</p>
                          {plan.steps.length > 0 ? (
                            <p className="mt-1 text-[11px] text-[#A6AED0]">{plan.steps.join(' · ')}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>

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
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#A6AED0]">Shared Reminders</p>
                  <form className="mt-3 space-y-2" onSubmit={submitReminder}>
                    <input
                      value={reminderTitle}
                      onChange={event => setReminderTitle(event.target.value)}
                      placeholder="Reminder title"
                      className="w-full rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                    />
                    <textarea
                      value={reminderNote}
                      onChange={event => setReminderNote(event.target.value)}
                      placeholder="Optional note..."
                      className="min-h-[64px] w-full rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                    />
                    <input
                      type="datetime-local"
                      value={reminderDate}
                      onChange={event => setReminderDate(event.target.value)}
                      className="w-full rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                    />
                    <button
                      type="submit"
                      disabled={reminderSaving || !reminderTitle.trim() || !reminderDate}
                      className="inline-flex items-center justify-center rounded-lg bg-[#4B3FA0] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {reminderSaving ? 'Saving...' : 'Add reminder'}
                    </button>
                  </form>
                  {openReminders.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {openReminders.slice(0, 5).map(reminder => (
                        <div key={reminder.id} className="rounded-xl border border-[#36416D] bg-[#121A3A] p-3">
                          <p className="text-sm text-[#E8ECFF]">{reminder.title}</p>
                          {reminder.note ? <p className="mt-1 text-xs text-[#D6DDFB]">{reminder.note}</p> : null}
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <p className="text-[11px] text-[#A6AED0]">{formatDateTime(reminder.dueAt)}</p>
                            <button
                              type="button"
                              onClick={() => void completeReminder(reminder.id)}
                              disabled={reminderSaving}
                              className="rounded-md border border-[#4E5A92] px-2 py-1 text-[11px] text-[#D6DDFB] disabled:opacity-60"
                            >
                              Mark done
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[#A9B0D0]">No open reminders yet.</p>
                  )}
                </article>

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

        {!loading && state?.enabled && state.hasCouple && !selfModeOn ? (
          <section className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-6">
            <h2 className="text-lg font-medium text-white">Couple Mode is OFF for you</h2>
            <p className="mt-2 text-sm text-[#A9B0D0]">
              Turn it ON above to enter your private couple space. Your partner can already see your ON/OFF status.
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
