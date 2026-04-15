'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, X, Star, Brain, MapPin, Briefcase, CheckCircle, Sparkles, ArrowRight, ChevronDown } from 'lucide-react';
import { getCompatibilityColor, getCompatibilityLabel } from '@/lib/utils';
import type { UserProfile } from '@/lib/types';
import { ingestSignal, runAndGetRecommendations, toDiscoverProfiles } from '@/lib/matchmakingClient';

function CompatBar({ label, score }: { label: string; score: number }) {
  const color = getCompatibilityColor(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)', minWidth: 70, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, borderRadius: 3, background: color, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, width: 30, textAlign: 'right' }}>{score}</span>
    </div>
  );
}

function MatchSuccessModal({ profile, onMessage, onClose }: { profile: UserProfile; onMessage: () => void; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,7,15,0.88)', backdropFilter: 'blur(16px)' }} onClick={onClose} />
      <div className="glass" style={{ position: 'relative', zIndex: 1, borderRadius: 28, padding: '40px 32px', maxWidth: 380, width: '100%', textAlign: 'center', margin: '0 16px' }}>
        <div style={{ position: 'relative', width: 120, height: 80, margin: '0 auto 20px' }}>
          <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', position: 'absolute', right: 0, top: 10, border: '3px solid #07070f' }} alt="" />
          <img src={profile.photos[0]} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', position: 'absolute', left: 0, top: 10, border: '3px solid #07070f' }} alt="" />
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', animation: 'heartbeat 1.5s ease-in-out infinite' }}>
            <Heart size={26} color="#f43f5e" fill="#f43f5e" />
          </div>
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }} className="gradient-text">It&apos;s a Match! 🎉</h2>
        <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.5)', marginBottom: 24, lineHeight: 1.6 }}>
          You and <strong style={{ color: '#f0f0ff' }}>{profile.name}</strong> liked each other!
        </p>

        <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 14, padding: '14px 16px', marginBottom: 20, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Sparkles size={12} color="#a78bfa" />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa' }}>Vinculo suggests</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.65)', lineHeight: 1.5 }}>
            &ldquo;Your sourdough struggles sound very relatable — mine took 6 attempts before a recognizable loaf. What are you naming yours?&rdquo;
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 14 }}>Keep Going</button>
          <button onClick={onMessage} className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 14 }}>
            Say Hello <ArrowRight size={16} />
          </button>
        </div>
      </div>
      <style>{`@keyframes heartbeat { 0%,100%{transform:scale(1)} 14%{transform:scale(1.3)} 28%{transform:scale(1)} 42%{transform:scale(1.15)} 70%{transform:scale(1)} }`}</style>
    </div>
  );
}

