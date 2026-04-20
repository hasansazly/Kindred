import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import { getMatchesForUser } from '@/lib/matches';
import { createSupabaseServerClient } from '../../../utils/supabase/server';
import { isDatingLockedForUser } from '@/server/couples/mode';

type ParticipantRow = {
  conversation_id: string;
  user_id: string;
};

type MessageRow = {
  conversation_id: string;
  body: string;
  sender_user_id: string;
  created_at: string;
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) return `${Math.max(diffMinutes, 1)}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default async function MatchesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?next=/matches');
  }

  const { data: preferenceRow } = await supabase
    .from('match_preferences')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!preferenceRow) {
    redirect('/onboarding');
  }

  if (await isDatingLockedForUser(supabase, user.id)) {
    redirect('/app/couples');
  }

  const matches = await getMatchesForUser(supabase, user.id);
  const matchedUserIds = matches.map(match => match.matchedUserId);

  const { data: myConversationRowsRaw } = await supabase
    .from('conversation_participants')
    .select('conversation_id,user_id')
    .eq('user_id', user.id)
    .returns<ParticipantRow[]>();

  const conversationIds = (myConversationRowsRaw ?? []).map(row => row.conversation_id);

  const [otherParticipantRowsRaw, messagesRaw] = await Promise.all([
    conversationIds.length > 0 && matchedUserIds.length > 0
      ? supabase
          .from('conversation_participants')
          .select('conversation_id,user_id')
          .in('conversation_id', conversationIds)
          .in('user_id', matchedUserIds)
          .returns<ParticipantRow[]>()
          .then(result => result.data ?? [])
      : Promise.resolve([] as ParticipantRow[]),
    conversationIds.length > 0
      ? supabase
          .from('messages')
          .select('conversation_id,body,sender_user_id,created_at')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false })
          .returns<MessageRow[]>()
          .then(result => result.data ?? [])
      : Promise.resolve([] as MessageRow[]),
  ]);

  const conversationByMatchedUserId = new Map<string, string>();
  for (const row of otherParticipantRowsRaw) {
    if (!conversationByMatchedUserId.has(row.user_id)) {
      conversationByMatchedUserId.set(row.user_id, row.conversation_id);
    }
  }

  const latestMessageByConversation = new Map<string, MessageRow>();
  for (const row of messagesRaw) {
    if (!latestMessageByConversation.has(row.conversation_id)) {
      latestMessageByConversation.set(row.conversation_id, row);
    }
  }

  const conversationMatches = matches
    .map(match => {
      const conversationId = conversationByMatchedUserId.get(match.matchedUserId);
      if (!conversationId) return null;
      const latest = latestMessageByConversation.get(conversationId);
      if (!latest) return null;
      return {
        match,
        conversationId,
        latest,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime());

  const conversationUserIds = new Set(conversationMatches.map(item => item.match.matchedUserId));
  const newMatches = matches.filter(match => !conversationUserIds.has(match.matchedUserId));

  return (
    <main className="app-interior-page mobile-premium-screen matches-screen min-h-screen bg-[#12101A] px-4 py-5 pb-24 text-[#F5EEF8]">
      <div className="app-page-shell with-mobile-nav relative max-w-4xl">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[52px] font-semibold leading-[0.9] tracking-tight text-[#F5EEF8]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
              Matches
            </h1>
            <p className="mt-1 text-[13px] text-[#B89EC4]">
              {matches.length > 0 ? `${matches.length} active match${matches.length > 1 ? 'es' : ''}` : 'No active matches yet'}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="mt-1 rounded-full border border-white/20 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/85 transition hover:border-[#A855F7]"
          >
            Dashboard
          </Link>
        </header>

        <section className="mb-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">New Matches</p>
          {newMatches.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {newMatches.map(match => (
                <Link key={match.id} href={`/matches/${match.id}`} className="shrink-0 text-center">
                  <div className="h-[74px] w-[74px] rounded-full border-2 border-[#A855F7] bg-gradient-to-br from-[#7C3AED] to-[#DB2777] p-[2px]">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-[#1B1730] text-[29px]">
                      {match.matchedProfile.firstName.slice(0, 1).toUpperCase()}
                    </div>
                  </div>
                  <p className="mt-1.5 w-[74px] truncate text-sm text-white/85">{match.matchedProfile.firstName}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-[#1A1624] p-3 text-sm text-white/60">
              No new matches right now.
            </div>
          )}
        </section>

        <section className="mb-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">Conversations</p>
          {conversationMatches.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#141120]">
              {conversationMatches.map((item, index) => {
                const unread = item.latest.sender_user_id !== user.id;
                return (
                  <Link
                    key={item.conversationId}
                    href={`/messages/${item.conversationId}`}
                    className={`flex items-center gap-3 p-4 transition hover:bg-white/[0.03] ${index < conversationMatches.length - 1 ? 'border-b border-white/10' : ''}`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4F46E5] to-[#A855F7] text-[20px]">
                      {item.match.matchedProfile.firstName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[26px] leading-none text-white" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                        {item.match.matchedProfile.firstName}
                      </p>
                      <p className="mt-1 truncate text-sm text-white/55">{item.latest.body}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm leading-none text-white/45">
                        {formatTimestamp(item.latest.created_at)}
                      </p>
                      {unread ? <span className="ml-auto mt-1 block h-3 w-3 rounded-full bg-[#A855F7]" /> : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-[#141120] p-6 text-center">
              <Sparkles size={18} className="mx-auto text-white/40" />
              <p className="mt-2 text-sm text-white/70">No conversations yet.</p>
              <p className="mt-1 text-xs text-white/50">Send the first message from a match card to start chatting.</p>
            </div>
          )}
        </section>
      </div>
      <MobileBottomNav />
    </main>
  );
}
