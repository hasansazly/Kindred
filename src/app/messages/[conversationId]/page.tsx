'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ImagePlus, Send, ShieldCheck, Smile, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import ConversationGuidance from '@/components/messages/ConversationGuidance';
import ConnectionSafetyActions from '@/components/safety/ConnectionSafetyActions';
import ConnectionTrackPanel from '@/components/connection-track/ConnectionTrackPanel';
import { getSupabaseBrowserClient } from '../../../../utils/supabase/client';

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string | null;
  message_type: 'text' | 'image';
  media_url: string | null;
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compatibilityReasons, setCompatibilityReasons] = useState<string[]>([]);
  const [relationshipIntent, setRelationshipIntent] = useState<string>('');
  const [trustSignals, setTrustSignals] = useState<string[]>([]);
  const [potentialFit, setPotentialFit] = useState(false);
  const [messagingDisabledReason, setMessagingDisabledReason] = useState<string | null>(null);
  const [couplePartnerId, setCouplePartnerId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

        const modeResponse = await fetch('/api/couples/mode', { method: 'GET' });
        const modePayload = await modeResponse.json().catch(() => ({} as Record<string, unknown>));
        const lockToPartner = Boolean(modeResponse.ok && (modePayload as { selfEnabled?: boolean }).selfEnabled);
        const partnerId =
          typeof (modePayload as { partnerUserId?: unknown }).partnerUserId === 'string'
            ? ((modePayload as { partnerUserId?: string }).partnerUserId ?? null)
            : null;
        setCouplePartnerId(partnerId);

        if (lockToPartner && partnerId && otherId && otherId !== partnerId) {
          router.push('/messages');
          return;
        }

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
          .select('id,conversation_id,sender_user_id,body,message_type,media_url,created_at')
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
    if (!currentUserId || sending || uploadingImage || Boolean(messagingDisabledReason)) return;
    if (!input.trim() && !selectedImage) return;

    setSending(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      let payload: {
        conversation_id: string;
        sender_user_id: string;
        body: string | null;
        message_type: 'text' | 'image';
        media_url: string | null;
      };

      if (selectedImage) {
        if (!selectedImage.type.startsWith('image/')) {
          throw new Error('Only image files are allowed.');
        }
        if (selectedImage.size > 10 * 1024 * 1024) {
          throw new Error('Image must be 10MB or smaller.');
        }

        setUploadingImage(true);
        const ext = selectedImage.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `messages/${conversationId}/${currentUserId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('message-photos')
          .upload(path, selectedImage, {
            upsert: false,
            contentType: selectedImage.type || 'image/jpeg',
            cacheControl: '3600',
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: publicData } = supabase.storage.from('message-photos').getPublicUrl(path);
        payload = {
          conversation_id: conversationId,
          sender_user_id: currentUserId,
          body: null,
          message_type: 'image',
          media_url: publicData.publicUrl,
        };
      } else {
        payload = {
          conversation_id: conversationId,
          sender_user_id: currentUserId,
          body: input.trim(),
          message_type: 'text',
          media_url: null,
        };
      }

      const { data: insertedRaw, error: insertError } = await supabase
        .from('messages')
        .insert(payload)
        .select('id,conversation_id,sender_user_id,body,message_type,media_url,created_at')
        .single();
      const inserted = (insertedRaw ?? null) as MessageRow | null;

      if (insertError || !inserted) {
        throw new Error(insertError?.message ?? 'Failed to send message');
      }

      setMessages(prev => [...prev, inserted]);
      setInput('');
      setSelectedImage(null);
      setSelectedImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
    } finally {
      setUploadingImage(false);
      setSending(false);
    }
  };

  const onPickImage = (file: File | null) => {
    if (!file) return;
    setSelectedImage(file);
    const nextUrl = URL.createObjectURL(file);
    setSelectedImagePreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return nextUrl;
    });
  };

  const clearSelectedImage = () => {
    if (selectedImagePreview) URL.revokeObjectURL(selectedImagePreview);
    setSelectedImage(null);
    setSelectedImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    return () => {
      if (selectedImagePreview) URL.revokeObjectURL(selectedImagePreview);
    };
  }, [selectedImagePreview]);

  return (
    <main className="app-interior-page mobile-premium-screen conversation-screen min-h-screen bg-[#12101A] px-4 py-4 text-[#F3F5FF]">
      <div className="app-page-shell relative flex max-w-4xl flex-col gap-3">
        <header className="conversation-topbar rounded-2xl border border-white/10 bg-[#1A1624] p-4">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/matches"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#12101A] px-3 py-1.5 text-sm text-white/70 transition hover:border-[#A855F7] hover:text-white"
            >
              <ArrowLeft size={14} />
              Back
            </Link>
            <h1 className="text-sm font-medium text-[#F8F9FF] sm:text-base">{otherUserName}</h1>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {trustSignals.map(signal => (
              <span
                key={signal}
                className="conversation-trust-chip rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/90"
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

        <section className="conversation-shell flex min-h-[68vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#12101A]">
          <div className="border-b border-white/10 bg-[#1A1624] p-3">
            <div className="conversation-track-shell">
              <ConnectionTrackPanel conversationId={conversationId} />
            </div>
          </div>
          <div className="conversation-messages flex-1 space-y-2 overflow-y-auto bg-[#12101A] p-4">
            {error?.toLowerCase().includes('connection track') ? (
              <div className="rounded-md border border-[#5c2323] bg-[#3C1515] px-3 py-2 text-sm text-[#FF9999]">{error}</div>
            ) : null}
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
                        className={`conversation-bubble max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 sm:max-w-[75%] ${
                          mine
                            ? 'conversation-bubble-me rounded-br-[4px] bg-gradient-to-br from-[#7C3AED] to-[#A855F7] text-white'
                            : 'conversation-bubble-them rounded-bl-[4px] border border-white/10 bg-[#252030] text-white/95'
                        }`}
                      >
                        {message.message_type === 'image' && message.media_url ? (
                          <img
                            src={message.media_url}
                            alt="Shared in chat"
                            className="max-h-[240px] w-auto max-w-full rounded-xl object-cover"
                          />
                        ) : (
                          <p>{message.body}</p>
                        )}
                        <p className={`mt-1 text-[11px] ${mine ? 'text-white/70' : 'text-white/50'}`}>
                          {formatTimestamp(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              : null}
          </div>

          <form onSubmit={onSend} className="conversation-compose border-t border-white/10 bg-[#12101A] p-3">
            {otherUserId ? (
              <div className="conversation-safety-wrap mb-3">
                <ConnectionSafetyActions targetUserId={otherUserId} compact />
              </div>
            ) : null}

            <div className="conversation-guidance-wrap mb-3">
              <ConversationGuidance
                onPick={insertGuidancePrompt}
                conversationId={conversationId}
                compatibilityReasons={compatibilityReasons}
                relationshipIntent={relationshipIntent}
              />
            </div>

            {showEmojiPicker ? (
              <div className="mb-3 rounded-xl border border-white/10 bg-[#1A1624] p-2">
                <EmojiPicker
                  width="100%"
                  height={340}
                  lazyLoadEmojis
                  searchPlaceHolder="Search emoji"
                  onEmojiClick={emojiData => appendEmoji(emojiData.emoji)}
                />
              </div>
            ) : null}
            {selectedImagePreview ? (
              <div className="mb-3 rounded-xl border border-white/10 bg-[#1A1624] p-2">
                <div className="relative">
                  <img
                    src={selectedImagePreview}
                    alt="Selected"
                    className="max-h-[220px] w-auto max-w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearSelectedImage}
                    className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white"
                    aria-label="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : null}
            <div className="conversation-input-row flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={event => onPickImage(event.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-[#1E1A2E] text-white/75 hover:border-[#A855F7] hover:text-white"
                aria-label="Upload photo"
                disabled={Boolean(messagingDisabledReason) || sending || uploadingImage}
              >
                <ImagePlus size={18} />
              </button>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(prev => !prev)}
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${
                  showEmojiPicker
                    ? 'border-[#A855F7] bg-[#221C32] text-[#E7D8FF]'
                    : 'border-white/15 bg-[#1E1A2E] text-white/65 hover:border-[#A855F7] hover:text-white'
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
                className="h-11 flex-1 rounded-[24px] border border-white/15 bg-[#1E1A2E] px-3 text-sm text-[#F7F8FF] outline-none transition placeholder:text-white/35 focus:border-[#A855F7] disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={(!input.trim() && !selectedImage) || sending || uploadingImage || loading || Boolean(messagingDisabledReason)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#8A5CF6] bg-gradient-to-br from-[#7C3AED] to-[#A855F7] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </div>
            {messagingDisabledReason ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-[#F4C977]">
                <ShieldCheck size={12} />
                {messagingDisabledReason}
              </p>
            ) : null}
            {couplePartnerId && otherUserId && couplePartnerId === otherUserId ? (
              <p className="mt-2 text-[11px] text-[#B7C1F0]">Couple Mode ON: this is your confirmed partner chat.</p>
            ) : null}
            {error && !error.toLowerCase().includes('connection track') ? (
              <p className="mt-2 text-xs text-[#FF8A8A]">{error}</p>
            ) : null}
          </form>
        </section>
      </div>
    </main>
  );
}
