'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, ShieldCheck, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import ConversationGuidance from '@/components/messages/ConversationGuidance';
import ConnectionSafetyActions from '@/components/safety/ConnectionSafetyActions';
import ConnectionTrackPanel from '@/components/connection-track/ConnectionTrackPanel';
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
    <main className="min-h-screen bg-[#060814] px-4 py-6 text-[#F3F5FF]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(1100px 540px at 14% -8%, rgba(124,58,237,0.25), transparent 58%), radial-gradient(980px 520px at 92% -2%, rgba(236,72,153,0.2), transparent 55%), radial-gradient(820px 460px at 50% 110%, rgba(59,130,246,0.17), transparent 60%)',
        }}
      />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-4">
        <header className="rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 p-4 shadow-[0_24px_80px_rgba(5,10,30,0.6)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/matches"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#3A4270] bg-[#101735] px-3 py-1.5 text-sm text-[#D4D9F4] transition hover:border-[#6B5CE7] hover:text-[#FFFFFF]"
            >
              <ArrowLeft size={14} />
              Back to matches
            </Link>
            <h1 className="text-sm font-medium text-[#F8F9FF] sm:text-base">Chat with {otherUserName}</h1>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {trustSignals.map(signal => (
              <span
                key={signal}
                className="rounded-[4px] border border-[#5A4DB7] bg-[#1B1740] px-2.5 py-1 text-[11px] text-[#C8BCFF]"
              >
                {signal}
              </span>
            ))}
            {potentialFit ? (
              <span className="rounded-[4px] border border-[#8B6A2E]/55 bg-[#2A2112] px-2.5 py-1 text-[11px] font-medium text-[#F4C977]">
                Potential Fit
              </span>
            ) : null}
          </div>
        </header>

        <section className="flex min-h-[60vh] flex-col rounded-2xl border border-[#2A3158] bg-[#0B1024]/90 shadow-[0_24px_80px_rgba(5,10,30,0.6)] backdrop-blur">
          <div className="border-b border-[#2F3760] p-3">
            <ConnectionTrackPanel conversationId={conversationId} />
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {loading ? <p className="text-sm text-[#A9B0D0]">Loading conversation...</p> : null}
            {!loading && groupedMessages.length === 0 ? (
              <p className="text-sm text-[#A9B0D0]">No messages yet. Say hi and start the conversation.</p>
            ) : null}
            {!loading
              ? groupedMessages.map(message => {
                  const mine = message.sender_user_id === currentUserId;
                  return (
                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl border px-3 py-2 text-sm leading-6 shadow-[0_8px_24px_rgba(8,12,30,0.35)] sm:max-w-[70%] ${
                          mine
                            ? 'rounded-br-[4px] border-[#7E62F2]/55 bg-gradient-to-r from-[#4D5FE6] via-[#7E46DB] to-[#D02E8B] text-white'
                            : 'rounded-bl-[4px] border-[#36416D] bg-[#151C3C] text-[#E8EBFF]'
                        }`}
                      >
                        <p>{message.body}</p>
                        <p className="mt-1 text-[11px] text-[#B7BEDD]">
                          {formatTimestamp(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              : null}
          </div>

          <form onSubmit={onSend} className="border-t border-[#2F3760] p-3">
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
              <div className="mb-3 rounded-xl border border-[#36416D] bg-[#11193A] p-2">
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
                    ? 'border-[#6B5CE7] bg-[#1B1740] text-[#CFC6FF]'
                    : 'border-[#36416D] bg-[#151C3C] text-[#A9B0D0] hover:border-[#6B5CE7] hover:text-[#FFFFFF]'
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
                className="h-11 flex-1 rounded-[24px] border border-[#36416D] bg-[#151C3C] px-3 text-sm text-[#F7F8FF] outline-none transition focus:border-[#6B5CE7] disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending || loading || Boolean(messagingDisabledReason)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#7E62F2]/60 bg-gradient-to-r from-[#4D5FE6] via-[#7E46DB] to-[#D02E8B] px-4 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={15} />
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
            {messagingDisabledReason ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-[#F4C977]">
                <ShieldCheck size={12} />
                {messagingDisabledReason}
              </p>
            ) : null}
            {error ? <p className="mt-2 text-xs text-[#FF8A8A]">{error}</p> : null}
          </form>
        </section>
      </div>
    </main>
  );
}
