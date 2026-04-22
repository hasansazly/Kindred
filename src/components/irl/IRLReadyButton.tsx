'use client';

type Props = {
  viewerUserId: string;
  participantUserIds: string[];
  readyUserIds: string[];
  onReady: () => Promise<void>;
  busy?: boolean;
};

export default function IRLReadyButton({ viewerUserId, participantUserIds, readyUserIds, onReady, busy = false }: Props) {
  const readySet = new Set(readyUserIds);
  const isViewerReady = readySet.has(viewerUserId);
  const bothReady = participantUserIds.every(userId => readySet.has(userId));

  if (bothReady) {
    return (
      <div className="rounded-2xl border border-emerald-400/45 bg-emerald-500/10 p-4">
        <p className="text-xs uppercase tracking-[0.06em] text-emerald-200">IRL confirmed</p>
        <p className="mt-1 text-sm text-emerald-100">Both of you are ready to meet this week.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4">
      <p className="text-xs uppercase tracking-[0.06em] text-violet-200">IRL Date Track</p>
      <p className="mt-1 text-sm text-slate-200">Tap when you feel ready to meet in person this week.</p>

      <button
        type="button"
        onClick={() => void onReady()}
        disabled={busy || isViewerReady}
        className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? 'Saving...' : isViewerReady ? "You're ready" : "I'm Ready to Meet This Week"}
      </button>

      <p className="mt-2 text-xs text-slate-400">
        {isViewerReady ? 'Pending: waiting for your match to confirm.' : 'Once both confirm, intention check unlocks.'}
      </p>
    </div>
  );
}
