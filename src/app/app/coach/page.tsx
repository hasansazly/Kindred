'use client';

import { useState } from 'react';
import { Brain, AlertTriangle, TrendingUp, Lightbulb, Sparkles, CheckCircle } from 'lucide-react';

const DATE_PREP = {
  name: 'Sophie',
  photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&q=80',
  compat: 94,
  date: 'Saturday, Apr 19',
  activity: 'Farmers market + cook together',
  talkingPoints: [
    "She loves local food markets — let her lead the way, you follow with curiosity.",
    "Ask about her creative project (she referenced 'something I'm building' in chat).",
    "She's direct and articulate — match her energy, be honest rather than impressive.",
  ],
  avoid: [
    "Don't bring up your ex — she values emotional readiness as a non-negotiable.",
    "Don't fill every silence. She actually finds comfortable quiet meaningful.",
  ],
  aiTip: "Sophie's attachment style leans secure with slight anxious traits. She responds well to concrete plans and clear intentions. After the date, a simple specific text goes a long way — don't overthink it.",
};

const MULTI_MATCH_INTEL = [
  { name: 'Sophie',  photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&q=80', compat: 94, messages: 47, potential: 96, trend: '+4', status: 'Hot 🔥', color: '#34d399' },
  { name: 'Aria',    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80', compat: 89, messages: 23, potential: 82, trend: '+2', status: 'Warm ✨', color: '#a78bfa' },
  { name: 'Maya',    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80', compat: 91, messages: 8,  potential: 78, trend: '-3', status: 'Cooling', color: '#fbbf24' },
];

type Section = 'overview' | 'dateprep' | 'debrief' | 'intel';

export default function CoachPage() {
  const [section, setSection] = useState<Section>('overview');
  const [rating, setRating] = useState(0);
  const [debriefNotes, setDebriefNotes] = useState('');
  const [debriefDone, setDebriefDone] = useState(false);

  return (
    <div className="app-interior-page app-page-shell coach-page" style={{ maxWidth: 780, color: '#FFFFFF' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(219,39,119,0.2))', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={18} color="#a78bfa" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#FFFFFF' }}>AI Coach</h1>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Your personal relationship intelligence. Learns you, advises you, grows with you.</p>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 2 }}>
        {([
          ['overview', '🧠 Overview'],
          ['dateprep', '📅 Date Prep'],
          ['debrief', '💬 Debrief'],
          ['intel',   '📊 Match Intel'],
        ] as [Section, string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setSection(val)}
            className={`app-tab-chip ${section === val ? 'is-active' : ''}`}
            style={{ flexShrink: 0 }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {section === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(219,39,119,0.1))', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 22, padding: '22px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>This Week — AI Digest</div>
            <p style={{ fontSize: 15, color: 'rgba(240,240,255,0.8)', lineHeight: 1.8, marginBottom: 18 }}>
              You had your strongest Spark week yet. Sophie&apos;s responses show high emotional availability — she&apos;s ready for a real date if you haven&apos;t planned one. Your conversation with Maya has slowed — send a genuine check-in, not small talk.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { label: 'Top match potential', value: 'Sophie — 96%', color: '#34d399' },
                { label: 'Action needed', value: 'Reach out to Maya', color: '#fbbf24' },
                { label: 'Spark streak', value: '12 days 🔥', color: '#fb923c' },
              ].map(item => (
                <div key={item.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 14px' }}>
                  <div style={{ fontSize: 10, color: 'rgba(240,240,255,0.35)', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="coach-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: '📅', title: 'Prep for Saturday', sub: "Farmers market with Sophie", s: 'dateprep', color: '#34d399', colorBg: 'rgba(52,211,153,0.1)', colorBorder: 'rgba(52,211,153,0.2)' },
              { icon: '📊', title: 'Match Intelligence', sub: 'Compare your 3 active connections', s: 'intel', color: '#a78bfa', colorBg: 'rgba(167,139,250,0.1)', colorBorder: 'rgba(167,139,250,0.2)' },
              { icon: '💬', title: 'Post-date Debrief', sub: 'How did your last date go?', s: 'debrief', color: '#60a5fa', colorBg: 'rgba(96,165,250,0.1)', colorBorder: 'rgba(96,165,250,0.2)' },
              { icon: '💡', title: 'Coaching Insight', sub: 'Your weekly growth note', s: 'overview', color: '#fbbf24', colorBg: 'rgba(251,191,36,0.1)', colorBorder: 'rgba(251,191,36,0.2)' },
            ].map(item => (
              <div key={item.title} onClick={() => setSection(item.s as Section)} className="card-lift" style={{ borderRadius: 18, padding: '18px', cursor: 'pointer', background: item.colorBg, border: `1px solid ${item.colorBorder}` }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#FFFFFF' }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', lineHeight: 1.4, marginBottom: 12 }}>{item.sub}</div>
                <span style={{ fontSize: 12, color: item.color, fontWeight: 600 }}>Open →</span>
              </div>
            ))}
          </div>

          <div className="glass" style={{ borderRadius: 20, padding: '20px 22px', background: '#FFFFFF', border: '1px solid #E5E3DF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Lightbulb size={15} color="#fbbf24" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>Coach&apos;s Insight</span>
            </div>
            <p style={{ fontSize: 14, color: '#1A1A2E', lineHeight: 1.8 }}>
              Based on your Spark answers, you tend to open up gradually — which is healthy. But you sometimes over-explain when uncertain. Try being comfortable saying &ldquo;I&apos;m not sure&rdquo; without filling the silence.
            </p>
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 10, fontSize: 12, color: '#A05A00' }}>
              📚 Related: Communication Mastery → Lesson 3
            </div>
          </div>
        </div>
      )}

      {/* ── DATE PREP ── */}
      {section === 'dateprep' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: '2.5px solid rgba(52,211,153,0.4)', flexShrink: 0 }}>
              <img src={DATE_PREP.photo} alt={DATE_PREP.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Pre-date Brief: {DATE_PREP.name}</div>
              <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.5)' }}>{DATE_PREP.date} · {DATE_PREP.activity}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#34d399', flexShrink: 0 }}>{DATE_PREP.compat}% match</div>
          </div>

          <div className="glass" style={{ borderRadius: 20, padding: '20px 22px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} color="#34d399" /> Good talking points
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {DATE_PREP.talkingPoints.map((point, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399' }}>{i + 1}</span>
                  </div>
                  <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.7)', lineHeight: 1.6, margin: 0 }}>{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass" style={{ borderRadius: 20, padding: '20px 22px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fb7185', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} color="#fb7185" /> Worth keeping in mind
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DATE_PREP.avoid.map((point, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fb7185', flexShrink: 0, marginTop: 7 }} />
                  <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.65)', lineHeight: 1.6, margin: 0 }}>{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 20, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Brain size={15} color="#a78bfa" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>AI Coach</span>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.7)', lineHeight: 1.8 }}>{DATE_PREP.aiTip}</p>
          </div>
        </div>
      )}

      {/* ── DEBRIEF ── */}
      {section === 'debrief' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!debriefDone ? (
            <div className="glass" style={{ borderRadius: 20, padding: '22px 24px' }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>How did it go with Sophie?</div>
              <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.45)', marginBottom: 20 }}>Your answer is private. This helps your AI Coach improve its advice for next time.</p>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.6)', marginBottom: 10 }}>Overall vibe</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setRating(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, fontSize: 32, opacity: n <= rating ? 1 : 0.25, transition: 'all 0.15s', transform: n <= rating ? 'scale(1.1)' : 'scale(1)' }}>⭐</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.6)', marginBottom: 10 }}>How did you feel?</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['Connected', 'Nervous', 'Comfortable', 'Excited', 'Unsure', 'Attracted', 'Awkward', 'Natural'].map(f => (
                    <button key={f} style={{ padding: '7px 14px', borderRadius: 999, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(240,240,255,0.6)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{f}</button>
                  ))}
                </div>
              </div>

              <textarea
                className="input-field"
                placeholder="Anything specific stand out? The coach will adapt your future advice."
                rows={4}
                value={debriefNotes}
                onChange={e => setDebriefNotes(e.target.value)}
                style={{ resize: 'none', lineHeight: 1.65, marginBottom: 16 }}
              />

              <button onClick={() => setDebriefDone(true)} disabled={rating === 0} className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: rating > 0 ? 1 : 0.4 }}>
                <Sparkles size={15} /> Get AI analysis
              </button>
            </div>
          ) : (
            <>
              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 20, padding: '22px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Debrief locked in</div>
                <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.5)' }}>Your coach has analyzed the date. Here&apos;s the read.</p>
              </div>
              <div className="glass" style={{ borderRadius: 20, padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Brain size={16} color="#a78bfa" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>AI Coach Analysis</span>
                </div>
                <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.7)', lineHeight: 1.8, marginBottom: 16 }}>
                  A {rating}/5 is a strong result. Based on your notes, the connection was genuine — not just surface chemistry. Your next move: suggest a specific plan within 3 days. Vague &ldquo;let&apos;s do this again&rdquo; leads to drift. Be concrete.
                </p>
                <div style={{ padding: '12px 16px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 12, fontSize: 13, color: '#c4b5fd' }}>
                  💡 Suggested text: <em>&ldquo;That was genuinely fun. I&apos;m thinking [specific plan] — you in?&rdquo;</em>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── MATCH INTEL ── */}
      {section === 'intel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass" style={{ borderRadius: 20, padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <TrendingUp size={15} color="#a78bfa" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>Multi-match Intelligence</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.45)', lineHeight: 1.6 }}>Potential score = compatibility + conversation momentum + emotional alignment.</p>
          </div>

          {MULTI_MATCH_INTEL.map((match, i) => (
            <div key={match.name} className="glass" style={{ borderRadius: 20, padding: '20px 22px', border: i === 0 ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${match.color}66` }}>
                    <img src={match.photo} alt={match.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  {i === 0 && <div style={{ position: 'absolute', top: -4, right: -4, fontSize: 14 }}>👑</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{match.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>{match.compat}% compat · {match.messages} messages</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: match.color, background: `${match.color}15`, border: `1px solid ${match.color}33`, borderRadius: 999, padding: '3px 10px', marginBottom: 4 }}>{match.status}</div>
                  <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.35)', textAlign: 'center' }}>trend {match.trend}%</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)' }}>AI Potential Score</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: match.color }}>{match.potential}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${match.potential}%`, background: match.color, borderRadius: 3 }} />
              </div>
            </div>
          ))}

          <div style={{ padding: '16px 20px', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.16)', borderRadius: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 8 }}>🧠 Coach recommendation</div>
            <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.6)', lineHeight: 1.7 }}>
              Sophie is clearly your strongest connection. Double down — plan a second date. Send Maya a genuine, thoughtful message this week before she fully disengages. Aria is steady, no action needed yet.
            </p>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 767px) {
          .coach-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 380px) {
          .coach-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
