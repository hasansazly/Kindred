'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Shield, CreditCard, Trash2, ChevronRight, LogOut, HelpCircle } from 'lucide-react';

interface ToggleItem {
  label: string;
  desc: string;
  key: string;
  value: boolean;
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

  function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
      <div className={`toggle ${on ? 'on' : ''}`} onClick={onToggle} role="switch" aria-checked={on} />
    );
  }

  function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
      <div className="glass" style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon}
          <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
        </div>
        <div style={{ padding: '8px 0' }}>
          {children}
        </div>
      </div>
    );
  }

  function Row({ label, desc, right }: { label: string; desc?: string; right: React.ReactNode }) {
    return (
      <div style={{ padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#f0f0ff', marginBottom: desc ? 2 : 0 }}>{label}</div>
          {desc && <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>{desc}</div>}
        </div>
        {right}
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>Settings</h1>
        <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.4)' }}>Manage your preferences and account</p>
      </div>

      {/* ─ Discovery Preferences ─ */}
      <Section title="Discovery" icon={<Compass size={16} color="#a78bfa" />}>
        <div style={{ padding: '8px 20px 16px' }}>
          {/* Show me toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>Show me on Kindred</div>
              <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>Turn off to hide your profile from discovery</div>
            </div>
            <div className={`toggle ${showMe ? 'on' : ''}`} onClick={() => setShowMe(!showMe)} role="switch" aria-checked={showMe} />
          </div>

          {/* Interested in */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.55)', marginBottom: 10 }}>Interested in</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Men', 'Women', 'Everyone'].map(opt => (
                <button
                  key={opt}
                  onClick={() => setInterestedIn(prev => prev.includes(opt) ? prev.filter(v => v !== opt) : [...prev, opt])}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1.5px solid ${interestedIn.includes(opt) ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`, background: interestedIn.includes(opt) ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)', color: interestedIn.includes(opt) ? '#c4b5fd' : 'rgba(240,240,255,0.55)', fontSize: 13, fontWeight: interestedIn.includes(opt) ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s' }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Age range */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.55)' }}>Age range</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>{minAge}–{maxAge}</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.3)', marginBottom: 6 }}>Min: {minAge}</div>
                <input type="range" min={18} max={70} value={minAge} onChange={e => setMinAge(Math.min(Number(e.target.value), maxAge - 1))} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.3)', marginBottom: 6 }}>Max: {maxAge}</div>
                <input type="range" min={18} max={80} value={maxAge} onChange={e => setMaxAge(Math.max(Number(e.target.value), minAge + 1))} />
              </div>
            </div>
          </div>

          {/* Distance */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.55)' }}>Maximum distance</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>{distance} km</span>
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
          right={<button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,240,255,0.4)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontFamily: 'inherit' }}>Manage <ChevronRight size={14} /></button>}
        />
      </Section>

      {/* ─ Subscription ─ */}
      <Section title="Subscription" icon={<CreditCard size={16} color="#fb7185" />}>
        <div style={{ padding: '12px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>Free Plan</span>
                <span style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 600, color: '#a78bfa' }}>CURRENT</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.4)', marginBottom: 14 }}>3 daily matches · Basic features</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(219,39,119,0.08))', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Spark — $19/mo</div>
              <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)', marginBottom: 10 }}>5 matches + AI Coach + Date Planner</div>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '9px' }}>Upgrade</button>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Deep — $39/mo</div>
              <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)', marginBottom: 10 }}>Unlimited + advanced features</div>
              <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '9px' }}>Learn More</button>
            </div>
          </div>
        </div>
      </Section>

      {/* ─ Support ─ */}
      <Section title="Support" icon={<HelpCircle size={16} color="#60a5fa" />}>
        {['Help Center', 'Report a problem', 'Contact us', 'Community Guidelines'].map(item => (
          <Row key={item} label={item} right={<ChevronRight size={16} color="rgba(240,240,255,0.25)" />} />
        ))}
      </Section>

      {/* Danger zone */}
      <div className="glass" style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 32 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Trash2 size={16} color="#f43f5e" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f43f5e' }}>Danger Zone</span>
        </div>
        <div style={{ padding: '8px 0' }}>
          <Row label="Pause my account" desc="Temporarily hide your profile" right={<ChevronRight size={16} color="rgba(240,240,255,0.25)" />} />
          <Row label="Delete account" desc="Permanently remove all your data" right={<ChevronRight size={16} color="rgba(244,63,94,0.5)" />} />
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

