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

const isTempleEmail = (email: string) => email.trim().toLowerCase().endsWith('@temple.edu');

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [codeMode, setCodeMode] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const readResponseError = async (response: Response) => {
    const raw = await response.text();
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      return parsed.error || raw || `Request failed with status ${response.status}`;
    } catch {
      return raw || `Request failed with status ${response.status}`;
    }
  };

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email) { setError('Email is required.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email.'); return; }
    if (!isTempleEmail(email)) { setError('Only Temple University emails (@temple.edu) are allowed.'); return; }
    setStep(2);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) { setError('Name is required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!agreed) { setError('You must agree to the Terms.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    router.push('/onboarding');
  }

  async function handleSendCode() {
    setError('');
    setSuccess('');
    if (!email) {
      setError('Email is required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and confirm password must match.');
      return;
    }
    if (!isTempleEmail(email)) {
      setError('Only Temple University emails (@temple.edu) are allowed.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/otp/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          shouldCreateUser: true,
        }),
      });
      if (!response.ok) {
        const message = await readResponseError(response);
        setError(`Send code failed (${response.status}): ${message}`);
        return;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown network error';
      setError(`Network request failed: ${message}`);
      return;
    } finally {
      setLoading(false);
    }

    setCodeMode(true);
    setOtpSent(true);
    setSuccess('Verification code sent. Check your email.');
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !otpCode) {
      setError('Please enter your email and verification code.');
      return;
    }
    if (!isTempleEmail(email)) {
      setError('Only Temple University emails (@temple.edu) are allowed.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/otp/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token: otpCode,
        }),
      });
      if (!response.ok) {
        const message = await readResponseError(response);
        setError(`Verify code failed (${response.status}): ${message}`);
        return;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown network error';
      setError(`Network request failed: ${message}`);
      return;
    } finally {
      setLoading(false);
    }

    router.push('/onboarding');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07070f', display: 'flex' }}>
      {/* Left panel */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 48 }} className="auth-desktop-panel auth-left-panel">
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #1A1A2E 0%, #3C3489 100%)' }} />
        <div className="orb" style={{ width: 500, height: 500, background: 'rgba(219,39,119,0.12)', top: -80, right: -80 }} />
        <div className="orb" style={{ width: 400, height: 400, background: 'rgba(124,58,237,0.12)', bottom: 0, left: -60 }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={18} color="white" fill="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.03em', color: '#FFFFFF' }}>vinculo</span>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 32, lineHeight: 1.2, color: '#FFFFFF' }}>
            The app that actually<br />understands you.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PERKS.map(p => {
              const Icon = p.icon;
              return (
                <div key={p.text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color="#FFFFFF" />
                  </div>
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)' }}>{p.text}</span>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-form-shell" style={{ width: '100%', maxWidth: 520, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
        <div style={{ width: '100%' }}>
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }} className="auth-mobile-logo">
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #7c3aed, #db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={16} color="white" fill="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em', color: '#F8F7FF' }}>vinculo</span>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ height: 3, borderRadius: 2, flex: 1, background: s <= step ? 'linear-gradient(90deg, #7c3aed, #db2777)' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
            ))}
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8, color: '#F8F7FF' }}>
            {step === 1 ? 'Create your account' : 'Just a little more'}
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(240,240,255,0.45)', marginBottom: 32 }}>
            {step === 1 ? (
              <>Already have an account?{' '}<Link href="/auth/login" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link></>
            ) : (
              "We'll use this to personalize your experience."
            )}
          </p>

          {step === 1 && !codeMode ? (
            <>
              <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#fda4af' }}>{error}</div>}
                {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#6ee7b7' }}>{success}</div>}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.82)', display: 'block', marginBottom: 8 }}>Email</label>
                  <input className="input-field" type="email" placeholder="you@temple.edu" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.82)', display: 'block', marginBottom: 8 }}>Add Password</label>
                  <input
                    className="input-field"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.82)', display: 'block', marginBottom: 8 }}>Confirm Password</label>
                  <input
                    className="input-field"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', fontSize: 14 }}
                  disabled={loading}
                  onClick={handleSendCode}
                >
                  {loading ? 'Sending code…' : 'Verify with email code'}
                </button>
              </form>
            </>
          ) : step === 1 && codeMode ? (
            <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#fda4af' }}>{error}</div>}
              {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#6ee7b7' }}>{success}</div>}

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.82)', display: 'block', marginBottom: 8 }}>Email</label>
                <input className="input-field" type="email" value={email} placeholder="you@temple.edu" onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.82)', display: 'block', marginBottom: 8 }}>Verification code</label>
                <input
                  className="input-field"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter the code from email"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\s/g, ''))}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '15px', marginTop: 4, opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? 'Verifying code…' : 'Verify code'}
              </button>

              <button
                type="button"
                className="btn-ghost"
                style={{ width: '100%', justifyContent: 'center', fontSize: 14 }}
                disabled={loading}
                onClick={handleSendCode}
              >
                {otpSent ? 'Resend code' : 'Send code'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCodeMode(false);
                  setOtpCode('');
                  setError('');
                  setSuccess('');
                }}
                style={{ background: 'none', border: 'none', color: 'rgba(240,240,255,0.4)', fontSize: 13, cursor: 'pointer', marginTop: -4 }}
              >
                Use password signup instead
              </button>
            </form>
          ) : (
            <form onSubmit={handleStep2} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#fda4af' }}>{error}</div>}
              {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#6ee7b7' }}>{success}</div>}

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
                  I agree to Vinculo&apos;s{' '}
                  <Link href="/terms" style={{ color: '#a78bfa', textDecoration: 'none' }}>Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" style={{ color: '#a78bfa', textDecoration: 'none' }}>Privacy Policy</Link>.
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .auth-mobile-logo { display: none; }
        @media (max-width: 767px) {
          .auth-desktop-panel { display: none !important; }
          .auth-mobile-logo { display: flex !important; }
          .auth-form-shell { padding: 24px 16px !important; }
          .auth-form-shell { max-width: 100% !important; }
          .auth-social-row { flex-direction: column; }
          .auth-social-row > button { width: 100%; }
        }
      `}</style>
    </div>
  );
}
