'use client';

import { useMemo, useState } from 'react';

type Feeling = 'Spark' | 'Friendly' | 'Not quite';

type ReflectionData = {
  feeling: string;
  note: string | null;
  submitted_at: string;
};

type Props = {
  reflectionDueAt: string | null;
  dueNow: boolean;
  alreadySubmitted: boolean;
  submittedReflection: ReflectionData | null;
  onSubmit: (payload: { feeling: Feeling; note: string }) => Promise<void>;
  busy?: boolean;
};

const OPTIONS: Feeling[] = ['Spark', 'Friendly', 'Not quite'];

export default function IRLPostDateReflection({
  reflectionDueAt,
  dueNow,
  alreadySubmitted,
  submittedReflection,
  onSubmit,
  busy = false,
}: Props) {
  const [feeling, setFeeling] = useState<Feeling>('Friendly');
  const [note, setNote] = useState('');

  const dueLabel = useMemo(() => {
    if (!reflectionDueAt) return null;
    const date = new Date(reflectionDueAt);
    if (!Number.isFinite(date.getTime())) return null;
    return date.toLocaleString();
  }, [reflectionDueAt]);

  if (alreadySubmitted && submittedReflection) {
    return (
      <section className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-4">
        <h4 className="text-sm font-semibold text-emerald-100">Post-date reflection submitted</h4>
        <p className="mt-1 text-sm text-emerald-200">Feeling: {submittedReflection.feeling}</p>
        {submittedReflection.note ? <p className="mt-1 text-sm text-emerald-100">Note: {submittedReflection.note}</p> : null}
      </section>
    );
  }

  if (!dueNow) {
    return (
      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4">
        <h4 className="text-sm font-semibold text-slate-100">Post-date reflection</h4>
        <p className="mt-1 text-sm text-slate-400">
          This opens 24 hours after both intention checks are submitted.
          {dueLabel ? ` Expected: ${dueLabel}.` : ''}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4">
      <h4 className="text-sm font-semibold text-slate-100">How did it feel?</h4>

      <div className="mt-3 flex flex-wrap gap-2">
        {OPTIONS.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => setFeeling(option)}
            className={`rounded-full border px-3 py-1.5 text-xs ${
              feeling === option
                ? 'border-violet-300 bg-violet-500/20 text-violet-100'
                : 'border-slate-600/80 bg-slate-800/70 text-slate-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <textarea
        value={note}
        onChange={event => setNote(event.target.value)}
        className="mt-3 min-h-[82px] w-full rounded-lg border border-slate-600/80 bg-slate-800/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-400"
        placeholder="Optional note"
      />

      <button
        type="button"
        onClick={() => void onSubmit({ feeling, note: note.trim() })}
        disabled={busy}
        className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? 'Submitting...' : 'Submit reflection'}
      </button>
    </section>
  );
}
