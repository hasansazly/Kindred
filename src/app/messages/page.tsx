import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import { createSupabaseServerClient } from '../../../utils/supabase/server';
import { getCoupleModeState } from '@/server/couples/mode';

type ParticipantRow = {
  conversation_id: string;
  user_id: string;
};

type MessageRow = {
  conversation_id: string;
  body: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  email?: string | null;
  first_name?: string | null;
};

type ActiveMatchRow = {
  matched_user_id: string;
  conversation_disabled?: boolean | null;
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
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function MessagesInboxPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?next=/messages');
  }

  const coupleMode = await getCoupleModeState(supabase, user.id);
  const lockToPartner = coupleMode.featureEnabled && coupleMode.hasCouple && coupleMode.selfEnabled;
  const couplePartnerId = lockToPartner ? coupleMode.partnerUserId : null;

  const { data: myParticipantsRowsRaw, error: myParticipantsError } = await supabase
    .from('conversation_participants')
    .select('conversation_id,user_id')
    .eq('user_id', user.id)
    .returns<ParticipantRow[]>();

  if (myParticipantsError) {
    return (
      <main className="app-interior-page mobile-premium-screen messages-screen min-h-screen bg-[#060814] px-4 py-8 pb-24 text-white">
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-[#1E1E35] p-6">
          <h1 className="text-xl font-semibold text-white">Messages</h1>
          <p className="mt-2 text-sm text-rose-300">{myParticipantsError.message}</p>
        </div>
        <MobileBottomNav />
      </main>
    );
  }

  const myParticipantsRows = (myParticipantsRowsRaw ?? []) as ParticipantRow[];
  const conversationIds = myParticipantsRows.map(row => row.conversation_id);

  if (conversationIds.length === 0) {
    return (
      <main className="app-interior-page mobile-premium-screen messages-screen min-h-screen bg-[#060814] px-4 py-8 pb-24 text-white">
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-[#1E1E35] p-6">
          <h1 className="text-xl font-semibold text-white">Messages</h1>
          <div className="mt-6 rounded-xl border border-white/10 bg-[#1E1E35] p-8 text-center">
            <MessageCircle size={34} className="mx-auto text-white/50" />
            <p className="mt-3 text-sm text-white/70">No conversations yet. Open a match and click Message This Match.</p>
          </div>
        </div>
        <MobileBottomNav />
      </main>
    );
  }

  const [{ data: allParticipantsRaw }, { data: allMessagesRaw }] = await Promise.all([
    supabase
      .from('conversation_participants')
      .select('conversation_id,user_id')
      .in('conversation_id', conversationIds)
      .returns<ParticipantRow[]>(),
    supabase
      .from('messages')
      .select('conversation_id,body,created_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })
      .returns<MessageRow[]>(),
  ]);

  const allParticipants = (allParticipantsRaw ?? []) as ParticipantRow[];
  const allMessages = (allMessagesRaw ?? []) as MessageRow[];

  const otherParticipantByConversation = new Map<string, string>();
  for (const row of allParticipants) {
    if (row.user_id !== user.id && !otherParticipantByConversation.has(row.conversation_id)) {
      otherParticipantByConversation.set(row.conversation_id, row.user_id);
    }
  }

  const otherUserIds = [...new Set([...otherParticipantByConversation.values()])];

  const [{ data: activeMatchesRaw }, { data: blockRows }, { data: unmatchRows }] = await Promise.all([
    otherUserIds.length > 0
      ? supabase
          .from('matches')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .in('matched_user_id', otherUserIds)
          .returns<ActiveMatchRow[]>()
      : Promise.resolve({ data: [] as ActiveMatchRow[] }),
    supabase
      .from('blocks')
      .select('blocker_user_id,blocked_user_id')
      .or(`blocker_user_id.eq.${user.id},blocked_user_id.eq.${user.id}`)
      .returns<Array<{ blocker_user_id: string; blocked_user_id: string }>>(),
    supabase
      .from('unmatches')
      .select('initiated_by_user_id,unmatched_user_id')
      .or(`initiated_by_user_id.eq.${user.id},unmatched_user_id.eq.${user.id}`)
      .returns<Array<{ initiated_by_user_id: string; unmatched_user_id: string }>>(),
  ]);

  const blockedIds = new Set<string>();
  for (const row of blockRows ?? []) {
    if (row.blocker_user_id === user.id) blockedIds.add(row.blocked_user_id);
    if (row.blocked_user_id === user.id) blockedIds.add(row.blocker_user_id);
  }

  const unmatchedIds = new Set<string>();
  for (const row of unmatchRows ?? []) {
    if (row.initiated_by_user_id === user.id) unmatchedIds.add(row.unmatched_user_id);
    if (row.unmatched_user_id === user.id) unmatchedIds.add(row.initiated_by_user_id);
  }

  const allowedByMatch = new Set<string>();
  for (const row of activeMatchesRaw ?? []) {
    if (!row.conversation_disabled) {
      allowedByMatch.add(row.matched_user_id);
    }
  }

  const [{ data: profileRowsRaw }, { data: onboardingRowsRaw }] = await Promise.all([
    otherUserIds.length > 0
      ? supabase.from('profiles').select('id,email,first_name').in('id', otherUserIds).returns<ProfileRow[]>()
      : Promise.resolve({ data: [] as ProfileRow[] }),
    otherUserIds.length > 0
      ? supabase
          .from('onboarding_responses')
          .select('user_id,category,response')
          .in('user_id', otherUserIds)
          .eq('category', 'demographics')
          .returns<OnboardingRow[]>()
      : Promise.resolve({ data: [] as OnboardingRow[] }),
  ]);

  const profileById = new Map<string, ProfileRow>();
  for (const profile of (profileRowsRaw ?? []) as ProfileRow[]) {
    profileById.set(profile.id, profile);
  }

  const demographicsById = new Map<string, Record<string, unknown>>();
  for (const row of (onboardingRowsRaw ?? []) as OnboardingRow[]) {
    if (typeof row.response === 'object' && row.response !== null) {
      demographicsById.set(row.user_id, row.response as Record<string, unknown>);
    }
  }

  const latestByConversation = new Map<string, MessageRow>();
  for (const row of allMessages) {
    if (!latestByConversation.has(row.conversation_id)) {
      latestByConversation.set(row.conversation_id, row);
    }
  }

  const conversations = conversationIds
    .map(conversationId => {
      const otherUserId = otherParticipantByConversation.get(conversationId) ?? null;
      if (!otherUserId) return null;
      if (couplePartnerId && otherUserId !== couplePartnerId) return null;
      if (!couplePartnerId && !allowedByMatch.has(otherUserId)) return null;
      if (blockedIds.has(otherUserId)) return null;
      if (unmatchedIds.has(otherUserId)) return null;

      const profile = otherUserId ? profileById.get(otherUserId) : undefined;
      const demographics = otherUserId ? demographicsById.get(otherUserId) : undefined;
      const emailPrefix = typeof profile?.email === 'string' ? profile.email.split('@')[0] : '';
      const name =
        firstNonEmpty([
          demographics?.fullName,
          demographics?.full_name,
          demographics?.firstName,
          demographics?.first_name,
          demographics?.name,
          profile?.first_name,
          emailPrefix,
        ]) || 'Match';

      const latest = latestByConversation.get(conversationId);

      return {
        conversationId,
        name,
        lastBody: latest?.body ?? 'No messages yet',
        lastAt: latest?.created_at ?? null,
      };
    })
    .filter((item): item is { conversationId: string; name: string; lastBody: string; lastAt: string | null } => Boolean(item))
    .sort((a, b) => {
      if (!a.lastAt && !b.lastAt) return 0;
      if (!a.lastAt) return 1;
      if (!b.lastAt) return -1;
      return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime();
    });

  return (
    <main className="app-interior-page mobile-premium-screen messages-screen min-h-screen bg-[#060814] px-4 py-8 pb-24 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 rounded-2xl border border-white/10 bg-[#1E1E35] p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Messages</h1>
          <p className="body-on-dark mt-1 text-sm text-white/70">{conversations.length} active conversation{conversations.length > 1 ? 's' : ''}</p>
        </header>

        <section className="space-y-2">
          {conversations.length > 0 ? (
            conversations.map(item => (
              <Link
                key={item.conversationId}
                href={`/messages/${item.conversationId}`}
                className="block rounded-xl border-b border-white/10 bg-[#1E1E35] p-4 transition hover:bg-[#252540] hover:border-[#6B5CE7]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium text-white">{item.name}</p>
                    <p className="mt-1 truncate text-sm text-white/60">{item.lastBody}</p>
                  </div>
                  <p className="shrink-0 text-xs text-white/40">{item.lastAt ? formatTimestamp(item.lastAt) : ''}</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-xl border border-white/10 bg-[#1E1E35] p-6 text-sm text-white/70">
              {couplePartnerId
                ? 'Couple Mode is ON. Only your confirmed partner conversation appears here.'
                : 'No active conversations. Blocked or unmatched chats are hidden here.'}
            </div>
          )}
        </section>
      </div>
      <MobileBottomNav />
    </main>
  );
}
