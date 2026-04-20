'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle, Lock, Flame, Brain, Coffee, Sparkles,
  Heart, Star, MessageCircle, Calendar, ChevronRight, Camera,
  TrendingUp, Clock, Zap, Users,
} from 'lucide-react';
import { MATCHES } from '@/lib/mockData';
import { CONNECTION_STAGES } from '@/lib/sparkData';
import { getCompatibilityColor, formatRelativeTime } from '@/lib/utils';

const CURRENT_STAGE = 3; // "Connected" — demo value

const CHEMISTRY_DATA = [
  { date: 'Day 1', score: 62, note: 'First messages — cautious but warm' },
  { date: 'Day 2', score: 68, note: 'Opened up about work and interests' },
  { date: 'Day 3', score: 74, note: 'First Spark question revealed — strong alignment on values' },
  { date: 'Day 5', score: 79, note: 'Conversation getting longer and more personal' },
  { date: 'Day 7', score: 85, note: '7-day streak — consistently engaged' },
];

const MILESTONES = [
  { label: 'Matched',          done: true,  date: '7 days ago',   icon: '💫' },
  { label: 'First message',   done: true,  date: '7 days ago',   icon: '👋' },
  { label: '5 Spark answers', done: true,  date: '5 days ago',   icon: '🔥' },
  { label: 'Planned a date',  done: false, date: null,           icon: '☕' },
  { label: 'First date',      done: false, date: null,           icon: '✨' },
  { label: 'Exclusive',       done: false, date: null,           icon: '💍' },
];

const AI_INSIGHTS = [
  { icon: TrendingUp,    color: '#34d399', text: 'Your conversation length has grown 40% over the past week — a strong sign of deepening connection.' },
  { icon: Clock,         color: '#a78bfa', text: "You both tend to respond within 20 minutes. Matched response energy is a compatibility green flag." },
  { icon: Brain,         color: '#fbbf24', text: "You've aligned on 4 out of 5 core values explored in Spark questions so far." },
  { icon: Zap,           color: '#fb7185', text: "Sophie uses humor frequently in responses — your playful tone matches well with hers." },
];

function ChemistryGraph({ data }: { data: typeof CHEMISTRY_DATA }) {
  const max = 100;
  const min = 50;
  const range = max - min;
  const width = 100 / (data.length - 1);

  return (
    <div style={{ position: 'relative', height: 120, marginTop: 8 }}>
      {/* Grid lines */}
      {[60, 70, 80].map(v => (
        <div key={v} style={{ position: 'absolute', left: 0, right: 0, bottom: `${((v - min) / range) * 100}%`, borderTop: '1px dashed rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: 'rgba(240,240,255,0.2)', paddingLeft: 0, marginTop: -8, position: 'absolute', right: 0 }}>{v}</span>
        </div>
      ))}

      {/* SVG line chart */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="chem-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <polygon
          points={[
            ...data.map((d, i) => `${i * width}%,${100 - ((d.score - min) / range) * 100}%`),
            `${(data.length - 1) * width}%,100%`,
            '0%,100%',
          ].join(' ')}
          fill="url(#chem-grad)"
        />
        {/* Line */}
        <polyline
          points={data.map((d, i) => `${i * width}%,${100 - ((d.score - min) / range) * 100}%`).join(' ')}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={`${i * width}%`}
            cy={`${100 - ((d.score - min) / range) * 100}%`}
            r="5"
            fill="#8b5cf6"
            stroke="#0f0f1a"
            strokeWidth="2"
          />
        ))}
      </svg>

      {/* X labels */}
      <div style={{ position: 'absolute', bottom: -20, left: 0, right: 0, display: 'flex', justifyContent: 'space-between' }}>
        {data.map((d, i) => (
          <span key={i} style={{ fontSize: 10, color: 'rgba(240,240,255,0.3)', textAlign: 'center' }}>{d.date}</span>
        ))}
      </div>
    </div>
  );
}

