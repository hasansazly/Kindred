'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ArrowRight, ArrowLeft, Camera, User, MapPin, Briefcase, CheckCircle, Sparkles, Brain } from 'lucide-react';
import { INTERESTS, VALUES } from '@/lib/utils';

const TOTAL_STEPS = 7;

interface OnboardingState {
  name: string;
  age: string;
  gender: string;
  location: string;
  occupation: string;
  bio: string;
  interests: string[];
  values: string[];
  relationshipGoal: string;
  attachmentStyle: string;
  loveLanguages: string[];
  minAge: number;
  maxAge: number;
  distance: number;
  interestedIn: string[];
}

const INITIAL: OnboardingState = {
  name: '',
  age: '',
  gender: '',
  location: '',
  occupation: '',
  bio: '',
  interests: [],
  values: [],
  relationshipGoal: '',
  attachmentStyle: '',
  loveLanguages: [],
  minAge: 22,
  maxAge: 35,
  distance: 50,
  interestedIn: [],
};

const GOAL_OPTIONS = [
  { value: 'relationship', label: 'Long-term relationship', emoji: '💍', desc: 'Looking for a committed partner' },
  { value: 'casual', label: 'Something casual', emoji: '✨', desc: 'Fun, low pressure connection' },
  { value: 'friendship', label: 'Friendship first', emoji: '🤝', desc: 'Start as friends, see where it goes' },
  { value: 'unsure', label: 'Open to anything', emoji: '🌈', desc: "I'll know it when I feel it" },
];

const ATTACHMENT_OPTIONS = [
  { value: 'secure', label: 'Secure', emoji: '🏠', desc: 'Comfortable with closeness and independence' },
  { value: 'anxious', label: 'Anxious', emoji: '💬', desc: 'Seek reassurance, worry about relationships' },
  { value: 'avoidant', label: 'Avoidant', emoji: '🦅', desc: 'Value independence, uncomfortable with intimacy' },
  { value: 'disorganized', label: 'Mixed/Unsure', emoji: '🌀', desc: 'Inconsistent patterns, still figuring it out' },
];

const LOVE_LANGUAGE_OPTIONS = [
  { value: 'words', label: 'Words of Affirmation', emoji: '💬', desc: 'Verbal expressions of love' },
  { value: 'acts', label: 'Acts of Service', emoji: '🛠️', desc: 'Actions speak louder than words' },
  { value: 'gifts', label: 'Gift Giving', emoji: '🎁', desc: 'Thoughtful tokens of affection' },
  { value: 'time', label: 'Quality Time', emoji: '⏰', desc: 'Undivided attention and presence' },
  { value: 'touch', label: 'Physical Touch', emoji: '🤗', desc: 'Physical connection and closeness' },
];

const GENDER_OPTIONS = [
  { value: 'man', label: 'Man' },
  { value: 'woman', label: 'Woman' },
  { value: 'nonbinary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
];

const INTERESTED_IN = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'everyone', label: 'Everyone' },
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 40 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 4, borderRadius: 2,
            width: i === current - 1 ? 28 : 12,
            background: i < current ? 'linear-gradient(90deg, #7c3aed, #db2777)' : 'rgba(255,255,255,0.1)',
            transition: 'all 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}

