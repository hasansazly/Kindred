'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart, Eye, EyeOff, ArrowRight, CheckCircle, Brain, Sparkles, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PERKS = [
  { icon: Brain, text: 'AI-powered deep compatibility' },
  { icon: Sparkles, text: '5 curated daily matches' },
  { icon: Shield, text: 'Safety-first verified community' },
  { icon: CheckCircle, text: 'No credit card required' },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email) { setError('Email is required.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email.'); return; }
    setStep(2);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Name is required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!agreed) { setError('You must agree to the Terms.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    router.push('/onboarding');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07070f', display: 'flex' }}>
      {/* Left panel */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 48 }} className="hidden lg:flex">
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(219,39,119,0.18) 0%, rgba(124,58,237,0.15) 60%, rgba(7,7,15,0) 100%)' }} />
        <div className="orb" style={{ width: 500, height: 500, background: 'rgba(219,39,119,0.12)', top: -80, right: -80 }} />
        <div className="orb" style={{ width: 400, height: 400, background: 'rgba(124,58,237,0.12)', bottom: 0, left: -60 }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={18} color="white" fill="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.03em' }}>kindred</span>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 32, lineHeight: 1.2 }}>
            The app that actually<br />understands you.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PERKS.map(p => {
              const Icon = p.icon;
              return (
                <div key={p.text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color="#a78bfa" />
                  </div>
                  <span style={{ fontSize: 15, color: 'rgba(240,240,255,0.7)' }}>{p.text}</span>
                </div>
              );
            })}
          </div>

          {/* Social proof */}
          <div className="glass" style={{ borderRadius: 16, padding: '16px 20px', marginTop: 36, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex' }}>
              {['https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&q=80',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80',
                'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&q=80',
              ].map((src, i) => (
                <img key={i} src={src} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid #07070f', marginLeft: i > 0 ? -8 : 0 }} />
              ))}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>200k+ members</div>
              <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>joined this month</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
        <div style={{ width: '100%' }}>
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }} className="lg:hidden">
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #7c3aed, #db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={16} color="white" fill="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em' }}>kindred</span>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ height: 3, borderRadius: 2, flex: 1, background: s <= step ? 'linear-gradient(90deg, #7c3aed, #db2777)' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
            ))}
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
            {step === 1 ? 'Create your account' : 'Just a little more'}
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(240,240,255,0.45)', marginBottom: 32 }}>
            {step === 1 ? (
              <>Already have an account?{' '}<Link href="/auth/login" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link></>
            ) : (
              "We'll use this to personalize your experience."
            )}
          </p>

          {step === 1 ? (
            <>
              {/* Social logins */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                {[{ name: 'Google', icon: '🔵' }, { name: 'Apple', icon: '🍎' }].map(s => (
                  <button key={s.name} className="btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 14 }} onClick={() => router.push('/onboarding')}>
                    <span>{s.icon}</span>
                    Continue with {s.name}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ fontSize: 12, color: 'rgba(240,240,255,0.3)', fontWeight: 500 }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              </div>

              <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#fda4af' }}>{error}</div>}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.55)', display: 'block', marginBottom: 8 }}>Email</label>
                  <input className="input-field" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '15px', marginTop: 4 }}>
                  Continue with Email <ArrowRight size={18} />
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleStep2} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#fda4af' }}>{error}</div>}

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.55)', display: 'block', marginBottom: 8 }}>Your first name</label>
                <input className="input-field" type="text" placeholder="First name" value={name} onChange={e => setName(e.target.value)} autoComplete="given-name" />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.55)', display: 'block', marginBottom: 8 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input-field"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    style={{ paddingRight: 48 }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,240,255,0.35)', display: 'flex', padding: 0 }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Password strength */}
                {password.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                    {[1,2,3,4].map(i => {
                      const strength = password.length >= 12 ? 4 : password.length >= 10 ? 3 : password.length >= 8 ? 2 : 1;
                      const colors = ['#f43f5e', '#fbbf24', '#34d399', '#8b5cf6'];
                      return <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? colors[strength - 1] : 'rgba(255,255,255,0.08)', transition: 'background 0.2s' }} />;
                    })}
                  </div>
                )}
              </div>

              {/* Terms */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <div
                  onClick={() => setAgreed(!agreed)}
                  style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${agreed ? '#8b5cf6' : 'rgba(255,255,255,0.2)'}`, background: agreed ? 'rgba(139,92,246,0.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.2s', cursor: 'pointer' }}
                >
                  {agreed && <CheckCircle size={13} color="#a78bfa" />}
                </div>
                <span style={{ fontSize: 13, color: 'rgba(240,240,255,0.45)', lineHeight: 1.6 }}>
                  I agree to Kindred&apos;s{' '}
                  <a href="#" style={{ color: '#a78bfa', textDecoration: 'none' }}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" style={{ color: '#a78bfa', textDecoration: 'none' }}>Privacy Policy</a>.
                </span>
              </label>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '15px', marginTop: 4, opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                    Creating your account…
                  </span>
                ) : (
                  <>Create Account <ArrowRight size={18} /></>
                )}
              </button>

              <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'rgba(240,240,255,0.4)', fontSize: 13, cursor: 'pointer', marginTop: -4 }}>
                ← Back
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
