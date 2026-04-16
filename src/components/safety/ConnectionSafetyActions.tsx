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
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8D7D7] bg-transparent px-3 py-1.5 text-xs font-medium text-[#CC3333] hover:bg-[#FDF4F4] disabled:opacity-60"
        >
          <AlertTriangle size={14} />
          {loading === 'report' ? 'Reporting...' : 'Report user'}
        </button>

        <button
          type="button"
          onClick={() => runAction('unmatch')}
          disabled={Boolean(loading)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E3DF] bg-transparent px-3 py-1.5 text-xs font-medium text-[#888888] hover:bg-[#F7F6F4] disabled:opacity-60"
        >
          <UserX size={14} />
          {loading === 'unmatch' ? 'Unmatching...' : 'Unmatch'}
        </button>

        <button
          type="button"
          onClick={() => runAction('block')}
          disabled={Boolean(loading)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E3DF] bg-transparent px-3 py-1.5 text-xs font-medium text-[#888888] hover:bg-[#F7F6F4] disabled:opacity-60"
        >
          <Ban size={14} />
          {loading === 'block' ? 'Blocking...' : 'Block user'}
        </button>
      </div>
      {error ? <p className="text-xs text-[#CC3333]">{error}</p> : null}
    </div>
  );
}
