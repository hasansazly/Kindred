'use client';

import { Lightbulb } from 'lucide-react';
import { CONVERSATION_BUTTON_COPY, CONVERSATION_PROMPTS } from '@/lib/conversationSupportCopy';

type GuidanceKind = 'startEasy' | 'goDeeper' | 'suggestPlan';

function withContext(prompt: string, context: { reason?: string; intent?: string }) {
  if (prompt.includes('[interest]') && context.reason) {
    return prompt.replace('[interest]', context.reason);
  }

  if (!context.intent) return prompt;

  if (prompt.toLowerCase().includes('what are you looking for')) {
    return `${prompt} I noticed your intent says ${context.intent}.`;
  }

  return prompt;
}

export default function ConversationGuidance({
  onPick,
  compatibilityReasons,
  relationshipIntent,
}: {
  onPick: (message: string) => void;
  compatibilityReasons: string[];
  relationshipIntent?: string;
}) {
  const primaryReason = compatibilityReasons[0] ?? 'shared priorities';

  const groups: Record<GuidanceKind, string[]> = {
    startEasy: CONVERSATION_PROMPTS.opening.thoughtful.slice(0, 3),
    goDeeper: CONVERSATION_PROMPTS.substance.direct.slice(0, 3),
    suggestPlan: CONVERSATION_PROMPTS.plan.playful.slice(0, 3),
  };

  const categoryTitles: Record<GuidanceKind, string> = {
    startEasy: CONVERSATION_BUTTON_COPY.startEasy.label,
    goDeeper: CONVERSATION_BUTTON_COPY.goDeeper.label,
    suggestPlan: CONVERSATION_BUTTON_COPY.suggestPlan.label,
  };

  return (
    <section className="rounded-xl border border-[#36416D] bg-[#101735] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.06em] text-[#A6AED0]">
        <Lightbulb size={14} />
        Conversation guidance
      </div>
      <div className="space-y-2">
        {(Object.keys(groups) as GuidanceKind[]).map(kind => (
          <div key={kind} className="rounded-xl border border-[#36416D] bg-[#151C3C] p-2.5">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[#A6AED0]">{categoryTitles[kind]}</p>
            <div className="flex flex-wrap gap-2">
              {groups[kind].map(prompt => {
                const text = withContext(prompt, {
                  reason: primaryReason,
                  intent: relationshipIntent,
                });
                return (
                  <button
                    key={`${kind}-${prompt}`}
                    type="button"
                    onClick={() => onPick(text)}
                    className="rounded-[20px] border border-[#4E5A92] bg-[#1B2550] px-3 py-1.5 text-xs text-[#D8E1FF] hover:border-[#6C62E8] hover:bg-[#242E63]"
                    title="Insert into message"
                  >
                    {text.length > 56 ? `${text.slice(0, 56)}...` : text}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
