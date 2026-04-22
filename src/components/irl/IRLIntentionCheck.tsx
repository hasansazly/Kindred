'use client';

import { useMemo, useState } from 'react';

type Answers = {
  hopingFor: string;
  nerves: string;
  curiousAbout: string;
};

type Props = {
  viewerUserId: string;
  participantUserIds: string[];
  submittedUserIds: string[];
  bothReady: boolean;
  bothSubmitted: boolean;
  answersVisible: boolean;
  answersByUser: Record<string, Record<string, unknown>> | null;
  onSubmit: (answers: Answers) => Promise<void>;
  busy?: boolean;
};

function answerValue(record: Record<string, unknown> | undefined, key: keyof Answers) {
  const value = record?.[key];
  return typeof value === 'string' ? value : '';
}

export default function IRLIntentionCheck({
  viewerUserId,
  participantUserIds,
  submittedUserIds,
  bothReady,
  bothSubmitted,
  answersVisible,
  answersByUser,
  onSubmit,
  busy = false,
}: Props) {
  const [hopingFor, setHopingFor] = useState('');
  const [nerves, setNerves] = useState('');
  const [curiousAbout, setCuriousAbout] = useState('');

  const isViewerSubmitted = submittedUserIds.includes(viewerUserId);
  const partnerUserId = useMemo(
    () => participantUserIds.find(userId => userId !== viewerUserId) ?? null,
    [participantUserIds, viewerUserId]
  );

  const canSubmit = hopingFor.trim() && nerves.trim() && curiousAbout.trim();

  if (!bothReady) {
    return (
      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4">
        <h4 className="text-sm font-semibold text-slate-100">Pre-date intention check</h4>
        <p className="mt-1 text-sm text-slate-400">Unlocks when both people tap ready.</p>
      </section>
    );
  }

  if (bothSubmitted && answersVisible && answersByUser) {
    const myAnswers = answersByUser[viewerUserId] ?? {};
    const partnerAnswers = (partnerUserId ? answersByUser[partnerUserId] : {}) ?? {};

    return (
      <section className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-4">
        <h4 className="text-sm font-semibold text-emerald-100">Intention check complete</h4>
        <p className="mt-1 text-xs text-emerald-200">Answers unlocked for both at the same time.</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <article className="rounded-xl border border-emerald-400/35 bg-slate-900/45 p-3">
            <p className="text-xs uppercase tracking-[0.06em] text-emerald-200">You</p>
            <p className="mt-1 text-sm text-slate-100">Hoping for: {answerValue(myAnswers, 'hopingFor')}</p>
            <p className="mt-1 text-sm text-slate-100">Nerves: {answerValue(myAnswers, 'nerves')}</p>
            <p className="mt-1 text-sm text-slate-100">Curious: {answerValue(myAnswers, 'curiousAbout')}</p>
          </article>

          <article className="rounded-xl border border-emerald-400/35 bg-slate-900/45 p-3">
            <p className="text-xs uppercase tracking-[0.06em] text-emerald-200">Your match</p>
            <p className="mt-1 text-sm text-slate-100">Hoping for: {answerValue(partnerAnswers, 'hopingFor')}</p>
            <p className="mt-1 text-sm text-slate-100">Nerves: {answerValue(partnerAnswers, 'nerves')}</p>
            <p className="mt-1 text-sm text-slate-100">Curious: {answerValue(partnerAnswers, 'curiousAbout')}</p>
          </article>
        </div>
      </section>
    );
  }

  if (isViewerSubmitted) {
    return (
      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4">
        <h4 className="text-sm font-semibold text-slate-100">Pre-date intention check</h4>
        <p className="mt-1 text-sm text-slate-300">You submitted. Waiting for your match so answers reveal together.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4">
      <h4 className="text-sm font-semibold text-slate-100">Pre-date intention check</h4>
      <p className="mt-1 text-sm text-slate-300">Answer honestly. Both sets unlock only after both submit.</p>

      <form
        className="mt-3 space-y-3"
        onSubmit={event => {
          event.preventDefault();
          if (!canSubmit || busy) return;
          void onSubmit({
            hopingFor: hopingFor.trim(),
            nerves: nerves.trim(),
            curiousAbout: curiousAbout.trim(),
          });
        }}
      >
        <textarea
          value={hopingFor}
          onChange={event => setHopingFor(event.target.value)}
          className="min-h-[72px] w-full rounded-lg border border-slate-600/80 bg-slate-800/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-400"
          placeholder="What are you hoping for?"
        />
        <textarea
          value={nerves}
          onChange={event => setNerves(event.target.value)}
          className="min-h-[72px] w-full rounded-lg border border-slate-600/80 bg-slate-800/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-400"
          placeholder="Any nerves?"
        />
        <textarea
          value={curiousAbout}
          onChange={event => setCuriousAbout(event.target.value)}
          className="min-h-[72px] w-full rounded-lg border border-slate-600/80 bg-slate-800/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-400"
          placeholder="One thing you're curious about?"
        />

        <button
          type="submit"
          disabled={!canSubmit || busy}
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? 'Submitting...' : 'Submit intention check'}
        </button>
      </form>
    </section>
  );
}
