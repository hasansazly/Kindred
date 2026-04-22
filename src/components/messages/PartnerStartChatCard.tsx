'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PartnerStartChatCard({
  partnerUserId,
  partnerName,
}: {
  partnerUserId: string;
  partnerName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startChat = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/messages/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ matchUserId: partnerUserId }),
      });
      if (response.status === 401) {
        router.push('/auth/login?next=/messages');
        return;
      }
      const payload = (await response.json().catch(() => ({}))) as { error?: string; conversationId?: string };
      if (!response.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Unable to open chat');
      }
      if (!payload.conversationId || typeof payload.conversationId !== 'string') {
        throw new Error('Conversation id not returned');
      }
      router.push(`/messages/${payload.conversationId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to open chat';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5">
      <button
        type="button"
        onClick={startChat}
        disabled={loading}
        className="flex w-full items-center justify-between rounded-xl border border-[#7C3AED55] bg-[#120D1E] px-4 py-4 text-left transition hover:bg-[#181127] disabled:opacity-60"
      >
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#DB2777] text-base font-semibold text-white">
            {partnerName.slice(0, 1).toUpperCase()}
          </span>
          <span>
            <span className="block text-base font-medium text-white">{partnerName}</span>
            <span className="mt-1 block text-sm text-white/75">
              {loading ? `Opening chat with ${partnerName}...` : `Start to chat with ${partnerName}`}
            </span>
          </span>
        </span>
        <span className="text-xs text-[#C084FC]">{loading ? 'Opening...' : 'Open chat'}</span>
      </button>
      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