// ── Mobile card (full-screen photo + scrollable detail) ──────────────────────
function MobileProfileCard({ profile, compat, aiReason, breakdown, onLike, onPass, onSuperLike }: {
  profile: UserProfile;
  compat: number;
  aiReason: string;
  breakdown: { key: string; score: number }[];
  onLike: () => void;
  onPass: () => void;
  onSuperLike: () => void;
}) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const compatColor = getCompatibilityColor(compat);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Photo card */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', maxHeight: '60vh', background: '#1a1a2e', overflow: 'hidden' }}>
        {profile.photos.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={profile.name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === photoIdx ? 1 : 0, transition: 'opacity 0.35s ease' }}
          />
        ))}

        {/* Tap zones for photo nav */}
        {profile.photos.length > 1 && (
          <>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '35%', zIndex: 3 }} onClick={() => setPhotoIdx(i => Math.max(0, i - 1))} />
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '35%', zIndex: 3 }} onClick={() => setPhotoIdx(i => Math.min(profile.photos.length - 1, i + 1))} />
            {/* Progress bars */}
            <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', gap: 4, zIndex: 4 }}>
              {profile.photos.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 2.5, borderRadius: 2, background: i === photoIdx ? 'white' : 'rgba(255,255,255,0.28)' }} />
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
        <div style={{ position: 'absolute', top: profile.photos.length > 1 ? 28 : 14, left: 14, zIndex: 4, background: 'rgba(7,7,15,0.72)', border: `1px solid ${compatColor}50`, borderRadius: 999, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(8px)' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: compatColor }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: compatColor }}>{compat}% match</span>
        </div>

        {/* Name / info overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 18px', zIndex: 4 }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{profile.name}, {profile.age}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Briefcase size={12} /> {profile.occupation}
            </span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} /> {profile.distance} km
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {profile.interests.slice(0, 3).map(i => (
              <span key={i} className="tag" style={{ fontSize: 11, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.85)' }}>{i}</span>
            ))}
          </div>

          {/* Scroll hint */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
            <ChevronDown size={13} />
            <span>Scroll for details</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="discover-mobile-actions" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, padding: '18px 24px' }}>
        <button className="action-btn action-pass" onClick={onPass} title="Pass" style={{ width: 56, height: 56 }}>
          <X size={22} />
        </button>
        <button className="action-btn action-like" onClick={onLike} title="Like" style={{ width: 68, height: 68 }}>
          <Heart size={28} fill="currentColor" />
        </button>
        <button className="action-btn action-super" onClick={onSuperLike} title="Super Like" style={{ width: 52, height: 52 }}>
          <Star size={18} fill="currentColor" />
        </button>
      </div>

      {/* Detail section — scrollable */}
      <div style={{ padding: '0 16px 130px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Compat ring + breakdown */}
        <div className="glass" style={{ borderRadius: 20, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
              <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                <circle cx="26" cy="26" r="20" fill="none" stroke={compatColor} strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 20 * compat / 100} ${2 * Math.PI * 20}`}
                  strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: compatColor }}>{compat}</div>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0ff', marginBottom: 2 }}>{getCompatibilityLabel(compat)}</div>
              <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>Compatibility overview</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {breakdown.map(b => <CompatBar key={b.key} label={b.key} score={b.score} />)}
          </div>
        </div>

        {/* AI Reason */}
        <div className="glass" style={{ borderRadius: 20, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Brain size={14} color="#a78bfa" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>Why this match makes sense</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.6)', lineHeight: 1.7 }}>{aiReason}</p>
        </div>

        {/* Bio */}
        <div className="glass" style={{ borderRadius: 20, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,240,255,0.45)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>About {profile.name}</div>
          <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.7)', lineHeight: 1.7 }}>{profile.bio}</p>
        </div>

        {/* Details */}
        <div className="glass" style={{ borderRadius: 20, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,240,255,0.45)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>The details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Height', value: profile.height },
              { label: 'Education', value: profile.education },
              { label: 'Goal', value: profile.relationshipGoal },
              { label: 'Drinks', value: profile.drinking },
              { label: 'Smokes', value: profile.smoking },
              { label: 'Kids', value: profile.kids },
            ].filter(d => d.value).map(d => (
              <div key={d.label}>
                <div style={{ fontSize: 10, color: 'rgba(240,240,255,0.3)', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.label}</div>
                <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.75)', fontWeight: 500, textTransform: 'capitalize' }}>{d.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="glass" style={{ borderRadius: 20, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,240,255,0.45)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Core values</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {profile.values.map(v => <span key={v} className="tag tag-violet" style={{ fontSize: 12 }}>{v}</span>)}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <button className="btn-ghost" onClick={onPass} style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
            <X size={16} /> Pass
          </button>
          <button className="btn-primary" onClick={onLike} style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
            <Heart size={16} fill="white" /> Like
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Desktop card (two-column layout) ────────────────────────────────────────
function DesktopProfileCard({ profile, compat, aiReason, breakdown, onLike, onPass, onSuperLike }: {
  profile: UserProfile;
  compat: number;
  aiReason: string;
  breakdown: { key: string; score: number }[];
  onLike: () => void;
  onPass: () => void;
  onSuperLike: () => void;
}) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const compatColor = getCompatibilityColor(compat);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, height: 620 }}>
      {/* Photo card */}
      <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', background: '#1a1a2e' }}>
        {profile.photos.map((src, i) => (
          <img key={i} src={src} alt={profile.name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === photoIdx ? 1 : 0, transition: 'opacity 0.4s ease' }}
          />
        ))}

        {profile.photos.length > 1 && (
          <>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '35%', cursor: 'pointer', zIndex: 3 }} onClick={() => setPhotoIdx(i => Math.max(0, i - 1))} />
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '35%', cursor: 'pointer', zIndex: 3 }} onClick={() => setPhotoIdx(i => Math.min(profile.photos.length - 1, i + 1))} />
            <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', gap: 4, zIndex: 4 }}>
              {profile.photos.map((_, i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i === photoIdx ? 'white' : 'rgba(255,255,255,0.3)' }} />)}
            </div>
          </>
        )}

        <div className="match-overlay" />

        {profile.isVerified && (
          <div style={{ position: 'absolute', top: 22, right: 14, zIndex: 4, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 999, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle size={11} color="#34d399" />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399' }}>Verified</span>
          </div>
        )}

        <div style={{ position: 'absolute', top: profile.photos.length > 1 ? 30 : 14, left: 14, zIndex: 4, background: 'rgba(7,7,15,0.7)', border: `1px solid ${compatColor}40`, borderRadius: 999, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(8px)' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: compatColor }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: compatColor }}>{compat}% match</span>
        </div>

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

        <div style={{ position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 14, alignItems: 'center', zIndex: 5 }}>
          <button className="action-btn action-pass" onClick={onPass}><X size={22} /></button>
          <button className="action-btn action-like" onClick={onLike}><Heart size={26} fill="currentColor" /></button>
          <button className="action-btn action-super" onClick={onSuperLike}><Star size={18} fill="currentColor" /></button>
        </div>
      </div>

      {/* Detail panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', paddingRight: 4, paddingBottom: 40 }}>
        <div className="glass" style={{ borderRadius: 20, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ position: 'relative', width: 56, height: 56 }}>
              <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                <circle cx="28" cy="28" r="22" fill="none" stroke={compatColor} strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 22 * compat / 100} ${2 * Math.PI * 22}`}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: compatColor }}>{compat}</div>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0ff', marginBottom: 2 }}>{getCompatibilityLabel(compat)}</div>
              <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>Compatibility overview</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {breakdown.map(b => <CompatBar key={b.key} label={b.key} score={b.score} />)}
          </div>
        </div>

        <div className="glass" style={{ borderRadius: 20, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Brain size={15} color="#a78bfa" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>Why this match makes sense</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.6)', lineHeight: 1.7 }}>{aiReason}</p>
        </div>

        <div className="glass" style={{ borderRadius: 20, padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.5)', marginBottom: 10 }}>About {profile.name}</div>
          <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.7)', lineHeight: 1.7 }}>{profile.bio}</p>
        </div>

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

export default function DiscoverPage() {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);
  const [showMatch, setShowMatch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [discoverCards, setDiscoverCards] = useState<Array<{
    profile: UserProfile;
    compatibilityScore: number;
    breakdown: {
      values: number;
      communication: number;
      lifestyle: number;
      interests: number;
      goals: number;
      emotional: number;
    };
    aiReason: string;
  }>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const recs = await runAndGetRecommendations('user-1', 12);
      if (cancelled) return;
      setDiscoverCards(toDiscoverProfiles(recs));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeCards = discoverCards.filter(card => !passed.includes(card.profile.id));
  const current = activeCards[currentIdx] || null;

  function handleLike() {
    if (!current) return;
    setLiked(prev => [...prev, current.profile.id]);
    void ingestSignal({
      actorUserId: 'user-1',
      targetUserId: current.profile.id,
      type: 'like',
      metadata: { source: 'discover' },
    });
    if (current.compatibilityScore >= 88) {
      setShowMatch(true);
    } else {
      nextProfile();
    }
  }

  function handlePass() {
    if (!current) return;
    setPassed(prev => [...prev, current.profile.id]);
    void ingestSignal({
      actorUserId: 'user-1',
      targetUserId: current.profile.id,
      type: 'pass',
      metadata: { source: 'discover' },
    });
    nextProfile();
  }

  function handleSuperLike() {
    if (!current) return;
    setLiked(prev => [...prev, current.profile.id]);
    void ingestSignal({
      actorUserId: 'user-1',
      targetUserId: current.profile.id,
      type: 'like',
      metadata: { source: 'discover', superLike: true },
    });
    setShowMatch(true);
  }

  function nextProfile() {
    setCurrentIdx(i => i + 1);
  }

  const compat = current?.compatibilityScore ?? 0;
  const aiReason = current?.aiReason ?? '';
  const compatBreakdown: { key: string; score: number }[] = current
    ? [
        { key: 'Values', score: current.breakdown.values },
        { key: 'Communication', score: current.breakdown.communication },
        { key: 'Lifestyle', score: current.breakdown.lifestyle },
        { key: 'Goals', score: current.breakdown.goals },
        { key: 'Emotional', score: current.breakdown.emotional },
        { key: 'Interests', score: current.breakdown.interests },
      ]
    : [];

  const emptyState = (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✨</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>That&apos;s all for today!</h2>
      <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.4)', marginBottom: 24, lineHeight: 1.7 }}>Your new matches arrive tomorrow at 8am. Check your existing matches in the meantime.</p>
      <button onClick={() => router.push('/app/matches')} className="btn-primary">View Your Matches</button>
    </div>
  );

  return (
    <>
      {/* Mobile layout */}
      <div className="discover-mobile">
        {/* Profile selector strip */}
        <div style={{ display: 'flex', gap: 10, padding: '14px 16px 10px', overflowX: 'auto' }}>
          {activeCards.map((card, i) => {
            const p = card.profile;
            return (
            <button
              key={p.id}
              onClick={() => setCurrentIdx(i)}
              style={{
                flexShrink: 0,
                width: 38, height: 38,
                borderRadius: '50%',
                overflow: 'hidden',
                border: `2.5px solid ${i === currentIdx ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                cursor: 'pointer',
                padding: 0,
                opacity: passed.includes(p.id) ? 0.3 : 1,
                position: 'relative',
                transition: 'border-color 0.2s, opacity 0.2s',
              }}
            >
              <img src={p.photos[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {liked.includes(p.id) && !showMatch && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(139,92,246,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={12} color="white" fill="white" />
                </div>
              )}
            </button>
            );
          })}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', paddingLeft: 4 }}>
            <span style={{ fontSize: 12, color: 'rgba(240,240,255,0.3)', whiteSpace: 'nowrap' }}>Resets 6h</span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: 'rgba(240,240,255,0.5)', fontSize: 14 }}>Loading your matches…</div>
        ) : current ? (
          <MobileProfileCard
            profile={current.profile}
            compat={compat}
            aiReason={aiReason}
            breakdown={compatBreakdown}
            onLike={handleLike}
            onPass={handlePass}
            onSuperLike={handleSuperLike}
          />
        ) : emptyState}
      </div>

      {/* Desktop layout */}
      <div className="discover-desktop" style={{ padding: '32px 32px 48px', maxWidth: 1100, width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>Today&apos;s Matches</h1>
            <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.4)' }}>{activeCards.length} curated daily matches · Resets in 6h 23m</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 4 }}>
            {activeCards.map((card, i) => {
              const p = card.profile;
              return (
              <button
                key={p.id}
                onClick={() => setCurrentIdx(i)}
                style={{
                  width: 34, height: 34, borderRadius: '50%', overflow: 'hidden',
                  border: `2px solid ${i === currentIdx ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                  cursor: 'pointer', padding: 0, opacity: passed.includes(p.id) ? 0.35 : 1,
                  position: 'relative', transition: 'border-color 0.2s',
                }}
              >
                <img src={p.photos[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {liked.includes(p.id) && !showMatch && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(139,92,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heart size={12} color="white" fill="white" />
                  </div>
                )}
              </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '72px 16px', color: 'rgba(240,240,255,0.5)', fontSize: 14 }}>Loading your matches…</div>
        ) : current ? (
          <DesktopProfileCard
            profile={current.profile}
            compat={compat}
            aiReason={aiReason}
            breakdown={compatBreakdown}
            onLike={handleLike}
            onPass={handlePass}
            onSuperLike={handleSuperLike}
          />
        ) : emptyState}
      </div>

      {showMatch && current && (
        <MatchSuccessModal
          profile={current.profile}
          onMessage={() => { setShowMatch(false); router.push('/app/messages'); }}
          onClose={() => { setShowMatch(false); nextProfile(); }}
        />
      )}

      {/* Vinculo Stories */}
      <div className="vinculo-stories" style={{ padding: '32px 32px 48px', maxWidth: 1100, width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Vinculo Stories ✨</h2>
            <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.4)' }}>Real couples who found each other here.</p>
          </div>
        </div>
        <div className="stories-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            {
              names: 'James & Priya',
              photos: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&q=80'],
              compat: 93,
              together: '8 months',
              story: '"We matched at 93% and I thought it was just an algorithm. Our first Spark question made me realize she thought about the world the same way I did. We got engaged last month."',
            },
            {
              names: 'Alex & Sam',
              photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80'],
              compat: 91,
              together: '14 months',
              story: '"I\'d given up on apps. Vinculo was different because it felt like it actually read me. The AI Coach told me not to overthink the first message. Best advice I\'ve ever gotten."',
            },
            {
              names: 'Marcus & Elena',
              photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&q=80'],
              compat: 97,
              together: '6 months',
              story: '"97% compatibility felt unreal. The Spark questions made us go deep before we even met. By date one it felt like we\'d known each other for years. We moved in together at month five."',
            },
          ].map(s => (
            <div key={s.names} className="glass card-lift" style={{ borderRadius: 20, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ display: 'flex' }}>
                  {s.photos.map((src, i) => (
                    <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '2px solid #07070f', marginLeft: i > 0 ? -10 : 0 }}>
                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{s.names}</div>
                  <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.4)' }}>Together {s.together} · {s.compat}% match</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.6)', lineHeight: 1.7, fontStyle: 'italic' }}>{s.story}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .discover-mobile { display: block; }
        .discover-desktop { display: none; }
        @media (min-width: 768px) {
          .discover-mobile { display: none; }
          .discover-desktop { display: block; }
        }
        @media (max-width: 767px) {
          .discover-mobile-actions {
            position: fixed;
            left: 0;
            right: 0;
            bottom: calc(56px + env(safe-area-inset-bottom, 0px));
            z-index: 999;
            background: linear-gradient(to top, rgba(7,7,15,0.95), rgba(7,7,15,0.65));
            backdrop-filter: blur(8px);
          }
          .vinculo-stories { padding: 24px 16px 32px !important; }
          .stories-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
