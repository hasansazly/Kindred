'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flame } from 'lucide-react';
import { CONVERSATION_BUTTON_COPY } from '@/lib/conversationSupportCopy';

type GuidanceKind = 'startEasy' | 'goDeeper' | 'suggestPlan';

export default function ConversationGuidance({
  onPick,
  conversationId,
  compatibilityReasons,
  relationshipIntent,
}: {
  onPick: (message: string) => void;
  conversationId: string;
  compatibilityReasons: string[];
  relationshipIntent?: string;
}) {
  const [groups, setGroups] = useState<Record<GuidanceKind, string[]>>({
    startEasy: [],
    goDeeper: [],
    suggestPlan: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/messages/spark-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            compatibilityReasons,
            relationshipIntent,
          }),
        });

        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error || 'Failed to load AI suggestions');
        }
        const json = (await res.json()) as {
          suggestions?: Partial<Record<GuidanceKind, string[]>>;
        };

        const nextGroups: Record<GuidanceKind, string[]> = {
          startEasy: (json.suggestions?.startEasy ?? []).slice(0, 3),
          goDeeper: (json.suggestions?.goDeeper ?? []).slice(0, 3),
          suggestPlan: (json.suggestions?.suggestPlan ?? []).slice(0, 3),
        };

        if (active) {
          setGroups(nextGroups);
        }
      } catch (e) {
        if (active) {
          setGroups({ startEasy: [], goDeeper: [], suggestPlan: [] });
          setError(e instanceof Error ? e.message : 'AI suggestions unavailable');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [conversationId, compatibilityReasons, relationshipIntent]);

  const categoryTitles: Record<GuidanceKind, string> = {
    startEasy: CONVERSATION_BUTTON_COPY.startEasy.label,
    goDeeper: CONVERSATION_BUTTON_COPY.goDeeper.label,
    suggestPlan: CONVERSATION_BUTTON_COPY.suggestPlan.label,
  };

  return (
    <section className="rounded-xl border border-white/10 bg-[#1A1624] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.06em] text-white/50">
        <Flame size={14} />
        Spark prompts
      </div>
      <p className="mb-2 text-xs text-white/60">
        {loading
          ? 'Generating context-aware suggestions...'
          : error
            ? 'AI suggestions are unavailable right now.'
            : 'AI suggestions are based on your recent conversation.'}
      </p>
      {error ? <p className="mb-2 text-xs text-amber-300">{error}</p> : null}
      <div className="space-y-2">
        {(Object.keys(groups) as GuidanceKind[]).map(kind => (
          <div key={kind} className="rounded-xl border border-white/10 bg-[#151220] p-2.5">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-white/40">{categoryTitles[kind]}</p>
            <div className="flex flex-wrap gap-2">
              {groups[kind].map(prompt => {
                return (
                  <button
                    key={`${kind}-${prompt}`}
                    type="button"
                    onClick={() => onPick(prompt)}
                    className="rounded-[20px] border border-white/15 bg-[#252030] px-3 py-1.5 text-xs text-white/80 hover:border-[#A855F7] hover:bg-[#2B243C]"
                    title="Insert into message"
                  >
                    {prompt.length > 56 ? `${prompt.slice(0, 56)}...` : prompt}
                  </button>
                );
              })}
              {!loading && groups[kind].length === 0 ? (
                <span className="text-xs text-white/45">No AI suggestions available.</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
