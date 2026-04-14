'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, X, Star, Brain, MapPin, Briefcase, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { PROFILES } from '@/lib/mockData';
import { getCompatibilityColor, getCompatibilityLabel } from '@/lib/utils';
import type { UserProfile } from '@/lib/types';

const DAILY_MATCHES = PROFILES;

const COMPAT_BREAKDOWN = [
  { key: 'Values', score: 92 },
  { key: 'Communication', score: 88 },
  { key: 'Lifestyle', score: 91 },
  { key: 'Goals', score: 95 },
  { key: 'Emotional', score: 89 },
  { key: 'Interests', score: 84 },
];

function CompatBar({ label, score }: { label: string; score: number }) {
  const color = getCompatibilityColor(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)', width: 90, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, borderRadius: 3, background: color, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, width: 30, textAlign: 'right' }}>{score}</span>
    </div>
  );
}

function ProfileCard({ profile, compat, aiReason, onLike, onPass, onSuperLike }: {
  profile: UserProfile;
  compat: number;
  aiReason: string;
  onLike: () => void;
  onPass: () => void;
  onSuperLike: () => void;
}) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const compatColor = getCompatibilityColor(compat);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, height: 620 }} className="discover-layout">
      {/* Photo card */}
      <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', background: '#1a1a2e' }}>
        {profile.photos.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={profile.name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === photoIdx ? 1 : 0, transition: 'opacity 0.4s ease' }}
          />
        ))}

        {/* Photo nav */}
        {profile.photos.length > 1 && (
          <>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '35%', cursor: 'pointer', zIndex: 3 }} onClick={() => setPhotoIdx(i => Math.max(0, i - 1))} />
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '35%', cursor: 'pointer', zIndex: 3 }} onClick={() => setPhotoIdx(i => Math.min(profile.photos.length - 1, i + 1))} />
            <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', gap: 4, zIndex: 4 }}>
              {profile.photos.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i === photoIdx ? 'white' : 'rgba(255,255,255,0.3)' }} />
              ))}
            </div>
          </>
        )}

        {/* Gradient overlay */}
        <div className="match-overlay" />

        {/* Verified badge */}
        {profile.isVerified && (
          <div style={{ position: 'absolute', top: 22, right: 14, zIndex: 4, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 999, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle size={11} color="#34d399" />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399' }}>Verified</span>
          </div>
        )}

        {/* Compat pill */}
        <div style={{ position: 'absolute', top: profile.photos.length > 1 ? 30 : 14, left: 14, zIndex: 4, background: 'rgba(7,7,15,0.7)', border: `1px solid ${compatColor}40`, borderRadius: 999, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(8px)' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: compatColor }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: compatColor }}>{compat}% match</span>
        </div>

        {/* Info */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px', zIndex: 4 }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{profile.name}, {profile.age}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Briefcase size={12} /> {profile.occupation}
            </span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} /> {profile.distance} km
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {profile.interests.slice(0, 4).map(i => (
              <span key={i} className="tag" style={{ fontSize: 11, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}>{i}</span>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 14, alignItems: 'center', zIndex: 5 }}>
          <button className="action-btn action-pass" onClick={onPass} title="Pass">
            <X size={22} />
          </button>
          <button className="action-btn action-like" onClick={onLike} title="Like">
            <Heart size={26} fill="currentColor" />
          </button>
          <button className="action-btn action-super" onClick={onSuperLike} title="Super Like">
            <Star size={18} fill="currentColor" />
          </button>
        </div>
      </div>

      {/* Detail panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', paddingRight: 4, paddingBottom: 40 }}>
        {/* Compat score ring */}
        <div className="glass" style={{ borderRadius: 20, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ position: 'relative', width: 56, height: 56 }}>
              <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                <circle cx="28" cy="28" r="22" fill="none" stroke={compatColor} strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 22 * compat / 100} ${2 * Math.PI * 22}`}
                  strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: compatColor }}>{compat}</div>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0ff', marginBottom: 2 }}>{getCompatibilityLabel(compat)}</div>
              <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>Aura compatibility score</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {COMPAT_BREAKDOWN.map(b => (
              <CompatBar key={b.key} label={b.key} score={b.score} />
            ))}
          </div>
        </div>

        {/* AI Reason */}
        <div className="glass" style={{ borderRadius: 20, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Brain size={15} color="#a78bfa" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>Why Kindred matched you</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.6)', lineHeight: 1.7 }}>{aiReason}</p>
        </div>

        {/* Bio */}
        <div className="glass" style={{ borderRadius: 20, padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.5)', marginBottom: 10 }}>About {profile.name}</div>
          <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.7)', lineHeight: 1.7 }}>{profile.bio}</p>
        </div>

        {/* Details grid */}
        <div className="glass" style={{ borderRadius: 20, padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.5)', marginBottom: 12 }}>The details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Height', value: profile.height },
              { label: 'Education', value: profile.education },
              { label: 'Goal', value: profile.relationshipGoal },
              { label: 'Drinks', value: profile.drinking },
              { label: 'Smokes', value: profile.smoking },
              { label: 'Kids', value: profile.kids },
            ].filter(d => d.value).map(d => (
              <div key={d.label}>
                <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.3)', fontWeight: 500, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.label}</div>
                <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.7)', fontWeight: 500, textTransform: 'capitalize' }}>{d.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="glass" style={{ borderRadius: 20, padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.5)', marginBottom: 10 }}>Core values</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {profile.values.map(v => <span key={v} className="tag tag-violet" style={{ fontSize: 12 }}>{v}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchSuccessModal({ profile, onMessage, onClose }: { profile: UserProfile; onMessage: () => void; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,7,15,0.88)', backdropFilter: 'blur(16px)' }} onClick={onClose} />
      <div className="glass" style={{ position: 'relative', zIndex: 1, borderRadius: 28, padding: '48px 40px', maxWidth: 400, width: '100%', textAlign: 'center' }}>
        {/* Hearts animation */}
        <div style={{ position: 'relative', width: 120, height: 80, margin: '0 auto 24px' }}>
          <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', position: 'absolute', right: 0, top: 8, border: '3px solid #07070f' }} alt="" />
          <img src={profile.photos[0]} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', position: 'absolute', left: 0, top: 8, border: '3px solid #07070f' }} alt="" />
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', animation: 'heartbeat 1.5s ease-in-out infinite' }}>
            <Heart size={28} color="#f43f5e" fill="#f43f5e" />
          </div>
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }} className="gradient-text">It&apos;s a Match! 🎉</h2>
        <p style={{ fontSize: 15, color: 'rgba(240,240,255,0.5)', marginBottom: 28, lineHeight: 1.6 }}>
          You and <strong style={{ color: '#f0f0ff' }}>{profile.name}</strong> liked each other!<br />
          Start a conversation while the spark is fresh.
        </p>

        {/* AI conversation starter */}
        <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 14, padding: '14px 16px', marginBottom: 24, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Sparkles size={12} color="#a78bfa" />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa' }}>Kindred suggests</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.65)', lineHeight: 1.5 }}>
            &ldquo;Your sourdough struggles sound very relatable — mine took 6 attempts before a recognizable loaf. What are you naming yours?&rdquo;
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 14 }}>Keep Discovering</button>
          <button onClick={onMessage} className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 14 }}>
            Say Hello <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);
  const [showMatch, setShowMatch] = useState(false);

  const activeProfiles = DAILY_MATCHES.filter(p => !passed.includes(p.id));
  const current = activeProfiles[currentIdx] || null;

  const COMPAT_SCORES: Record<string, number> = { 'p-1': 94, 'p-2': 87, 'p-3': 85, 'p-4': 91, 'p-5': 88 };
  const AI_REASONS: Record<string, string> = {
    'p-1': "Both of you prioritize meaningful growth and creative pursuits. Sophie's visual thinking pairs beautifully with your analytical depth. You share a love of discovery — whether it's a hidden coffee shop or a new hiking trail.",
    'p-2': "Maya's adventurous spirit and scientific mind pair well with your curiosity. You both value honesty deeply and show commitment through action. Shared outdoor interests lay strong groundwork for activity-based bonding.",
    'p-3': "You share core values of ambition and growth, and both approach life with intellectual curiosity. Zara's directness complements your warmth. Your relationship goals align — both seeking something real, not performative.",
    'p-4': "Priya's nurturing nature and your warm personality create a rare emotional match. You both value intentionality — her in design, you in cooking. A shared love of hosting people suggests exceptional long-term compatibility.",
    'p-5': "Luna's intellectual depth and curiosity resonate with your own. You both value authentic conversation and find meaning in learning together. Your secure attachment style could help her grow into a more secure connection.",
  };

  function handleLike() {
    if (!current) return;
    setLiked(prev => [...prev, current.id]);
    // 50% chance of match for demo
    if (Math.random() > 0.5 || current.id === 'p-1') {
      setShowMatch(true);
    } else {
      nextProfile();
    }
  }

  function handlePass() {
    if (!current) return;
    setPassed(prev => [...prev, current.id]);
    nextProfile();
  }

  function handleSuperLike() {
    if (!current) return;
    setLiked(prev => [...prev, current.id]);
    setShowMatch(true);
  }

  function nextProfile() {
    setCurrentIdx(i => i + 1);
  }

  const compat = current ? (COMPAT_SCORES[current.id] || 80) : 0;
  const aiReason = current ? (AI_REASONS[current.id] || '') : '';

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>Today&apos;s Matches</h1>
          <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.4)' }}>5 curated daily matches · Resets in 6h 23m</p>
        </div>
        {/* Profile dots */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 4 }}>
          {DAILY_MATCHES.map((p, i) => (
            <button
              key={p.id}
              onClick={() => { setCurrentIdx(i); }}
              style={{
                width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${i === currentIdx ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                cursor: 'pointer', transition: 'border-color 0.2s', padding: 0,
                opacity: passed.includes(p.id) ? 0.35 : 1,
                position: 'relative',
              }}
            >
              <img src={p.photos[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {liked.includes(p.id) && !showMatch && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(139,92,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={12} color="white" fill="white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {current ? (
        <ProfileCard
          profile={current}
          compat={compat}
          aiReason={aiReason}
          onLike={handleLike}
          onPass={handlePass}
          onSuperLike={handleSuperLike}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>✨</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>That&apos;s all for today!</h2>
          <p style={{ fontSize: 15, color: 'rgba(240,240,255,0.4)', marginBottom: 24 }}>Your new matches arrive tomorrow at 8am. Check your existing matches in the meantime.</p>
          <button onClick={() => router.push('/app/matches')} className="btn-primary">View Your Matches</button>
        </div>
      )}

      {showMatch && current && (
        <MatchSuccessModal
          profile={current}
          onMessage={() => { setShowMatch(false); router.push('/app/messages'); }}
          onClose={() => { setShowMatch(false); nextProfile(); }}
        />
      )}

      <style>{`
        @media (max-width: 900px) {
          .discover-layout { grid-template-columns: 1fr !important; height: auto !important; }
          .discover-layout > div:last-child { max-height: 500px; }
        }
        @keyframes heartbeat { 0%,100%{transform:scale(1)} 14%{transform:scale(1.3)} 28%{transform:scale(1)} 42%{transform:scale(1.15)} 70%{transform:scale(1)} }
      `}</style>
    </div>
  );
}
