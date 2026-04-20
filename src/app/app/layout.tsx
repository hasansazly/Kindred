'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Compass, Users, MessageCircle, User, Settings, Bell, Sparkles, LogOut, HeartHandshake } from 'lucide-react';
import AssistantShell from '@/components/ai/AssistantShell';
import LogoutButton from '@/components/auth/LogoutButton';
import { getSupabaseBrowserClient } from '../../../utils/supabase/client';

const NAV_DISCOVER = { href: '/app/discover', icon: Compass, label: 'Discover', notif: 0, isSpark: false };
const NAV_MATCHES = { href: '/app/matches', icon: Users, label: 'Matches', notif: 3, isSpark: false };
const NAV_MESSAGES = { href: '/app/messages', icon: MessageCircle, label: 'Messages', notif: 2, isSpark: false };
const NAV_PROFILE = { href: '/app/profile', icon: User, label: 'Profile', notif: 0, isSpark: false };
const BASE_NAV = [NAV_DISCOVER, NAV_MATCHES, NAV_MESSAGES, NAV_PROFILE];

const COUPLES_NAV_ITEM = { href: '/app/couples', icon: HeartHandshake, label: 'Couples', notif: 0, isSpark: false };

const SIDE_EXTRA = [
  { href: '/app/settings', icon: Settings, label: 'Settings',  notif: 0, isSpark: false },
];

type SidebarIdentity = {
  name: string;
  auraScore: number;
  photoUrl: string | null;
};

