'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, ShieldCheck, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import ConversationGuidance from '@/components/messages/ConversationGuidance';
import ConnectionSafetyActions from '@/components/safety/ConnectionSafetyActions';
import { getSupabaseBrowserClient } from '../../../../utils/supabase/client';

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
};

type ParticipantRow = {
  user_id: string;
};

type ProfileRow = {
  id: string;
  email?: string | null;
  first_name?: string | null;
  profile_completeness?: number | null;
  is_verified?: boolean | null;
  relationship_intent?: string | null;
};

type OnboardingRow = {
  user_id: string;
  category: string;
  response: unknown;
};

type MatchRow = {
  id: string;
  matched_user_id: string;
  compatibility_reasons?: string[] | null;
  compatibility_score?: number | null;
  conversation_disabled?: boolean | null;
  conversation_disabled_reason?: string | null;
};

function firstNonEmpty(values: unknown[]): string {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return '';
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  });
}

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const router = useRouter();
  const conversationId = params.conversationId;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>('Match');
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compatibilityReasons, setCompatibilityReasons] = useState<string[]>([]);
  const [relationshipIntent, setRelationshipIntent] = useState<string>('');
  const [trustSignals, setTrustSignals] = useState<string[]>([]);
  const [potentialFit, setPotentialFit] = useState(false);
  const [messagingDisabledReason, setMessagingDisabledReason] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadThread = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push(`/auth/login?next=/messages/${conversationId}`);
          return;
        }

        if (!active) return;
        setCurrentUserId(user.id);

        const { data: participantRowsRaw, error: participantsError } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversationId);
        const participantRows = (participantRowsRaw ?? []) as ParticipantRow[];

        if (participantsError) {
          throw new Error(participantsError.message);
        }

        const participantIds = participantRows.map((row: ParticipantRow) => row.user_id);
        if (!participantIds.includes(user.id)) {
          throw new Error('You do not have access to this conversation.');
        }

        const otherId = participantIds.find((id: string) => id !== user.id) ?? null;
        setOtherUserId(otherId);

        if (otherId) {
          const [{ data: profile }, { data: demographics }, { data: matchRowRaw }, { data: blockRows }, { data: unmatchRows }] = await Promise.all([
            supabase
              .from('profiles')
              .select('id,email,first_name,profile_completeness,is_verified,relationship_intent')
              .eq('id', otherId)
              .maybeSingle(),
            supabase
              .from('onboarding_responses')
              .select('user_id,category,response')
              .eq('user_id', otherId)
              .eq('category', 'demographics')
              .maybeSingle(),
            supabase
              .from('matches')
              .select('*')
              .eq('user_id', user.id)
              .eq('matched_user_id', otherId)
              .eq('status', 'active')
              .maybeSingle(),
            supabase
              .from('blocks')
              .select('blocker_user_id,blocked_user_id')
              .or(
                `and(blocker_user_id.eq.${user.id},blocked_user_id.eq.${otherId}),and(blocker_user_id.eq.${otherId},blocked_user_id.eq.${user.id})`
              ),
            supabase
              .from('unmatches')
              .select('initiated_by_user_id,unmatched_user_id')
              .or(
                `and(initiated_by_user_id.eq.${user.id},unmatched_user_id.eq.${otherId}),and(initiated_by_user_id.eq.${otherId},unmatched_user_id.eq.${user.id})`
              ),
          ]);

          const profileTyped = (profile ?? null) as ProfileRow | null;
          const demographicsTyped = (demographics ?? null) as OnboardingRow | null;
          const matchRow = (matchRowRaw ?? null) as MatchRow | null;

          const response =
            demographicsTyped && typeof demographicsTyped.response === 'object' && demographicsTyped.response !== null
              ? (demographicsTyped.response as Record<string, unknown>)
              : {};

          const emailPrefix = typeof profileTyped?.email === 'string' ? profileTyped.email.split('@')[0] : '';
          const resolved =
            firstNonEmpty([
              response.fullName,
              response.full_name,
              response.firstName,
              response.first_name,
              response.name,
              profileTyped?.first_name,
              emailPrefix,
            ]) || 'Match';

          const reasons =
            Array.isArray(matchRow?.compatibility_reasons) && matchRow?.compatibility_reasons
              ? matchRow.compatibility_reasons.filter(item => typeof item === 'string').slice(0, 3)
              : [];

          const score = typeof matchRow?.compatibility_score === 'number' ? matchRow.compatibility_score : null;
          const blocked = (blockRows ?? []).length > 0;
          const unmatched = (unmatchRows ?? []).length > 0;
          const disabledFromMatch = Boolean(matchRow?.conversation_disabled);
          const disabledReason = firstNonEmpty([
            matchRow?.conversation_disabled_reason,
            blocked ? 'This user is blocked. Messaging is disabled.' : '',
            unmatched ? 'This connection was unmatched. Messaging is disabled.' : '',
            !matchRow ? 'No active match for this chat.' : '',
          ]);

          if (active) {
            setOtherUserName(resolved);
            setCompatibilityReasons(reasons);
            setRelationshipIntent(
              firstNonEmpty([profileTyped?.relationship_intent, (response as { relationshipIntent?: unknown }).relationshipIntent])
            );
            setPotentialFit(Boolean(score !== null && score >= 50 && score < 65));
            setMessagingDisabledReason(
              disabledFromMatch || blocked || unmatched || !matchRow ? disabledReason || 'Messaging is disabled.' : null
            );

            const profileCompleteness =
              typeof profileTyped?.profile_completeness === 'number'
                ? Math.round(profileTyped.profile_completeness * 100)
                : null;
            setTrustSignals([
              profileCompleteness !== null ? `Profile completeness ${profileCompleteness}%` : 'Profile completeness updating',
              profileTyped?.is_verified ? 'Verified profile' : 'Verification pending',
              `Intent: ${firstNonEmpty([profileTyped?.relationship_intent]) || 'Not shared yet'}`,
            ]);
          }
        }

        const { data: messageRowsRaw, error: messagesError } = await supabase
          .from('messages')
          .select('id,conversation_id,sender_user_id,body,created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
        const messageRows = (messageRowsRaw ?? []) as MessageRow[];

        if (messagesError) {
          throw new Error(messagesError.message);
        }

        if (active) {
          setMessages(messageRows);
          setLoading(false);
        }
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : 'Failed to load conversation';
        setError(message);
        setLoading(false);
      }
    };

    void loadThread();

    return () => {
      active = false;
    };
  }, [conversationId, router]);

  const groupedMessages = useMemo(() => messages, [messages]);

  const appendEmoji = (emoji: string) => {
    setInput(prev => `${prev}${emoji}`);
  };

  const insertGuidancePrompt = (message: string) => {
    setInput(prev => {
      if (!prev.trim()) return message;
      return `${prev.trim()} ${message}`;
    });
  };

  const onSend = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUserId || !input.trim() || sending || Boolean(messagingDisabledReason)) return;

    setSending(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const body = input.trim();

      const { data: insertedRaw, error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_user_id: currentUserId,
          body,
        })
        .select('id,conversation_id,sender_user_id,body,created_at')
        .single();
      const inserted = (insertedRaw ?? null) as MessageRow | null;

      if (insertError || !inserted) {
        throw new Error(insertError?.message ?? 'Failed to send message');
      }

      setMessages(prev => [...prev, inserted]);
      setInput('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-6 text-[#111111]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-100"
        style={{
          background: 'transparent',
        }}
      />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-4">
        <header className="border-b border-[#E5E3DF] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/matches"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#DDD9D1] bg-white px-3 py-1.5 text-sm text-[#4B3FA0] hover:bg-[#F4F3FF]"
            >
              <ArrowLeft size={14} />
              Back to matches
            </Link>
            <h1 className="text-sm font-medium text-[#111111] sm:text-base">Chat with {otherUserName}</h1>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {trustSignals.map(signal => (
              <span
                key={signal}
                className="rounded-[4px] border border-[#E2D8B8] bg-[#FFF8EC] px-2.5 py-1 text-[11px] text-[#A05A00]"
              >
                {signal}
              </span>
            ))}
            {potentialFit ? (
              <span className="rounded-[4px] border border-[#DDD8FA] bg-[#EDE9FA] px-2.5 py-1 text-[11px] font-medium text-[#4B3FA0]">
                Potential Fit
              </span>
            ) : null}
          </div>
        </header>

        <section className="flex min-h-[60vh] flex-col rounded-2xl border border-[#E5E3DF] bg-white">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {loading ? <p className="text-sm text-[#777777]">Loading conversation...</p> : null}
            {!loading && groupedMessages.length === 0 ? (
              <p className="text-sm text-[#777777]">No messages yet. Say hi and start the conversation.</p>
            ) : null}
            {!loading
              ? groupedMessages.map(message => {
                  const mine = message.sender_user_id === currentUserId;
                  return (
                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl border px-3 py-2 text-sm leading-6 sm:max-w-[70%] ${
                          mine
                            ? 'rounded-br-[4px] border-[#4B3FA0] bg-[#4B3FA0] text-white'
                            : 'rounded-bl-[4px] border-[#E5E3DF] bg-[#F0EEE8] text-[#111111]'
                        }`}
                      >
                        <p>{message.body}</p>
                        <p className="mt-1 text-[11px] text-[#AAAAAA]">
                          {formatTimestamp(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              : null}
          </div>

          <form onSubmit={onSend} className="border-t border-[#E5E3DF] p-3">
            {otherUserId ? (
              <div className="mb-3">
                <ConnectionSafetyActions targetUserId={otherUserId} compact />
              </div>
            ) : null}

            <div className="mb-3">
              <ConversationGuidance
                onPick={insertGuidancePrompt}
                compatibilityReasons={compatibilityReasons}
                relationshipIntent={relationshipIntent}
              />
            </div>

            {showEmojiPicker ? (
              <div className="mb-3 rounded-xl border border-[#E5E3DF] bg-white p-2">
                <EmojiPicker
                  width="100%"
                  height={340}
                  lazyLoadEmojis
                  searchPlaceHolder="Search emoji"
                  onEmojiClick={emojiData => appendEmoji(emojiData.emoji)}
                />
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(prev => !prev)}
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${
                  showEmojiPicker
                    ? 'border-[#4B3FA0] bg-[#F4F3FF] text-[#4B3FA0]'
                    : 'border-[#E5E3DF] bg-[#F7F6F4] text-[#777777] hover:border-[#4B3FA0] hover:text-[#4B3FA0]'
                }`}
                aria-label="Toggle emoji picker"
              >
                <Smile size={18} />
              </button>
              <input
                value={input}
                onChange={event => setInput(event.target.value)}
                placeholder="Type your message..."
                disabled={Boolean(messagingDisabledReason)}
                className="h-11 flex-1 rounded-[24px] border border-[#E5E3DF] bg-[#F7F6F4] px-3 text-sm text-[#111111] outline-none transition focus:border-[#4B3FA0] disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending || loading || Boolean(messagingDisabledReason)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#DDD8FA] bg-white px-4 text-sm font-medium text-[#4B3FA0] hover:bg-[#F4F3FF] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={15} />
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
            {messagingDisabledReason ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-[#A05A00]">
                <ShieldCheck size={12} />
                {messagingDisabledReason}
              </p>
            ) : null}
            {error ? <p className="mt-2 text-xs text-[#CC3333]">{error}</p> : null}
          </form>
        </section>
      </div>
    </main>
  );
}
