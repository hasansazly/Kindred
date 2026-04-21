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

type InviteMeta = {
  id: string;
  partnerEmail: string;
  code: string;
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  createdAt: string;
  expiresAt: string;
  inviteLink: string;
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
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [canCreateInvite, setCanCreateInvite] = useState(false);
  const [inviteReason, setInviteReason] = useState<string | null>(null);
  const [pendingInvite, setPendingInvite] = useState<InviteMeta | null>(null);
  const [inviteCodeFromUrl, setInviteCodeFromUrl] = useState('');

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const code = new URLSearchParams(window.location.search).get('invite') ?? '';
    setInviteCodeFromUrl(code.trim());
  }, []);

  const loadInviteMeta = useCallback(async () => {
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const res = await fetch('/api/couples/invite', { method: 'GET' });
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
        canCreateInvite?: boolean;
        reason?: string | null;
        pendingInvite?: InviteMeta | null;
      };
      if (!res.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Unable to load invite settings');
      }
      setCanCreateInvite(Boolean(payload.canCreateInvite));
      setInviteReason(typeof payload.reason === 'string' ? payload.reason : null);
      setPendingInvite(payload.pendingInvite ?? null);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Unable to load invite settings');
    }
  }, []);

  useEffect(() => {
    if (!loading && state?.enabled && !state.hasCouple) {
      void loadInviteMeta();
    }
  }, [loadInviteMeta, loading, state]);

  const createInvite = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = inviteEmail.trim().toLowerCase();
    if (!normalized) {
      setInviteError('Partner email is required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(normalized)) {
      setInviteError('Enter a valid partner email.');
      return;
    }

    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const res = await fetch('/api/couples/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerEmail: normalized }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
        invite?: InviteMeta;
      };
      if (!res.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Unable to create invite');
      }
      setPendingInvite(payload.invite ?? null);
      setInviteSuccess('Invite link created. Share it with your partner.');
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Unable to create invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const acceptInvite = async () => {
    if (!inviteCodeFromUrl) {
      setInviteError('Invite code is missing from this URL.');
      return;
    }
    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const res = await fetch('/api/couples/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCodeFromUrl }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Unable to accept invite');
      }
      setInviteSuccess('Invite accepted. Loading your Couple Mode...');
      await loadState();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Unable to accept invite');
    } finally {
      setInviteLoading(false);
    }
  };

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
    <div className="app-interior-page couple-mode-v2 min-h-screen text-[#F3F5FF]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(920px 440px at 10% -10%, rgba(124,58,237,0.22), transparent 56%), radial-gradient(760px 420px at 95% 0%, rgba(236,72,153,0.17), transparent 55%)',
        }}
      />
      <div className="app-page-shell cm-shell relative flex max-w-[420px] flex-col gap-3 pt-4">
        <header className="cm-card cm-header p-5">
          <p className="cm-kicker text-[11px] uppercase tracking-[0.08em] text-[#D5DBFA]">Private Couple Space</p>
          <h1 className="cm-title mt-1 text-3xl font-semibold text-white">Couple Mode</h1>
          <p className="mt-2 text-sm text-[#E6D8F4]">
            A calm shared space for rituals, check-ins, memories, and appreciation.
          </p>
        </header>

        {!loading && state?.hasCouple ? (
          <section className="cm-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="cm-kicker text-[11px] uppercase tracking-[0.08em] text-[#D5DBFA]">Couple Mode Status</p>
                <p className="mt-1 text-sm text-[#E8ECFF]">
                  You: <span className={selfModeOn ? 'text-emerald-300' : 'text-[#CED6F8]'}>{selfModeOn ? 'ON' : 'OFF'}</span>
                  {' · '}
                  {partnerName}: <span className={partnerModeOn ? 'text-emerald-300' : 'text-[#CED6F8]'}>{partnerModeOn ? 'ON' : 'OFF'}</span>
                </p>
                <p className="mt-1 text-xs text-[#CCB6FF]">
                  {effectiveModeOn
                    ? 'Both partners are ON. Dating sections are hidden and only your couple connection is visible.'
                    : 'Turn this ON so your partner can see your commitment status.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void toggleMode(!selfModeOn)}
                disabled={modeSaving}
                className={`inline-flex min-w-[120px] items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-white ${
                  selfModeOn ? 'bg-[#a855f7]' : 'bg-[#2D1A44]'
                } disabled:opacity-60`}
              >
                {modeSaving ? 'Updating...' : selfModeOn ? 'Turn OFF' : 'Turn ON'}
              </button>
            </div>
          </section>
        ) : null}

        {loading ? (
          <section className="cm-card p-6">
            <p className="inline-flex items-center gap-2 text-sm text-[#CED6F8]">
              <Loader2 size={16} className="animate-spin" />
              Loading Couple Mode...
            </p>
          </section>
        ) : null}

        {error ? (
          <section className="cm-card border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200">
            {error}
          </section>
        ) : null}

        {!loading && state && !state.enabled ? (
          <section className="cm-card p-6">
            <p className="couple-mode-off-copy text-sm text-[#CED6F8]">Couple Mode is currently disabled.</p>
          </section>
        ) : null}

        {!loading && state?.enabled && !state.hasCouple ? (
          <section className="cm-card p-6">
            <h2 className="couple-mode-empty-title couple-mode-off-title text-lg font-semibold text-[#F8FAFF]">Not in Couple Mode yet</h2>
            <p className="mt-2 text-sm text-[#CED6F8]">
              Couple Mode unlocks after a confirmed couple status is set for your pair.
            </p>
            {state.unavailableReason === 'pair_unavailable' ? (
              <p className="mt-2 text-xs text-[#E9EEFF]">
                This pair is currently unavailable because of a safety or unmatch state.
              </p>
            ) : null}
            {inviteCodeFromUrl ? (
              <div className="mt-4 rounded-xl border border-[#3D2B58] bg-[#120D1E] p-4">
                <p className="text-sm font-medium text-white">You were invited to join as a partner</p>
                <p className="mt-1 text-xs text-[#CED6F8]">
                  This invite is email-locked. Sign in with the invited email to accept.
                </p>
                <button
                  type="button"
                  onClick={() => void acceptInvite()}
                  disabled={inviteLoading}
                  className="mt-3 rounded-lg bg-[#A855F7] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {inviteLoading ? 'Accepting...' : 'Accept Invite'}
                </button>
              </div>
            ) : null}
            <div className="mt-4 rounded-xl border border-[#3D2B58] bg-[#120D1E] p-4">
              <p className="text-sm font-medium text-white">Invite your partner</p>
              <p className="mt-1 text-xs text-[#CED6F8]">
                Only @temple.edu users can send invites, and invited partners must use a .edu email.
              </p>
              {canCreateInvite ? (
                <form className="mt-3 space-y-2" onSubmit={createInvite}>
                  <input
                    className="w-full rounded-lg border border-[#7C3AED44] bg-[#120D1E] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#A855F7]"
                    type="email"
                    placeholder="approved-tester@email.com"
                    value={inviteEmail}
                    onChange={event => setInviteEmail(event.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="rounded-lg bg-[#A855F7] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {inviteLoading ? 'Creating...' : 'Create Invite Link'}
                  </button>
                </form>
              ) : (
                <p className="mt-3 text-xs text-amber-200">{inviteReason ?? 'Invites are unavailable right now.'}</p>
              )}
              {pendingInvite ? (
                <div className="mt-3 rounded-lg border border-[#3B2A54] bg-[#0E0A16] p-3">
                  <p className="text-xs text-[#E4E9FF]">Invite link</p>
                  <p className="mt-1 break-all text-xs text-[#D9E2FF]">{pendingInvite.inviteLink}</p>
                  <p className="mt-2 text-[11px] text-[#CED6F8]">
                    For: {pendingInvite.partnerEmail} · Expires {formatDateTime(pendingInvite.expiresAt)}
                  </p>
                </div>
              ) : null}
            </div>
            {inviteError ? <p className="mt-3 text-xs text-rose-300">{inviteError}</p> : null}
            {inviteSuccess ? <p className="mt-3 text-xs text-emerald-300">{inviteSuccess}</p> : null}
          </section>
        ) : null}

        {!loading && state?.enabled && state.hasCouple && selfModeOn && daily && weekly ? (
          <>
            <section className="cm-card p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-full border border-[#4B3FA0] bg-[#2D1A44]">
                  {state.couple?.partnerPhotoUrl ? (
                    <img
                      src={state.couple.partnerPhotoUrl}
                      alt={partnerName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg text-[#D5DBFA]">
                      <Heart size={20} />
                    </div>
                  )}
                </div>
                <div className="min-w-[180px] flex-1">
                  <p className="cm-kicker text-[11px] uppercase tracking-[0.08em] text-[#D5DBFA]">Confirmed Couple</p>
                  <h2 className="cm-title text-2xl font-semibold text-white">You & {partnerName}</h2>
                  {confirmedLabel ? <p className="text-xs text-[#CCB6FF]">Confirmed on {confirmedLabel}</p> : null}
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7C3AED55] bg-[#2D1A44] px-3 py-1 text-xs text-[#D6D1FF]">
                  <Shield size={13} />
                  Private
                </span>
              </div>
            </section>

            <section className="cm-metric-grid grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <article className="cm-card p-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#D5DBFA]">Next Reminder</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {dashboard?.nextReminder?.title ?? 'No pending reminders'}
                </p>
                {dashboard?.nextReminder?.dueAt ? (
                  <p className="mt-1 text-xs text-[#CED6F8]">{formatDateTime(dashboard.nextReminder.dueAt)}</p>
                ) : null}
              </article>
              <article className="cm-card p-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#D5DBFA]">Open Reminders</p>
                <p className="mt-2 text-2xl font-semibold text-white">{dashboard?.openReminderCount ?? 0}</p>
                <p className="mt-1 text-xs text-[#CED6F8]">Shared responsibilities at a glance.</p>
              </article>
              <article className="cm-card p-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#D5DBFA]">Memory Timeline</p>
                <p className="mt-2 text-2xl font-semibold text-white">{dashboard?.memoryCount ?? 0}</p>
                <p className="mt-1 text-xs text-[#CED6F8]">Moments saved together.</p>
              </article>
              <article className="cm-card p-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#D5DBFA]">Latest Date Plan</p>
                <p className="mt-2 text-sm font-medium text-white">{dashboard?.lastDatePlanTitle ?? 'Not planned yet'}</p>
                <p className="mt-1 text-xs text-[#CED6F8]">{dashboard?.completedCheckins ?? 0} completed weekly check-ins</p>
              </article>
            </section>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <section className="space-y-4">
                <article className="cm-card cm-plan-card p-5">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#D5DBFA]">Date Concierge</p>
                  <h3 className="cm-title mt-1 text-lg font-medium text-white">Generate your next date plan</h3>
                  <p className="mt-1 text-xs text-[#CED6F8]">
                    Quick planning based on your vibe, budget, and time.
                  </p>
                  <form className="mt-4 grid gap-2 sm:grid-cols-2" onSubmit={generateDatePlan}>
                    <select
                      value={plannerVibe}
                      onChange={event => setPlannerVibe(event.target.value)}
                      className="cm-input rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                    >
                      <option value="cozy">Cozy</option>
                      <option value="playful">Playful</option>
                      <option value="romantic">Romantic</option>
                      <option value="creative">Creative</option>
                    </select>
                    <select
                      value={plannerBudget}
                      onChange={event => setPlannerBudget(event.target.value)}
                      className="cm-input rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                    >
                      <option value="$">$</option>
                      <option value="$$">$$</option>
                      <option value="$$$">$$$</option>
                    </select>
                    <input
                      value={plannerDuration}
                      onChange={event => setPlannerDuration(event.target.value)}
                      placeholder="Duration (e.g. 2-3h)"
                      className="cm-input rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                    />
                    <input
                      value={plannerLocation}
                      onChange={event => setPlannerLocation(event.target.value)}
                      placeholder="Area or city"
                      className="cm-input rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                    />
                    <button
                      type="submit"
                      disabled={plannerSaving}
                      className="inline-flex items-center justify-center rounded-lg bg-[#2D1A44] px-4 py-2 text-sm font-medium text-[#C084FC] disabled:opacity-60 sm:col-span-2"
                    >
                      {plannerSaving ? 'Generating...' : 'Generate date plan'}
                    </button>
                  </form>

                  {datePlans.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {datePlans.slice(0, 3).map(plan => (
                        <div key={plan.id} className="rounded-xl border border-[#7C3AED44] bg-[#120D1E] p-3">
                          <p className="cm-title text-sm font-medium text-[#E8ECFF]">{plan.title}</p>
                          <p className="mt-1 text-xs text-[#D6DDFB]">{plan.summary}</p>
                          {plan.steps.length > 0 ? (
                            <p className="mt-1 text-[11px] text-[#D5DBFA]">{plan.steps.join(' · ')}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>

                <article className="cm-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.08em] text-[#D5DBFA]">Today&apos;s Prompt</p>
                      <h3 className="cm-title mt-1 text-lg font-medium text-white">{daily.question.text}</h3>
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
                        className="cm-input min-h-[92px] w-full rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                      />
                      <button
                        type="submit"
                        disabled={!dailyDraft.trim() || saving === 'daily'}
                        className="inline-flex items-center justify-center rounded-lg bg-[#A855F7] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                      >
                        {saving === 'daily' ? 'Saving...' : 'Submit answer'}
                      </button>
                    </form>
                  ) : null}

                  {daily.responses.length > 0 ? (
                    <div className="cm-response-grid mt-4 grid gap-2 sm:grid-cols-2">
                      {daily.responses.map(response => (
                        <div key={response.id} className="cm-response-card rounded-xl border border-[#7C3AED44] bg-[#120D1E] p-3">
                          <p className="text-[11px] uppercase tracking-[0.06em] text-[#D5DBFA]">
                            {response.userId === state.viewerUserId ? 'You' : partnerName}
                          </p>
                          <p className="mt-1 text-sm text-[#E8ECFF]">{response.preview}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>

                <article className="cm-card p-5">
                  <div className="flex items-center gap-2">
                    <CalendarCheck2 size={16} className="text-[#C9C0FF]" />
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[#D5DBFA]">Weekly Check-In</p>
                  </div>
                  <h3 className="cm-title mt-1 text-lg font-medium text-white">{weekly.question.text}</h3>
                  <p className="mt-1 text-xs text-[#CED6F8]">
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
                                  ? 'border-[#A855F7] bg-[#EDE9FA] text-[#4B3FA0]'
                                  : 'border-[#7C3AED44] bg-[#120D1E] text-[#D6DDFB]'
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
                        className="cm-input min-h-[70px] w-full rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                      />
                      <textarea
                        value={weeklyMore}
                        onChange={event => setWeeklyMore(event.target.value)}
                        placeholder="What would you like more of next week?"
                        className="cm-input min-h-[70px] w-full rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                      />
                      <button
                        type="submit"
                        disabled={saving === 'weekly' || (weeklyScore === null && !weeklyGood.trim() && !weeklyMore.trim())}
                        className="inline-flex items-center justify-center rounded-lg bg-[#A855F7] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                      >
                        {saving === 'weekly' ? 'Saving...' : 'Submit weekly check-in'}
                      </button>
                    </form>
                  ) : null}

                  {weekly.responses.length > 0 ? (
                    <div className="cm-response-grid mt-4 grid gap-2 sm:grid-cols-2">
                      {weekly.responses.map(response => (
                        <div key={response.id} className="cm-response-card rounded-xl border border-[#7C3AED44] bg-[#120D1E] p-3">
                          <p className="text-[11px] uppercase tracking-[0.06em] text-[#D5DBFA]">
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
                <article className="cm-card p-5">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#D5DBFA]">Shared Reminders</p>
                  <form className="mt-3 space-y-2" onSubmit={submitReminder}>
                    <input
                      value={reminderTitle}
                      onChange={event => setReminderTitle(event.target.value)}
                      placeholder="Reminder title"
                      className="cm-input w-full rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                    />
                    <textarea
                      value={reminderNote}
                      onChange={event => setReminderNote(event.target.value)}
                      placeholder="Optional note..."
                      className="cm-input min-h-[64px] w-full rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                    />
                    <input
                      type="datetime-local"
                      value={reminderDate}
                      onChange={event => setReminderDate(event.target.value)}
                      className="cm-input w-full rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                    />
                    <button
                      type="submit"
                      disabled={reminderSaving || !reminderTitle.trim() || !reminderDate}
                      className="inline-flex items-center justify-center rounded-lg bg-[#A855F7] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {reminderSaving ? 'Saving...' : 'Add reminder'}
                    </button>
                  </form>
                  {openReminders.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {openReminders.slice(0, 5).map(reminder => (
                        <div key={reminder.id} className="rounded-xl border border-[#7C3AED44] bg-[#120D1E] p-3">
                          <p className="text-sm text-[#E8ECFF]">{reminder.title}</p>
                          {reminder.note ? <p className="mt-1 text-xs text-[#D6DDFB]">{reminder.note}</p> : null}
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <p className="text-[11px] text-[#D5DBFA]">{formatDateTime(reminder.dueAt)}</p>
                            <button
                              type="button"
                              onClick={() => void completeReminder(reminder.id)}
                              disabled={reminderSaving}
                              className="rounded-md border border-[#7C3AED55] px-2 py-1 text-[11px] text-[#D6DDFB] disabled:opacity-60"
                            >
                              Mark done
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[#CED6F8]">No open reminders yet.</p>
                  )}
                </article>

                <article className="cm-card p-5">
                  <div className="flex items-center gap-2">
                    <MessageCircleHeart size={16} className="text-[#C9C0FF]" />
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[#D5DBFA]">Love Notes</p>
                  </div>
                  <form className="mt-3 space-y-2" onSubmit={submitLoveNote}>
                    <textarea
                      value={loveNoteDraft}
                      onChange={event => setLoveNoteDraft(event.target.value)}
                      placeholder={`Send a quick appreciation to ${partnerName}...`}
                      className="cm-input min-h-[82px] w-full rounded-lg border border-[#4E5A92] bg-[#121A3A] px-3 py-2 text-sm text-[#F6F8FF] outline-none focus:border-[#6B5CE7]"
                    />
                    <button
                      type="submit"
                      disabled={!loveNoteDraft.trim() || saving === 'note'}
                      className="inline-flex items-center justify-center rounded-lg bg-[#A855F7] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {saving === 'note' ? 'Sending...' : 'Send love note'}
                    </button>
                  </form>
                  {notes.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {notes.slice(0, 5).map(note => (
                        <div key={note.id} className="rounded-xl border border-[#7C3AED44] bg-[#120D1E] p-3">
                          <p className="text-xs text-[#D6DDFB]">{note.body}</p>
                          <p className="mt-1 text-[11px] text-[#D5DBFA]">
                            {note.isMine ? 'You' : partnerName} · {formatDateTime(note.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>

                <article className="cm-card p-5">
                  <div className="flex items-center gap-2">
                    <HeartHandshake size={16} className="text-[#C9C0FF]" />
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[#D5DBFA]">Shared Memory Timeline</p>
                  </div>

                  {timeline.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {timeline.map(item => (
                        <li key={item.id} className="rounded-xl border border-[#7C3AED44] bg-[#120D1E] p-3">
                          <p className="text-xs uppercase tracking-[0.06em] text-[#D5DBFA]">{item.title}</p>
                          <p className="mt-1 text-sm text-[#E8ECFF]">{item.summary}</p>
                          <p className="mt-1 text-[11px] text-[#D5DBFA]">{formatDateTime(item.createdAt)}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-[#CED6F8]">
                      Shared memories will appear here after you both answer prompts/check-ins or send notes.
                    </p>
                  )}
                </article>
              </section>
            </div>
          </>
        ) : null}

        {!loading && state?.enabled && state.hasCouple && !selfModeOn ? (
          <section className="cm-card p-6">
            <h2 className="couple-mode-off-title text-lg font-medium text-white">Couple Mode is OFF for you</h2>
            <p className="couple-mode-off-copy mt-2 text-sm text-[#CED6F8]">
              Turn it ON above to enter your private couple space. Your partner can already see your ON/OFF status.
            </p>
          </section>
        ) : null}
      </div>
      <style jsx>{`
        .couple-mode-v2 {
          background: #110d1a;
        }
        .couple-mode-v2 :global(*) {
          letter-spacing: 0;
        }
        .cm-shell {
          margin: 0 auto;
          padding-left: 14px;
          padding-right: 14px;
          padding-bottom: 90px;
        }
        .cm-card {
          background: #1a1226;
          border: 1px solid #2d1a44;
          border-radius: 16px;
          box-shadow: none;
        }
        .cm-header {
          position: relative;
          overflow: hidden;
        }
        .cm-header::before {
          content: '';
          position: absolute;
          top: -30px;
          right: -30px;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: #3d1f5c;
          opacity: 0.4;
        }
        .cm-kicker {
          color: #d7c8ff !important;
        }
        .cm-title {
          font-family: Lora, Georgia, serif;
          font-style: italic;
          color: #f5edff !important;
          text-shadow: 0 1px 0 rgba(0, 0, 0, 0.25);
        }
        .cm-plan-card {
          background: #200d30;
          border-color: rgba(124, 58, 237, 0.35);
        }
        .cm-input {
          background: #120d1e !important;
          border-color: rgba(124, 58, 237, 0.35) !important;
        }
        .cm-input::placeholder {
          color: rgba(255, 255, 255, 0.72);
        }
        .cm-metric-grid > .cm-card {
          min-height: 116px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .cm-response-card {
          min-height: 84px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          line-height: 1.4;
        }
        .cm-card .cm-title,
        .cm-card h2,
        .cm-card h3,
        .cm-card p {
          padding-left: 2px;
          overflow-wrap: anywhere;
        }
      `}</style>
    </div>
  );
}
