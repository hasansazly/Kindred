'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Ban, UserX } from 'lucide-react';

type ActionKind = 'report' | 'block' | 'unmatch';

export default function ConnectionSafetyActions({
  targetUserId,
  compact = false,
  onActionComplete,
}: {
  targetUserId: string;
  compact?: boolean;
  onActionComplete?: (kind: ActionKind) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<ActionKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAction = async (kind: ActionKind) => {
    if (loading) return;
    setError(null);

    if (kind === 'block') {
      const ok = window.confirm('Block this user? This will hide matches and disable messaging both ways.');
      if (!ok) return;
    }

    if (kind === 'unmatch') {
      const ok = window.confirm('Unmatch this user? This will close this connection and disable messaging.');
      if (!ok) return;
    }

    const reason =
      kind === 'report'
        ? window.prompt('Reason for report (required):', 'inappropriate behavior')?.trim() ?? ''
        : kind;

    if (kind === 'report' && !reason) {
      setError('Report reason is required.');
      return;
    }

    setLoading(kind);

    try {
      const res = await fetch(`/api/safety/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          reason,
          details: kind === 'report' ? { source: 'ui', page: window.location.pathname } : undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : `Failed to ${kind} user`);
      }

      onActionComplete?.(kind);
      router.refresh();

      if (kind === 'block' || kind === 'unmatch') {
        router.push('/matches');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${kind} user`);
      setLoading(null);
      return;
    }

    setLoading(null);
  };

  return (
    <div className="space-y-2">
      <div className={`flex flex-wrap gap-2 ${compact ? '' : 'pt-1'}`}>
        <button
          type="button"
          onClick={() => runAction('report')}
          disabled={Boolean(loading)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#5A3042] bg-[#2A1620] px-3 py-1.5 text-xs font-medium text-[#FF8A8A] hover:border-[#7B3B53] hover:bg-[#351C29] disabled:opacity-60"
        >
          <AlertTriangle size={14} />
          {loading === 'report' ? 'Reporting...' : 'Report user'}
        </button>

        <button
          type="button"
          onClick={() => runAction('unmatch')}
          disabled={Boolean(loading)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#36416D] bg-[#151C3C] px-3 py-1.5 text-xs font-medium text-[#D1D8F7] hover:border-[#5966A4] hover:text-white disabled:opacity-60"
        >
          <UserX size={14} />
          {loading === 'unmatch' ? 'Unmatching...' : 'Unmatch'}
        </button>

        <button
          type="button"
          onClick={() => runAction('block')}
          disabled={Boolean(loading)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#36416D] bg-[#151C3C] px-3 py-1.5 text-xs font-medium text-[#D1D8F7] hover:border-[#5966A4] hover:text-white disabled:opacity-60"
        >
          <Ban size={14} />
          {loading === 'block' ? 'Blocking...' : 'Block user'}
        </button>
      </div>
      {error ? <p className="text-xs text-[#FF8A8A]">{error}</p> : null}
    </div>
  );
}
