'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Shield, Trash2, ChevronRight, LogOut, HelpCircle } from 'lucide-react';

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="glass" style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 16, background: '#FFFFFF', border: '1px solid #E5E3DF' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #ECE9E2', display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon}
        <span style={{ fontSize: 16, fontWeight: 600, color: '#1A1A2E' }}>{title}</span>
      </div>
      <div style={{ padding: '8px 0' }}>{children}</div>
    </div>
  );
}

function Row({ label, desc, right }: { label: string; desc?: string; right: ReactNode }) {
  return (
    <div style={{ padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A2E', marginBottom: desc ? 2 : 0 }}>{label}</div>
        {desc && <div style={{ fontSize: 13, color: '#888780' }}>{desc}</div>}
      </div>
      {right}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [minAge, setMinAge] = useState(22);
  const [maxAge, setMaxAge] = useState(34);
  const [distance, setDistance] = useState(50);
  const [interestedIn, setInterestedIn] = useState(['Women']);
  const [showMe, setShowMe] = useState(true);

  const [notifs, setNotifs] = useState({
    newMatch: true,
    message: true,
    dailyMatches: true,
    likes: false,
    appUpdates: false,
  });

  const [privacy, setPrivacy] = useState({
    readReceipts: true,
    activityStatus: true,
    profileVisible: true,
    incognito: false,
  });

  function toggleNotif(key: string) {
    setNotifs(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  }
  function togglePrivacy(key: string) {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  }

  return (
    <div className="app-interior-page settings-page" style={{ padding: '32px', maxWidth: 680, width: '100%', margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4, color: '#FFFFFF' }}>Settings</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>Manage your preferences and account</p>
      </div>

      {/* ─ Discovery Preferences ─ */}
      <Section title="Discovery" icon={<Compass size={16} color="#a78bfa" />}>
        <div style={{ padding: '8px 20px 16px' }}>
          {/* Show me toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2, color: '#1A1A2E' }}>Show me on Vinculo</div>
              <div style={{ fontSize: 12, color: '#888780' }}>Turn off to hide your profile from discovery</div>
            </div>
            <div className={`toggle ${showMe ? 'on' : ''}`} onClick={() => setShowMe(!showMe)} role="switch" aria-checked={showMe} />
          </div>

          {/* Interested in */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A2E', marginBottom: 10 }}>Interested in</div>
            <div className="settings-interest-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Men', 'Women', 'Everyone'].map(opt => (
                <button
                  key={opt}
                  onClick={() => setInterestedIn(prev => prev.includes(opt) ? prev.filter(v => v !== opt) : [...prev, opt])}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1.5px solid ${interestedIn.includes(opt) ? 'rgba(139,92,246,0.5)' : '#E5E3DF'}`, background: interestedIn.includes(opt) ? 'rgba(139,92,246,0.12)' : '#FFFFFF', color: interestedIn.includes(opt) ? '#534AB7' : '#1A1A2E', fontSize: 13, fontWeight: interestedIn.includes(opt) ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s' }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Age range */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#1A1A2E' }}>Age range</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#534AB7' }}>{minAge}–{maxAge}</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#888780', marginBottom: 6 }}>Min: {minAge}</div>
                <input type="range" min={18} max={70} value={minAge} onChange={e => setMinAge(Math.min(Number(e.target.value), maxAge - 1))} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#888780', marginBottom: 6 }}>Max: {maxAge}</div>
                <input type="range" min={18} max={80} value={maxAge} onChange={e => setMaxAge(Math.max(Number(e.target.value), minAge + 1))} />
              </div>
            </div>
          </div>

          {/* Distance */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#1A1A2E' }}>Maximum distance</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#534AB7' }}>{distance} km</span>
            </div>
            <input type="range" min={5} max={200} value={distance} onChange={e => setDistance(Number(e.target.value))} />
          </div>
        </div>
      </Section>

      {/* ─ Notifications ─ */}
      <Section title="Notifications" icon={<Bell size={16} color="#fbbf24" />}>
        {([
          { key: 'newMatch', label: 'New matches', desc: 'When someone likes you back' },
          { key: 'message', label: 'Messages', desc: 'New message from a match' },
          { key: 'dailyMatches', label: 'Daily matches', desc: 'When your daily 5 are ready' },
          { key: 'likes', label: 'Likes received', desc: 'When someone likes your profile' },
          { key: 'appUpdates', label: 'Product updates', desc: 'News and feature releases' },
        ] as { key: keyof typeof notifs; label: string; desc: string }[]).map(item => (
          <Row
            key={item.key}
            label={item.label}
            desc={item.desc}
            right={<div className={`toggle ${notifs[item.key] ? 'on' : ''}`} onClick={() => toggleNotif(item.key)} />}
          />
        ))}
      </Section>

      {/* ─ Privacy ─ */}
      <Section title="Privacy & Safety" icon={<Shield size={16} color="#34d399" />}>
        {([
          { key: 'readReceipts', label: 'Read receipts', desc: 'Let matches see when you read their messages' },
          { key: 'activityStatus', label: 'Activity status', desc: 'Show when you were last active' },
          { key: 'profileVisible', label: 'Profile visible', desc: 'Show up in discovery' },
          { key: 'incognito', label: 'Incognito mode', desc: 'Browse profiles without them seeing you first' },
        ] as { key: keyof typeof privacy; label: string; desc: string }[]).map(item => (
          <Row
            key={item.key}
            label={item.label}
            desc={item.desc}
            right={<div className={`toggle ${privacy[item.key] ? 'on' : ''}`} onClick={() => togglePrivacy(item.key)} />}
          />
        ))}
        <Row
          label="Blocked users"
          right={<button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5F5E5A', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontFamily: 'inherit' }}>Manage <ChevronRight size={14} /></button>}
        />
      </Section>

      {/* ─ Support ─ */}
      <Section title="Support" icon={<HelpCircle size={16} color="#60a5fa" />}>
        {['Help Center', 'Report a problem', 'Contact us', 'Community Guidelines'].map(item => (
          <Row key={item} label={item} right={<ChevronRight size={16} color="#888780" />} />
        ))}
      </Section>

      {/* Danger zone */}
      <div className="glass" style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 32 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F5D5D5', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Trash2 size={16} color="#f43f5e" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f43f5e' }}>Danger Zone</span>
        </div>
        <div style={{ padding: '8px 0' }}>
          <div style={{ padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#E24B4A', marginBottom: 2 }}>Pause my account</div>
              <div style={{ fontSize: 13, color: '#A32D2D' }}>Temporarily hide your profile</div>
            </div>
            <ChevronRight size={16} color="#A32D2D" />
          </div>
          <div style={{ padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#E24B4A', marginBottom: 2 }}>Delete account</div>
              <div style={{ fontSize: 13, color: '#A32D2D' }}>Permanently remove all your data</div>
            </div>
            <ChevronRight size={16} color="#A32D2D" />
          </div>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={() => router.push('/')}
        style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.14)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; }}
      >
        <LogOut size={17} />
        Sign out
      </button>

      <style>{`
        @media (max-width: 767px) {
          .settings-page { padding: 24px 16px 32px !important; }
          .settings-interest-row button { flex: 1 1 calc(50% - 4px) !important; }
          .settings-sub-grid { grid-template-columns: 1fr !important; }
        }
        .settings-page .toggle {
          background: #E7E5E1;
          border: 1px solid #D6D3CF;
        }
        .settings-page .toggle.on {
          background: #7F77DD;
          border-color: #7F77DD;
        }
      `}</style>
    </div>
  );
}

function Compass({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
