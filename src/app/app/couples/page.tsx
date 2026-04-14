'use client';

import { useState } from 'react';
import {
  Heart, Sparkles, Brain, Star, Calendar, Camera, MessageCircle,
  Coffee, Mountain, Music, Film, CheckCircle, Flame, Lock,
  TrendingUp, Gift, ChevronRight, ArrowRight, Plus, Mic,
} from 'lucide-react';

const COUPLE = {
  name: 'Sophie',
  photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&q=80',
  myPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80',
  together: '23 days',
  since: 'March 21, 2026',
  compatScore: 94,
  nextDate: 'Saturday, Apr 19',
  nextDateActivity: 'Farmers market + cook together',
};

const DAILY_QUESTION = {
  question: "What's one small thing I do that makes you feel most seen?",
  category: 'Intimacy',
  myAnswer: null as string | null,
  theirAnswer: null as string | null,
};

const MEMORIES = [
  { id: 1, date: 'Apr 14', emoji: '☕', label: 'First coffee', note: 'Blue Bottle, 11am. She was 3 minutes early.' },
  { id: 2, date: 'Apr 5', emoji: '🍝', label: 'Cooking together', note: 'Pasta carbonara. She claimed she invented a better technique.' },
  { id: 3, date: 'Apr 1', emoji: '📸', label: 'Golden Gate walk', note: 'Foggy. Both underdressed. Worth it.' },
];

const GROWTH_AREAS = [
  { label: 'Meeting each other\'s world', desc: 'You\'ve talked about your work deeply — consider sharing your friend group next.', icon: Users2, color: '#a78bfa' },
  { label: 'Navigating disagreement', desc: 'Your Spark answers suggest different conflict styles. Worth exploring early.', icon: Brain, color: '#fb7185' },
  { label: 'Physical quality time', desc: 'Most of your time together has been over food. Mix in more active shared experiences.', icon: Mountain, color: '#34d399' },
];

const DATE_IDEAS_COUPLES = [
  { title: 'Cook a cuisine you\'ve never tried', emoji: '🍜', time: 'Evening', cost: '$' },
  { title: 'Visit a museum and rate every exhibit', emoji: '🖼️', time: '3 hours', cost: '$$' },
  { title: 'Sunrise hike with breakfast after', emoji: '🌄', time: 'Morning', cost: 'Free' },
  { title: 'Vinyl record shop + listen party at home', emoji: '🎵', time: 'Afternoon', cost: '$' },
  { title: 'Take a class together (pottery, cooking, dance)', emoji: '🎨', time: '2 hours', cost: '$$' },
  { title: 'Road trip with no destination set', emoji: '🚗', time: 'Full day', cost: '$' },
];

const LOVE_EXERCISES = [
  { title: '36 Questions', desc: 'Arthur Aron\'s research-backed questions proven to accelerate intimacy between two people.', time: '90 min', icon: '💬' },
  { title: 'Love Map', desc: 'How well do you know each other\'s inner world? Map out each other\'s passions, fears, dreams.', time: '45 min', icon: '🗺️' },
  { title: 'Gratitude Exchange', desc: 'Each share 5 specific things you appreciate about each other. Then discuss what surprised you.', time: '20 min', icon: '🙏' },
  { title: 'Future Visioning', desc: 'Independently write your ideal life in 5 years. Share and find the overlaps — and the gaps.', time: '60 min', icon: '🔭' },
];