function Sidebar() {
  const pathname = usePathname();
  const [identity, setIdentity] = useState<SidebarIdentity>({ name: 'You', auraScore: 65, photoUrl: null });
  const [coupleModeOn, setCoupleModeOn] = useState(false);

  useEffect(() => {
    let active = true;

    const loadIdentity = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const [{ data: profile }, { count: responsesCount }, { data: profileMetaRow }, { data: demographicsRow }] = await Promise.all([
          supabase.from('profiles').select('full_name,email').eq('id', user.id).maybeSingle(),
          supabase.from('onboarding_responses').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase
            .from('onboarding_responses')
            .select('response')
            .eq('user_id', user.id)
            .eq('category', 'profile_meta')
            .maybeSingle(),
          supabase
            .from('onboarding_responses')
            .select('response')
            .eq('user_id', user.id)
            .eq('category', 'demographics')
            .maybeSingle(),
        ]);

        const demographicsName =
          demographicsRow &&
          typeof demographicsRow.response === 'object' &&
          demographicsRow.response !== null &&
          typeof (demographicsRow.response as { fullName?: unknown }).fullName === 'string'
            ? (demographicsRow.response as { fullName?: string }).fullName?.trim()
            : '';
        const name = profile?.full_name?.trim() || demographicsName || profile?.email?.split('@')[0] || user.email?.split('@')[0] || 'You';
        const auraScore = Math.min(99, 65 + ((responsesCount ?? 0) * 4));
        const maybePhotos =
          profileMetaRow &&
          typeof profileMetaRow.response === 'object' &&
          profileMetaRow.response !== null &&
          Array.isArray((profileMetaRow.response as { photos?: unknown }).photos)
            ? ((profileMetaRow.response as { photos?: unknown }).photos as unknown[])
            : [];
        const firstPhoto = maybePhotos.find(photo => typeof photo === 'string');
        const photoUrl = typeof firstPhoto === 'string' && firstPhoto.trim().length > 0 ? firstPhoto : null;

        if (active) {
          setIdentity({ name, auraScore, photoUrl });
        }
      } catch {
        // Keep a stable fallback identity if profile lookup fails.
      }
    };

    void loadIdentity();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadMode = async () => {
      try {
        const response = await fetch('/api/couples/mode', { method: 'GET' });
        if (!response.ok) return;
        const payload = (await response.json()) as { selfEnabled?: boolean };
        if (active) setCoupleModeOn(Boolean(payload.selfEnabled));
      } catch {
        // Keep default nav if mode cannot be fetched.
      }
    };
    void loadMode();
    return () => {
      active = false;
    };
  }, []);

  const mainNav = coupleModeOn
    ? [COUPLES_NAV_ITEM, NAV_MATCHES, NAV_MESSAGES, NAV_PROFILE]
    : [...BASE_NAV];
  const sidebarNav = [...mainNav, ...SIDE_EXTRA];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 16px' }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 32, paddingLeft: 4 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #7c3aed, #db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(124,58,237,0.35)' }}>
          <Heart size={15} color="white" fill="white" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 19, letterSpacing: '-0.03em' }}>vinculo</span>
      </Link>

      <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 14, padding: '12px 14px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
          {identity.photoUrl ? (
            <img src={identity.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(51,65,85,0.95), rgba(30,41,59,0.9))' }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="user-name" style={{ fontSize: 13, fontWeight: 600, color: '#f0f0ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{identity.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Sparkles size={10} color="#a78bfa" />
            <span className="aura-label" style={{ fontSize: 11, color: '#a78bfa', fontWeight: 500 }}>Aura {identity.auraScore}</span>
          </div>
        </div>
        <Bell size={16} color="rgba(240,240,255,0.35)" />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {sidebarNav.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={item.isSpark && !isActive ? { background: 'rgba(251,146,60,0.07)', borderColor: 'rgba(251,146,60,0.2)', color: '#fb923c' } : {}}
            >
              <Icon size={18} />
              {item.label}
              {item.isSpark && !isActive && <span style={{ marginLeft: 4, fontSize: 14 }}>🔥</span>}
              {(item.notif ?? 0) > 0 && (
                <div style={{ marginLeft: 'auto', background: item.isSpark ? 'rgba(251,146,60,0.9)' : 'linear-gradient(135deg, #7c3aed, #db2777)', color: 'white', borderRadius: 999, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, padding: '0 5px' }}>
                  {item.notif}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {!coupleModeOn ? (
        <div className="daily-matches-panel" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
          <div className="daily-label" style={{ fontSize: 11, fontWeight: 600, color: '#fde68a', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Daily Matches</div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= 3 ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' : 'rgba(255,255,255,0.08)' }} />
            ))}
          </div>
          <div className="daily-sub" style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>3 of 5 viewed · Resets in 6h</div>
        </div>
      ) : null}

      <LogoutButton className="nav-item" style={{ color: 'rgba(244,63,94,0.6)' }}>
        <LogOut size={16} />
        Sign out
      </LogoutButton>
    </div>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();
  const [coupleModeOn, setCoupleModeOn] = useState(false);

  useEffect(() => {
    let active = true;
    const loadMode = async () => {
      try {
        const response = await fetch('/api/couples/mode', { method: 'GET' });
        if (!response.ok) return;
        const payload = (await response.json()) as { selfEnabled?: boolean };
        if (active) setCoupleModeOn(Boolean(payload.selfEnabled));
      } catch {
        // Fall back to normal nav.
      }
    };
    void loadMode();
    return () => {
      active = false;
    };
  }, []);

  const navItems = coupleModeOn
    ? [COUPLES_NAV_ITEM, BASE_NAV[1], BASE_NAV[2], BASE_NAV[3]]
    : [...BASE_NAV];

  return (
    <div
      className="mobile-only"
      style={{
        flexShrink: 0,
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 'var(--z-bottom-nav)',
        background: 'rgba(7,7,15,0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)',
      }}
    >
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        const activeColor = item.isSpark ? '#fb923c' : '#a78bfa';
        const inactiveColor = item.isSpark ? 'rgba(251,146,60,0.5)' : 'rgba(240,240,255,0.28)';
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              minHeight: 'var(--mobile-nav-height)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              textDecoration: 'none',
              padding: '8px 0 6px',
              color: isActive ? activeColor : inactiveColor,
              position: 'relative',
              transition: 'color var(--dur-fast) var(--ease-standard)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* Active indicator dot */}
            {isActive && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 28,
                height: 2.5,
                borderRadius: '0 0 3px 3px',
                background: activeColor,
              }} />
            )}

            {/* Icon + badge */}
            <div style={{ position: 'relative' }}>
              <Icon size={23} strokeWidth={isActive ? 2.5 : 1.7} />
              {(item.notif ?? 0) > 0 && (
                <div style={{
                  position: 'absolute',
                  top: -4,
                  right: -7,
                  minWidth: 15,
                  height: 15,
                  background: item.isSpark ? '#fb923c' : 'linear-gradient(135deg, #7c3aed, #db2777)',
                  borderRadius: 999,
                  border: '1.5px solid #07070f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8,
                  fontWeight: 700,
                  color: 'white',
                  padding: '0 3px',
                }}>
                  {item.notif}
                </div>
              )}
            </div>

            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, letterSpacing: '0.01em', lineHeight: 1 }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: '100dvh', background: '#07070f', display: 'flex', overflow: 'hidden' }}>
      {/* Content column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100dvh', overflow: 'hidden' }}>
        {/* Mobile top bar */}
        <div
          style={{
            flexShrink: 0,
            background: 'rgba(7,7,15,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '0 16px',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            minHeight: 'calc(52px + env(safe-area-inset-top, 0px))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, #7c3aed, #db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={12} color="white" fill="white" />
            </div>
          </Link>

          <div className="desktop-top-links" style={{ alignItems: 'center', gap: 16 }}>
            <Link href="/app/discover" style={{ color: 'rgba(240,240,255,0.72)', textDecoration: 'none', fontSize: 13 }}>Discover</Link>
            <Link href="/app/matches" style={{ color: 'rgba(240,240,255,0.72)', textDecoration: 'none', fontSize: 13 }}>Matches</Link>
            <Link href="/app/messages" style={{ color: 'rgba(240,240,255,0.72)', textDecoration: 'none', fontSize: 13 }}>Messages</Link>
            <Link href="/app/profile" style={{ color: 'rgba(240,240,255,0.72)', textDecoration: 'none', fontSize: 13 }}>Profile</Link>
            <Link href="/app/couples" style={{ color: 'rgba(240,240,255,0.72)', textDecoration: 'none', fontSize: 13 }}>Couples</Link>
            <Link href="/app/settings" style={{ color: 'rgba(240,240,255,0.72)', textDecoration: 'none', fontSize: 13 }}>Settings</Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={20} color="rgba(240,240,255,0.55)" strokeWidth={1.8} />
              <div style={{ position: 'absolute', top: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: '#f43f5e', border: '1.5px solid #07070f' }} />
            </div>
            <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', border: '1.5px solid rgba(139,92,246,0.5)', cursor: 'pointer' }}>
              <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            </div>
          </div>
        </div>

        {/* Page content — scrolls within */}
        <main
          className="app-main-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollPaddingBottom: 'var(--app-main-bottom-clearance)',
          } as React.CSSProperties}
        >
          {children}
        </main>

        {/* Mobile bottom nav */}
        <MobileBottomNav />
      </div>
      <AssistantShell />
      <style>{`
        .desktop-top-links { display: flex; }
        .mobile-only { display: none; }
        .desktop-only { display: flex; }
        @media (max-width: 767px) {
          .desktop-top-links { display: none !important; }
          .mobile-only { display: flex !important; }
          .desktop-only { display: none !important; }
          .app-main-scroll {
            padding-bottom: var(--app-main-bottom-clearance) !important;
          }
        }
      `}</style>
    </div>
  );
}
