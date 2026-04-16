'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
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
};

type OnboardingRow = {
  user_id: string;
  category: string;
  response: unknown;
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
  const [, setOtherUserId] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>('Match');
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          .eq('conversation_id', conversationId)
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
          const [{ data: profile }, { data: demographics }] = await Promise.all([
            supabase
              .from('profiles')
              .select('id,email,first_name')
              .eq('id', otherId)
              .maybeSingle(),
            supabase
              .from('onboarding_responses')
              .select('user_id,category,response')
              .eq('user_id', otherId)
              .eq('category', 'demographics')
              .maybeSingle(),
          ]);
          const profileTyped = (profile ?? null) as ProfileRow | null;
          const demographicsTyped = (demographics ?? null) as OnboardingRow | null;

          const response =
            demographicsTyped &&
            typeof demographicsTyped.response === 'object' &&
            demographicsTyped.response !== null
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

          if (active) {
            setOtherUserName(resolved);
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

  const onSend = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUserId || !input.trim() || sending) return;

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
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(1200px 700px at -10% -10%, rgba(168,85,247,0.18), transparent 55%), radial-gradient(1100px 700px at 110% 0%, rgba(236,72,153,0.14), transparent 55%), radial-gradient(900px 500px at 50% 120%, rgba(59,130,246,0.14), transparent 60%)',
        }}
      />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-4">
        <header className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/matches"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-sm text-slate-300 hover:border-violet-400/40 hover:text-violet-200"
            >
              <ArrowLeft size={14} />
              Back to matches
            </Link>
            <h1 className="text-sm font-medium text-slate-200 sm:text-base">Chat with {otherUserName}</h1>
          </div>
        </header>

        <section className="flex min-h-[60vh] flex-col rounded-2xl border border-slate-700/80 bg-slate-900/65 backdrop-blur">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {loading ? <p className="text-sm text-slate-400">Loading conversation...</p> : null}
            {!loading && groupedMessages.length === 0 ? (
              <p className="text-sm text-slate-400">No messages yet. Say hi and start the conversation.</p>
            ) : null}
            {!loading
              ? groupedMessages.map(message => {
                  const mine = message.sender_user_id === currentUserId;
                  return (
                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl border px-3 py-2 text-sm leading-6 sm:max-w-[70%] ${
                          mine
                            ? 'border-violet-400/30 bg-gradient-to-r from-violet-500/25 to-fuchsia-500/20 text-violet-100'
                            : 'border-slate-700/70 bg-slate-800/70 text-slate-200'
                        }`}
                      >
                        <p>{message.body}</p>
                        <p className={`mt-1 text-[11px] ${mine ? 'text-violet-200/85' : 'text-slate-400'}`}>
                          {formatTimestamp(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              : null}
          </div>

          <form onSubmit={onSend} className="border-t border-slate-700/80 p-3">
            {showEmojiPicker ? (
              <div className="mb-3 rounded-xl border border-slate-700/80 bg-slate-900/85 p-2">
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
                    ? 'border-violet-400/45 bg-violet-500/20 text-violet-100'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-violet-400/35 hover:text-violet-100'
                }`}
                aria-label="Toggle emoji picker"
              >
                <Smile size={18} />
              </button>
              <input
                value={input}
                onChange={event => setInput(event.target.value)}
                placeholder="Type your message..."
                className="h-11 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none transition focus:border-violet-400/50"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending || loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-violet-400/35 bg-gradient-to-r from-violet-500/30 to-fuchsia-500/25 px-4 text-sm font-semibold text-violet-100 hover:from-violet-500/45 hover:to-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={15} />
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
            {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
          </form>
        </section>
      </div>
    </main>
  );
}