function Users2({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

export default function CouplesPage() {
  const [dailyAnswer, setDailyAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'memories' | 'grow' | 'dates'>('home');
  const [newMemory, setNewMemory] = useState('');
  const [showMemoryForm, setShowMemoryForm] = useState(false);

  return (
    <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>

      {/* Couples Hero */}
      <div style={{ position: 'relative', borderRadius: 28, overflow: 'hidden', marginBottom: 24, background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(219,39,119,0.2) 50%, rgba(251,191,36,0.1) 100%)', border: '1px solid rgba(139,92,246,0.2)', padding: '32px 36px' }}>
        <div className="orb" style={{ width: 300, height: 300, background: 'rgba(139,92,246,0.12)', top: -100, right: -50, zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
            {/* Avatar pair */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(139,92,246,0.5)' }}>
                <img src={COUPLE.myPhoto} alt="You" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 -10px', zIndex: 1, boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>
                <Heart size={20} color="white" fill="white" />
              </div>
              <div style={{ width: 68, height: 68, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(219,39,119,0.5)' }}>
                <img src={COUPLE.photo} alt={COUPLE.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
                You & {COUPLE.name}
              </h1>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'rgba(240,240,255,0.5)' }}>💍 Together {COUPLE.together}</span>
                <span style={{ fontSize: 13, color: 'rgba(240,240,255,0.5)' }}>Since {COUPLE.since}</span>
                <span style={{ fontSize: 13, color: '#a78bfa', fontWeight: 600 }}>{COUPLE.compatScore}% compatible</span>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { icon: '🔥', label: '12-day streak', sub: 'Daily questions' },
              { icon: '📅', label: COUPLE.nextDate, sub: COUPLE.nextDateActivity },
              { icon: '💬', label: '340 messages', sub: 'In 23 days' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.4)' }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4 }}>
        {([['home', '🏠 Home'], ['memories', '📸 Memories'], ['grow', '🌱 Grow'], ['dates', '☕ Date Ideas']] as [string, string][]).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab as typeof activeTab)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: activeTab === tab ? 'rgba(139,92,246,0.15)' : 'transparent', color: activeTab === tab ? '#c4b5fd' : 'rgba(240,240,255,0.4)', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', borderStyle: 'solid', borderWidth: 1, borderColor: activeTab === tab ? 'rgba(139,92,246,0.25)' : 'transparent' }}>
            {label}
          </button>
        ))}
      </div>

      {/* HOME TAB */}
      {activeTab === 'home' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="couples-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Today's couple question */}
            <div className="glass" style={{ borderRadius: 22, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Flame size={16} color="#fb923c" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fb923c' }}>Today&apos;s Question</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(240,240,255,0.35)' }}>12-day streak 🔥</span>
              </div>
              <div style={{ padding: '20px 22px' }}>
                <p style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.45, marginBottom: 16, letterSpacing: '-0.01em' }}>{DAILY_QUESTION.question}</p>
                {!submitted ? (
                  <>
                    <div style={{ background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.15)', borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#fb923c' }}>
                      🔒 {COUPLE.name}&apos;s answer is hidden until you both reply.
                    </div>
                    <textarea className="input-field" placeholder="Your honest answer…" rows={3} value={dailyAnswer} onChange={e => setDailyAnswer(e.target.value)} style={{ resize: 'none', lineHeight: 1.6, marginBottom: 10 }} />
                    <button onClick={() => setSubmitted(true)} disabled={!dailyAnswer.trim()} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 13, padding: '11px', opacity: dailyAnswer.trim() ? 1 : 0.4 }}>
                      Lock in my answer
                    </button>
                  </>
                ) : (
                  <div>
                    <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12, padding: '12px 14px', marginBottom: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <CheckCircle size={16} color="#34d399" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#34d399', marginBottom: 4 }}>Your answer is in!</div>
                        <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.65)', lineHeight: 1.5 }}>{dailyAnswer}</p>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden' }}>
                        <img src={COUPLE.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.4)', fontStyle: 'italic' }}>Waiting for {COUPLE.name}… answer reveals when she replies.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Next date countdown */}
            <div className="glass" style={{ borderRadius: 22, padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Calendar size={16} color="#a78bfa" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>Next Date</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{COUPLE.nextDate}</div>
              <div style={{ fontSize: 14, color: 'rgba(240,240,255,0.5)', marginBottom: 16 }}>{COUPLE.nextDateActivity}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '9px' }}>Change plan</button>
                <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '9px' }}>
                  <CheckCircle size={13} /> Confirm
                </button>
              </div>
            </div>

            {/* Love exercises */}
            <div className="glass" style={{ borderRadius: 22, padding: '22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(240,240,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Couple Exercises</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {LOVE_EXERCISES.map(ex => (
                  <div key={ex.title} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.07)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
                  >
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{ex.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{ex.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.4)', lineHeight: 1.4 }}>{ex.desc}</div>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.3)', flexShrink: 0 }}>{ex.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Compatibility evolution */}
            <div className="glass" style={{ borderRadius: 22, padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <TrendingUp size={16} color="#34d399" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>Compatibility Growth</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.35)', marginBottom: 16 }}>How you&apos;ve evolved together</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['Values', 92, '+4'], ['Communication', 91, '+7'], ['Lifestyle', 88, '+3'], ['Emotional depth', 95, '+11'], ['Humor', 89, '+6']].map(([label, score, change]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)', width: 100, flexShrink: 0 }}>{label}</span>
                    <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${score}%`, background: 'linear-gradient(90deg, #34d399, #059669)', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399', width: 28, textAlign: 'right' }}>{score}</span>
                    <span style={{ fontSize: 10, color: '#34d399', width: 28, textAlign: 'right', fontWeight: 600 }}>{change}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth areas */}
            <div className="glass" style={{ borderRadius: 22, padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Brain size={16} color="#a78bfa" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>AI Growth Areas</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {GROWTH_AREAS.map((area, i) => {
                  const Icon = area.icon;
                  return (
                    <div key={i} style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: `${area.color}14`, border: `1px solid ${area.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={15} color={area.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{area.label}</div>
                        <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)', lineHeight: 1.5 }}>{area.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Our story */}
            <div className="glass" style={{ borderRadius: 22, padding: '22px', background: 'rgba(124,58,237,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Sparkles size={16} color="#a78bfa" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>Your Story So Far</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.6)', lineHeight: 1.75, fontStyle: 'italic' }}>
                &ldquo;You matched on March 21st with a 94% compatibility — one of the highest scores Kindred has ever generated. The first thing Sophie noticed was your sourdough. The first thing you noticed was her honesty in the onboarding quiz. In 23 days you&apos;ve exchanged 340 messages, answered 12 Spark questions, and gone on 3 dates. Your communication score has grown faster than 97% of couples on Kindred.&rdquo;
              </p>
              <div style={{ marginTop: 14, fontSize: 11, color: 'rgba(240,240,255,0.25)', fontStyle: 'normal' }}>AI-generated from your real activity. Updates weekly.</div>
            </div>
          </div>
        </div>
      )}

      {/* MEMORIES TAB */}
      {activeTab === 'memories' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.4)' }}>Your shared moments, preserved forever.</p>
            <button onClick={() => setShowMemoryForm(!showMemoryForm)} className="btn-primary" style={{ fontSize: 13, padding: '9px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> Add Memory
            </button>
          </div>

          {showMemoryForm && (
            <div className="glass" style={{ borderRadius: 18, padding: '20px', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Capture this moment</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                {['☕', '🍝', '🥂', '📸', '🎵', '🌅', '✈️', '🎭', '🎉', '💌'].map(emoji => (
                  <button key={emoji} style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>{emoji}</button>
                ))}
              </div>
              <input className="input-field" placeholder="Give this memory a name…" style={{ marginBottom: 10 }} />
              <textarea className="input-field" placeholder="A note to your future selves…" rows={2} style={{ resize: 'none', lineHeight: 1.6, marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 13 }} onClick={() => setShowMemoryForm(false)}>Cancel</button>
                <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}>Save Memory</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {MEMORIES.map(m => (
              <div key={m.id} className="glass card-lift" style={{ borderRadius: 18, padding: '20px', display: 'flex', gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                  {m.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{m.label}</span>
                    <span style={{ fontSize: 12, color: 'rgba(240,240,255,0.35)' }}>{m.date}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.55)', lineHeight: 1.5, fontStyle: 'italic' }}>&ldquo;{m.note}&rdquo;</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GROW TAB */}
      {activeTab === 'grow' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass" style={{ borderRadius: 22, padding: '22px 24px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Relationship Health Score</div>
            <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.4)', marginBottom: 20 }}>Based on your interactions, check-ins, and Spark answers.</div>
            {[
              { label: 'Communication quality', score: 91, icon: '💬' },
              { label: 'Emotional safety', score: 87, icon: '🛡️' },
              { label: 'Shared experiences', score: 74, icon: '🌍' },
              { label: 'Individual respect', score: 93, icon: '🤝' },
              { label: 'Future alignment', score: 88, icon: '🔭' },
              { label: 'Physical connection', score: 79, icon: '💗' },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'rgba(240,240,255,0.65)' }}>{item.icon} {item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: item.score >= 85 ? '#34d399' : item.score >= 70 ? '#a78bfa' : '#fbbf24' }}>{item.score}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.score}%`, borderRadius: 3, background: item.score >= 85 ? '#34d399' : item.score >= 70 ? '#8b5cf6' : '#fbbf24', transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
          </div>

          <div className="glass" style={{ borderRadius: 22, padding: '22px 24px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>AI Recommendation This Week</div>
            <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 14, padding: '16px 18px', marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Focus area</div>
              <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.7)', lineHeight: 1.7 }}>
                Your shared experiences score (74) is the lowest dimension. You&apos;ve been great at conversation and emotional depth — the next step is doing more things together that aren&apos;t over a table. Try the sunrise hike date idea this weekend.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DATE IDEAS TAB */}
      {activeTab === 'dates' && (
        <div>
          <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.4)', marginBottom: 20 }}>AI-curated for where you are in your relationship.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {DATE_IDEAS_COUPLES.map(idea => (
              <div key={idea.title} className="glass card-lift" style={{ borderRadius: 18, padding: '20px', cursor: 'pointer' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{idea.emoji}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{idea.title}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="tag" style={{ fontSize: 11 }}>⏱ {idea.time}</span>
                  <span className="tag" style={{ fontSize: 11 }}>💰 {idea.cost}</span>
                </div>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '9px', marginTop: 14 }}>
                  Plan this date
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 800px) {
          .couples-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
