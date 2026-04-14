'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Compass, Users, MessageCircle, User, Settings, Bell, Sparkles, LogOut, Menu, X, Flame, GitBranch } from 'lucide-react';
import { useState } from 'react';
import { CURRENT_USER } from '@/lib/mockData';

const NAV = [
  { href: '/app/discover',         icon: Compass,       label: 'Discover',   notif: 0 },
  { href: '/app/spark',            icon: Flame,         label: 'Daily Spark', notif: 2, highlight: true },
  { href: '/app/matches',          icon: Users,         label: 'Matches',    notif: 3 },
  { href: '/app/messages',         icon: MessageCircle, label: 'Messages',   notif: 2 },
  { href: '/app/profile',          icon: User,          label: 'Profile',    notif: 0 },
  { href: '/app/settings',         icon: Settings,      label: 'Settings',   notif: 0 },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 16px' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingLeft: 4 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #7c3aed, #db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(124,58,237,0.35)' }}>
            <Heart size={15} color="white" fill="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 19, letterSpacing: '-0.03em' }}>kindred</span>
        </Link>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,240,255,0.4)', padding: 4 }}>
            <X size={20} />
          </button>
        )}
      </div>

      {/* Aura badge */}
      <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 14, padding: '12px 14px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
          <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{CURRENT_USER.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Sparkles size={10} color="#a78bfa" />
            <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 500 }}>Aura {CURRENT_USER.auraScore}</span>
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <Bell size={16} color="rgba(240,240,255,0.35)" />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {NAV.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const isSpark = item.href === '/app/spark';
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{
                position: 'relative',
                ...(isSpark && !isActive ? {
                  background: 'rgba(251,146,60,0.07)',
                  borderColor: 'rgba(251,146,60,0.2)',
                  color: '#fb923c',
                } : {}),
              }}
              onClick={onClose}
            >
              <Icon size={18} />
              {item.label}
              {isSpark && !isActive && (
                <span style={{ marginLeft: 4, fontSize: 14 }}>🔥</span>
              )}
              {item.notif > 0 && (
                <div style={{ marginLeft: 'auto', background: isSpark ? 'rgba(251,146,60,0.9)' : 'linear-gradient(135deg, #7c3aed, #db2777)', color: 'white', borderRadius: 999, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, padding: '0 5px' }}>
                  {item.notif}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Daily matches countdown */}
      <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#fde68a', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Daily Matches</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= 3 ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>3 of 5 viewed · Resets in 6h</div>
      </div>

      {/* Sign out */}
      <Link href="/" className="nav-item" style={{ color: 'rgba(244,63,94,0.6)' }}>
        <LogOut size={16} />
        Sign out
      </Link>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#07070f', display: 'flex' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:block" style={{ width: 260, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', background: 'rgba(10,10,20,0.8)', backdropFilter: 'blur(20px)' }}>
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setMobileOpen(false)} />
          <div style={{ position: 'relative', zIndex: 1, width: 280, background: '#0f0f1a', borderRight: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto' }}>
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Mobile header */}
        <div className="lg:hidden" style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(7,7,15,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={13} color="white" fill="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.03em' }}>kindred</span>
          </Link>
          <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,240,255,0.6)', padding: 4 }}>
            <Menu size={22} />
          </button>
        </div>

        {/* Page content */}
        <main style={{ flex: 1 }}>
          {children}
        </main>

        {/* Mobile bottom nav */}
        <div className="lg:hidden" style={{ position: 'sticky', bottom: 0, background: 'rgba(7,7,15,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', padding: '8px 0 20px' }}>
          {NAV.slice(0, 4).map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '8px 0', color: 'rgba(240,240,255,0.4)', position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <Icon size={22} />
                  {item.notif > 0 && (
                    <div style={{ position: 'absolute', top: -4, right: -6, width: 16, height: 16, background: 'linear-gradient(135deg, #7c3aed, #db2777)', borderRadius: '50%', border: '2px solid #07070f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white' }}>
                      {item.notif}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: 500 }}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
