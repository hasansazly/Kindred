'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, MessageCircle, User, Users } from 'lucide-react';

const NAV = [
  { href: '/app/discover', icon: Compass, label: 'Discover', notif: 0 },
  { href: '/matches', icon: Users, label: 'Matches', notif: 3 },
  { href: '/messages', icon: MessageCircle, label: 'Messages', notif: 2 },
  { href: '/app/profile', icon: User, label: 'Profile', notif: 0 },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/messages') return pathname === '/messages' || pathname.startsWith('/messages/');
  if (href === '/matches') return pathname === '/matches' || pathname.startsWith('/matches/');
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div
      className="mobile-only"
      style={{
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
      {NAV.map(item => {
        const Icon = item.icon;
        const isActive = isActivePath(pathname, item.href);
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
              color: isActive ? '#a78bfa' : 'rgba(240,240,255,0.28)',
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
                  background: '#a78bfa',
                }}
              />
            ) : null}

            <div style={{ position: 'relative' }}>
              <Icon size={23} strokeWidth={isActive ? 2.5 : 1.7} />
              {item.notif > 0 ? (
                <div
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -7,
                    minWidth: 15,
                    height: 15,
                    background: 'linear-gradient(135deg, #7c3aed, #db2777)',
                    borderRadius: 999,
                    border: '1.5px solid #07070f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 8,
                    fontWeight: 700,
                    color: 'white',
                    padding: '0 3px',
                  }}
                >
                  {item.notif}
                </div>
              ) : null}
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