export default function JourneyPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  const match = MATCHES.find(m => m.id === matchId) || MATCHES[0];
  const profile = match.profile;
  const [showPreDateModal, setShowPreDateModal] = useState(false);
  const [checkInDone, setCheckInDone] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState('');
  const compatColor = getCompatibilityColor(match.compatibilityScore);

  return (
    <div className="app-interior-page app-page-shell journey-page" style={{ maxWidth: 860 }}>
      {/* Back */}
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,240,255,0.5)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontFamily: 'inherit', padding: 0 }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Profile hero */}
      <div className="glass" style={{ borderRadius: 22, padding: '24px', marginBottom: 20, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${compatColor}50` }}>
            <img src={profile.photos[0]} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: '50%', background: '#34d399', border: '2px solid #0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={11} color="white" />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Your journey with {profile.name}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: compatColor, fontWeight: 600 }}>{match.compatibilityScore}% compatible</span>
            <span style={{ fontSize: 13, color: 'rgba(240,240,255,0.4)' }}>Matched {formatRelativeTime(match.matchedAt)}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#fb923c' }}>
              <Flame size={13} /> 4-day Spark streak
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => router.push(`/app/messages/${match.id}`)} className="btn-ghost" style={{ fontSize: 13, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MessageCircle size={14} /> Message
          </button>
          <button onClick={() => router.push('/app/spark')} className="btn-primary" style={{ fontSize: 13, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Flame size={14} /> Today&apos;s Spark
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="journey-grid">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Connection Journey Arc */}
          <div className="glass" style={{ borderRadius: 22, padding: '22px 24px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(240,240,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 18 }}>Connection Journey</div>

            <div style={{ position: 'relative', paddingLeft: 32 }}>
              {/* Vertical line */}
              <div style={{ position: 'absolute', left: 11, top: 12, bottom: 12, width: 2, background: 'rgba(255,255,255,0.07)', borderRadius: 1 }} />

              {CONNECTION_STAGES.map((stage, i) => {
                const isDone = stage.stage <= CURRENT_STAGE;
                const isCurrent = stage.stage === CURRENT_STAGE;
                const isLocked = stage.stage > CURRENT_STAGE;

                return (
                  <div key={stage.stage} style={{ display: 'flex', gap: 14, marginBottom: i < CONNECTION_STAGES.length - 1 ? 20 : 0, position: 'relative' }}>
                    {/* Node */}
                    <div style={{ position: 'absolute', left: -32, top: 0, width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDone ? (isCurrent ? 'rgba(139,92,246,0.25)' : 'rgba(52,211,153,0.15)') : 'rgba(255,255,255,0.05)', border: `2px solid ${isDone ? (isCurrent ? '#8b5cf6' : '#34d399') : 'rgba(255,255,255,0.1)'}`, zIndex: 1, fontSize: 11 }}>
                      {isDone && !isCurrent ? <CheckCircle size={13} color="#34d399" /> : <span>{stage.icon}</span>}
                    </div>

                    <div style={{ flex: 1, paddingTop: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: isCurrent ? 700 : 600, color: isDone ? (isCurrent ? '#c4b5fd' : 'rgba(240,240,255,0.8)') : 'rgba(240,240,255,0.3)' }}>
                          {stage.label}
                        </span>
                        {isCurrent && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', borderRadius: 999, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Now</span>
                        )}
                        {isLocked && <Lock size={11} color="rgba(240,240,255,0.2)" />}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.35)', marginBottom: isLocked ? 4 : 0 }}>{stage.desc}</div>
                      {isLocked && (
                        <div style={{ fontSize: 11, color: 'rgba(139,92,246,0.5)' }}>Unlocks: {stage.unlocks}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Advance stage CTA */}
            <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa', marginBottom: 4 }}>
                Next: {CONNECTION_STAGES[CURRENT_STAGE].icon} {CONNECTION_STAGES[CURRENT_STAGE].label}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)', marginBottom: 12 }}>
                Unlocks: {CONNECTION_STAGES[CURRENT_STAGE].unlocks}
              </div>
              <button
                onClick={() => setShowPreDateModal(true)}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: 13, padding: '11px' }}
              >
                <Coffee size={14} />
                Mark &ldquo;We&apos;re planning to meet&rdquo;
              </button>
            </div>
          </div>

          {/* Milestones */}
          <div className="glass" style={{ borderRadius: 22, padding: '22px 24px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(240,240,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Milestones</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MILESTONES.map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: m.done ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${m.done ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                    {m.done ? <CheckCircle size={14} color="#34d399" /> : <span style={{ opacity: 0.4 }}>{m.icon}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: m.done ? 'rgba(240,240,255,0.75)' : 'rgba(240,240,255,0.3)' }}>{m.label}</span>
                    {m.date && <span style={{ fontSize: 11, color: 'rgba(240,240,255,0.3)', marginLeft: 8 }}>{m.date}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Chemistry Arc */}
          <div className="glass" style={{ borderRadius: 22, padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(240,240,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Chemistry Arc</div>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#8b5cf6' }}>85 <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(240,240,255,0.4)' }}>/ 100</span></span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)', marginBottom: 16 }}>
              Growing ↑ +23 points since day 1
            </div>
            <ChemistryGraph data={CHEMISTRY_DATA} />
            <div style={{ marginTop: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,240,255,0.35)', marginBottom: 10 }}>Today&apos;s check-in</div>
              {!checkInDone ? (
                <div>
                  <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.55)', marginBottom: 12 }}>How does this connection feel right now?</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { label: '🔥 Amazing', value: 'amazing', color: '#fb923c' },
                      { label: '😊 Good', value: 'good', color: '#34d399' },
                      { label: '🤔 Uncertain', value: 'uncertain', color: '#fbbf24' },
                      { label: '😐 Off', value: 'off', color: '#94a3b8' },
                    ].map(f => (
                      <button
                        key={f.value}
                        onClick={() => { setSelectedFeeling(f.value); setCheckInDone(true); }}
                        style={{ padding: '10px', borderRadius: 10, border: `1.5px solid ${selectedFeeling === f.value ? f.color + '60' : 'rgba(255,255,255,0.08)'}`, background: selectedFeeling === f.value ? f.color + '15' : 'rgba(255,255,255,0.03)', color: selectedFeeling === f.value ? f.color : 'rgba(240,240,255,0.55)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                  <CheckCircle size={18} color="#34d399" style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: 13, color: '#34d399', fontWeight: 600 }}>Check-in logged!</div>
                  <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)', marginTop: 4 }}>
                    {profile.name}&apos;s check-in will be revealed at midnight.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Relationship Insights */}
          <div className="glass" style={{ borderRadius: 22, padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Brain size={15} color="#a78bfa" />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(240,240,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>AI Insights</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {AI_INSIGHTS.map((insight, i) => {
                const Icon = insight.icon;
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: `${insight.color}14`, border: `1px solid ${insight.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Icon size={14} color={insight.color} />
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.6)', lineHeight: 1.6, margin: 0 }}>{insight.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vinculo Moments */}
          <div className="glass" style={{ borderRadius: 22, padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Vinculo Moments</div>
                <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>Send a &quot;thinking of you&quot; pulse · 2 left today</div>
              </div>
              <div style={{ fontSize: 22 }}>🫀</div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <button
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '11px', background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
                onClick={() => {}}
              >
                <Heart size={14} fill="currentColor" />
                Send a moment
              </button>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '11px' }}>
                <Calendar size={14} />
                Plan a date
              </button>
            </div>
            {/* Received moments */}
            <div style={{ background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.18)', borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fda4af', marginBottom: 4 }}>💗 {profile.name} sent you a moment</div>
              <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.35)' }}>Today at 2:34 pm — she was thinking of you.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pre-Date Modal */}
      {showPreDateModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,7,15,0.88)', backdropFilter: 'blur(16px)' }} onClick={() => setShowPreDateModal(false)} />
          <div className="glass" style={{ position: 'relative', zIndex: 1, borderRadius: 28, padding: '40px 36px', maxWidth: 480, width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>☕</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Pre-Date Card</h2>
              <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.5)', lineHeight: 1.7 }}>
                Before you meet, both of you privately answer 3 questions. Your answers reveal at the same time — perfect first-date conversation starters.
              </p>
            </div>

            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 14, padding: '16px', marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fde68a', marginBottom: 10 }}>Your 3 pre-date questions:</div>
              {[
                "What's something you've been looking forward to recently?",
                "What's one thing you hope we have in common that we haven't discovered yet?",
                "What would make this date feel like a success to you?",
              ].map((q, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 2 ? 10 : 0 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fde68a', flexShrink: 0 }}>{i + 1}</div>
                  <span style={{ fontSize: 13, color: 'rgba(240,240,255,0.65)', lineHeight: 1.5 }}>{q}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowPreDateModal(false)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 14 }}>Later</button>
              <button onClick={() => setShowPreDateModal(false)} className="btn-primary" style={{ flex: 2, justifyContent: 'center', fontSize: 14 }}>
                <Sparkles size={15} />
                Send Pre-Date Card to {profile.name}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 767px) {
          .journey-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