function MultiSelect({ options, selected, onToggle, max }: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  max?: number;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => {
        const isSelected = selected.includes(opt);
        const isDisabled = !isSelected && max !== undefined && selected.length >= max;
        return (
          <button
            key={opt}
            onClick={() => !isDisabled && onToggle(opt)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: `1.5px solid ${isSelected ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
              background: isSelected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
              color: isSelected ? '#c4b5fd' : isDisabled ? 'rgba(240,240,255,0.25)' : 'rgba(240,240,255,0.6)',
              fontSize: 13,
              fontWeight: isSelected ? 600 : 400,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.18s ease',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingState>(INITIAL);
  const [error, setError] = useState('');

  function update<K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) {
    setData(prev => ({ ...prev, [key]: value }));
    setError('');
  }

  function toggleArray(key: 'interests' | 'values' | 'loveLanguages' | 'interestedIn', val: string) {
    setData(prev => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
    });
    setError('');
  }

  function next() {
    // Validate each step
    if (step === 1 && (!data.name.trim() || !data.age || !data.gender)) { setError('Please fill in all fields.'); return; }
    if (step === 2 && !data.location.trim()) { setError('Please enter your location.'); return; }
    if (step === 3 && data.interests.length < 3) { setError('Pick at least 3 interests.'); return; }
    if (step === 4 && data.values.length < 3) { setError('Pick at least 3 values.'); return; }
    if (step === 5 && !data.relationshipGoal) { setError('Please select your goal.'); return; }
    if (step === 6 && (!data.attachmentStyle || data.loveLanguages.length === 0)) { setError('Please complete this step.'); return; }
    if (step === 7 && data.interestedIn.length === 0) { setError('Select who you\'re interested in.'); return; }
    if (step === TOTAL_STEPS) { router.push('/app/discover'); return; }
    setError('');
    setStep(s => s + 1);
  }

  function back() {
    if (step === 1) { router.push('/'); return; }
    setStep(s => s - 1);
    setError('');
  }

  const canContinue = () => {
    if (step === 1) return data.name.trim() && data.age && data.gender;
    if (step === 2) return data.location.trim();
    if (step === 3) return data.interests.length >= 3;
    if (step === 4) return data.values.length >= 3;
    if (step === 5) return !!data.relationshipGoal;
    if (step === 6) return data.attachmentStyle && data.loveLanguages.length > 0;
    if (step === 7) return data.interestedIn.length > 0;
    return true;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#07070f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', position: 'relative' }}>
      {/* BG orbs */}
      <div className="orb" style={{ width: 600, height: 600, background: 'rgba(124,58,237,0.1)', top: -200, right: -100 }} />
      <div className="orb" style={{ width: 400, height: 400, background: 'rgba(244,63,94,0.08)', bottom: -100, left: -100 }} />

      {/* Container */}
      <div style={{ width: '100%', maxWidth: 600, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={16} color="white" fill="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em' }}>kindred</span>
        </div>

        <StepIndicator current={step} total={TOTAL_STEPS} />

        {/* Card */}
        <div className="glass" style={{ borderRadius: 24, padding: '36px 40px' }}>
          {error && (
            <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fda4af', marginBottom: 20 }}>
              {error}
            </div>
          )}

          {/* ─ Step 1: Basic Info ─ */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(139,92,246,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Step 1 of 7</div>
                <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Let&apos;s start with you</h2>
                <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.45)' }}>Just the basics — we&apos;ll go deeper in a moment.</p>
              </div>

              {/* Photo upload placeholder */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
                <div style={{ width: 100, height: 100, borderRadius: '50%', border: '2px dashed rgba(139,92,246,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(139,92,246,0.06)', gap: 4, transition: 'all 0.2s' }}>
                  <Camera size={24} color="rgba(139,92,246,0.6)" />
                  <span style={{ fontSize: 10, color: 'rgba(240,240,255,0.4)', fontWeight: 500 }}>Add Photo</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.55)', display: 'block', marginBottom: 8 }}>First name</label>
                  <input className="input-field" placeholder="Your first name" value={data.name} onChange={e => update('name', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.55)', display: 'block', marginBottom: 8 }}>Age</label>
                    <input className="input-field" type="number" placeholder="26" min="18" max="80" value={data.age} onChange={e => update('age', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.55)', display: 'block', marginBottom: 8 }}>I am a…</label>
                    <select className="input-field" value={data.gender} onChange={e => update('gender', e.target.value)} style={{ cursor: 'pointer' }}>
                      <option value="">Select</option>
                      {GENDER_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.55)', display: 'block', marginBottom: 8 }}>Occupation <span style={{ color: 'rgba(240,240,255,0.25)' }}>(optional)</span></label>
                  <input className="input-field" placeholder="e.g. Software Engineer" value={data.occupation} onChange={e => update('occupation', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.55)', display: 'block', marginBottom: 8 }}>Bio <span style={{ color: 'rgba(240,240,255,0.25)' }}>(optional)</span></label>
                  <textarea
                    className="input-field"
                    placeholder="Tell people what makes you, you…"
                    value={data.bio}
                    onChange={e => update('bio', e.target.value)}
                    rows={3}
                    maxLength={300}
                    style={{ resize: 'none', lineHeight: 1.6 }}
                  />
                  <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.25)', textAlign: 'right', marginTop: 4 }}>{data.bio.length}/300</div>
                </div>
              </div>
            </div>
          )}

          {/* ─ Step 2: Location ─ */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(139,92,246,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Step 2 of 7</div>
                <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Where are you?</h2>
                <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.45)' }}>We&apos;ll find people near you. Your exact location is never shared.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.55)', display: 'block', marginBottom: 8 }}>City</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input-field" placeholder="e.g. San Francisco, CA" value={data.location} onChange={e => update('location', e.target.value)} style={{ paddingLeft: 44 }} />
                    <MapPin size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,240,255,0.3)' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.55)' }}>Search radius</label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>{data.distance} km</span>
                  </div>
                  <input type="range" min={5} max={200} value={data.distance} onChange={e => update('distance', Number(e.target.value))} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(240,240,255,0.25)', marginTop: 4 }}>
                    <span>5 km</span><span>200 km</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─ Step 3: Interests ─ */}
          {step === 3 && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(139,92,246,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Step 3 of 7</div>
                <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>What do you love?</h2>
                <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.45)' }}>Pick at least 3. These fuel our compatibility engine.</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: 'rgba(240,240,255,0.35)' }}>Selected: {data.interests.length}/10 max</span>
              </div>
              <MultiSelect options={INTERESTS} selected={data.interests} onToggle={v => toggleArray('interests', v)} max={10} />
            </div>
          )}

          {/* ─ Step 4: Values ─ */}
          {step === 4 && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(139,92,246,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Step 4 of 7</div>
                <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>What guides you?</h2>
                <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.45)' }}>Values alignment is one of our strongest compatibility signals.</p>
              </div>
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: 'rgba(240,240,255,0.35)' }}>Selected: {data.values.length}/6 max</span>
              </div>
              <MultiSelect options={VALUES} selected={data.values} onToggle={v => toggleArray('values', v)} max={6} />
            </div>
          )}

          {/* ─ Step 5: Relationship Goal ─ */}
          {step === 5 && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(139,92,246,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Step 5 of 7</div>
                <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>What are you looking for?</h2>
                <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.45)' }}>Be honest — we match you with people who want the same thing.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {GOAL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => update('relationshipGoal', opt.value)}
                    className="select-card"
                    style={{ display: 'flex', alignItems: 'center', gap: 16, ...(data.relationshipGoal === opt.value ? { background: 'rgba(139,92,246,0.12)', borderColor: 'rgba(139,92,246,0.5)' } : {}) }}
                  >
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{opt.emoji}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: data.relationshipGoal === opt.value ? '#c4b5fd' : '#f0f0ff', marginBottom: 2 }}>{opt.label}</div>
                      <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.4)' }}>{opt.desc}</div>
                    </div>
                    {data.relationshipGoal === opt.value && (
                      <CheckCircle size={18} color="#a78bfa" style={{ marginLeft: 'auto' }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─ Step 6: Attachment + Love Languages ─ */}
          {step === 6 && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(139,92,246,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Step 6 of 7</div>
                <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>How you connect</h2>
                <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.45)' }}>This is where our AI goes deep. These signals power the compatibility engine.</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Brain size={15} color="#a78bfa" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>Attachment style</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
                {ATTACHMENT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => update('attachmentStyle', opt.value)}
                    className="select-card"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', ...(data.attachmentStyle === opt.value ? { background: 'rgba(139,92,246,0.12)', borderColor: 'rgba(139,92,246,0.5)' } : {}) }}
                  >
                    <span style={{ fontSize: 20 }}>{opt.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: data.attachmentStyle === opt.value ? '#c4b5fd' : '#f0f0ff' }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>{opt.desc}</div>
                    </div>
                    {data.attachmentStyle === opt.value && <CheckCircle size={16} color="#a78bfa" />}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Heart size={15} color="#fb7185" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fb7185' }}>Your love language(s)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {LOVE_LANGUAGE_OPTIONS.map(opt => {
                  const selected = data.loveLanguages.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleArray('loveLanguages', opt.value)}
                      className="select-card"
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', ...(selected ? { background: 'rgba(244,63,94,0.1)', borderColor: 'rgba(244,63,94,0.4)' } : {}) }}
                    >
                      <span style={{ fontSize: 18 }}>{opt.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: selected ? '#fda4af' : '#f0f0ff' }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>{opt.desc}</div>
                      </div>
                      {selected && <CheckCircle size={16} color="#fb7185" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─ Step 7: Preferences ─ */}
          {step === 7 && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(139,92,246,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Step 7 of 7</div>
                <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Your preferences</h2>
                <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.45)' }}>Last step! Tell us what you&apos;re looking for in a match.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.6)', display: 'block', marginBottom: 12 }}>Interested in</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {INTERESTED_IN.map(o => {
                      const sel = data.interestedIn.includes(o.value);
                      return (
                        <button
                          key={o.value}
                          onClick={() => toggleArray('interestedIn', o.value)}
                          style={{ flex: 1, padding: '12px', border: `1.5px solid ${sel ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`, background: sel ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)', borderRadius: 12, color: sel ? '#c4b5fd' : 'rgba(240,240,255,0.6)', fontWeight: sel ? 600 : 400, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s' }}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.6)' }}>Age range</label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>{data.minAge}–{data.maxAge}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.35)', marginBottom: 6 }}>Min age: {data.minAge}</div>
                      <input type="range" min={18} max={70} value={data.minAge} onChange={e => update('minAge', Math.min(Number(e.target.value), data.maxAge - 1))} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.35)', marginBottom: 6 }}>Max age: {data.maxAge}</div>
                      <input type="range" min={18} max={80} value={data.maxAge} onChange={e => update('maxAge', Math.max(Number(e.target.value), data.minAge + 1))} />
                    </div>
                  </div>
                </div>

                {/* Completion teaser */}
                <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
                  <Sparkles size={20} color="#34d399" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#6ee7b7', marginBottom: 2 }}>Your Aura Profile is almost ready!</div>
                    <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)' }}>Our AI will analyze your profile and generate your first 5 daily matches within minutes.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
            <button onClick={back} className="btn-ghost" style={{ padding: '11px 20px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              onClick={next}
              className="btn-primary"
              style={{ padding: '12px 28px', fontSize: 14, opacity: canContinue() ? 1 : 0.5, cursor: canContinue() ? 'pointer' : 'not-allowed' }}
            >
              {step === TOTAL_STEPS ? 'Find My Matches 🎉' : 'Continue'}
              {step < TOTAL_STEPS && <ArrowRight size={16} />}
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(240,240,255,0.2)', marginTop: 20 }}>
          Step {step} of {TOTAL_STEPS} — Your data is encrypted and never sold.
        </p>
      </div>
    </div>
  );
}
