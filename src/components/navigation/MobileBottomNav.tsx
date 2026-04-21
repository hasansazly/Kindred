'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, MessageCircle, Users, HeartHandshake } from 'lucide-react';
import { getSupabaseBrowserClient } from '../../../utils/supabase/client';

const NAV_DISCOVER = { href: '/app/discover', icon: Compass, label: 'Discover', notif: 0 };
const NAV_MATCHES = { href: '/matches', icon: Users, label: 'Matches', notif: 3 };
const NAV_MESSAGES = { href: '/messages', icon: MessageCircle, label: 'Messages', notif: 2 };
const COUPLES_ITEM = { href: '/app/couples', icon: HeartHandshake, label: 'Couples', notif: 0 };
const NAV = [NAV_DISCOVER, NAV_MATCHES, NAV_MESSAGES, COUPLES_ITEM];

type NavCounts = {
  matches: number;
  messages: number;
};

function isActivePath(pathname: string, href: string) {
  if (href === '/messages') return pathname === '/messages' || pathname.startsWith('/messages/');
  if (href === '/matches') return pathname === '/matches' || pathname.startsWith('/matches/');
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [coupleModeOn, setCoupleModeOn] = useState(false);
  const [navCounts, setNavCounts] = useState<NavCounts>({ matches: 0, messages: 0 });

  useEffect(() => {
    let active = true;
    const loadMode = async () => {
      try {
        const response = await fetch('/api/couples/mode', { method: 'GET' });
        if (!response.ok) return;
        const payload = (await response.json()) as { selfEnabled?: boolean };
        if (active) setCoupleModeOn(Boolean(payload.selfEnabled));
      } catch {
        // Keep baseline nav when mode state cannot be fetched.
      }
    };
    void loadMode();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadCounts = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { count: activeMatchesCount } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active');

        const { data: myParticipants } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);

        const conversationIds = (myParticipants ?? []).map((row: { conversation_id: string }) => row.conversation_id);
        let unreadCount = 0;

        if (conversationIds.length > 0) {
          const { data: messages } = await supabase
            .from('messages')
            .select('conversation_id,sender_user_id,created_at')
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: false });

          const latestByConversation = new Map<string, { sender_user_id: string }>();
          for (const row of (messages ?? []) as Array<{ conversation_id: string; sender_user_id: string }>) {
            const conversationId = row.conversation_id;
            if (!latestByConversation.has(conversationId)) {
              latestByConversation.set(conversationId, { sender_user_id: row.sender_user_id });
            }
          }

          unreadCount = [...latestByConversation.values()].filter(
            row => row.sender_user_id && row.sender_user_id !== user.id
          ).length;
        }

        if (active) {
          setNavCounts({
            matches: activeMatchesCount ?? 0,
            messages: unreadCount,
          });
        }
      } catch {
        // Keep zero badges if counts cannot be fetched.
      }
    };

    void loadCounts();
    return () => {
      active = false;
    };
  }, []);

  const navItems = coupleModeOn
    ? [COUPLES_ITEM, NAV_MESSAGES]
    : [...NAV];

  return (
    <div
      className="mobile-only"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 'var(--z-bottom-nav)',
        background: '#1A0A1E',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255, 88, 100, 0.2)',
        display: 'flex',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)',
      }}
    >
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = isActivePath(pathname, item.href);
        const isMessagesTab = item.href === '/messages' || item.href === '/app/messages';
        const notif =
          item.href === '/matches'
            ? navCounts.matches
            : item.href === '/messages'
              ? navCounts.messages
              : item.notif;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="app-mobile-bottom-nav-link"
            style={{
              flex: 1,
              minHeight: 'var(--mobile-nav-height)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              textDecoration: 'none',
              padding: '8px 0 6px',
              color: isActive ? '#FF5864' : 'rgb(184, 158, 196)',
              position: 'relative',
              transition: 'color var(--dur-fast) var(--ease-standard)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {isActive ? (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 28,
                  height: 2.5,
                  borderRadius: '0 0 3px 3px',
                  background: '#FF5864',
                }}
              />
            ) : null}

            <div style={{ position: 'relative' }}>
              <Icon size={23} strokeWidth={isActive ? 2.5 : 1.7} />
              {notif > 0 ? (
                <div
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -7,
                    minWidth: 15,
                    height: 15,
                    background: 'linear-gradient(135deg, #7c3aed, #db2777)',
                    borderRadius: 999,
                    border: '1.5px solid #1A0A1E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 8,
                    fontWeight: 700,
                    color: 'white',
                    padding: '0 3px',
                  }}
                >
                  {notif}
                </div>
              ) : null}
            </div>

            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 400,
                letterSpacing: '0.01em',
                lineHeight: 1,
                color: isActive && isMessagesTab ? '#FFFFFF' : undefined,
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
