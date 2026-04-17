'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '../../../../utils/supabase/client';

const isTempleEmail = (email: string) => email.trim().toLowerCase().endsWith('@temple.edu');

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (!isTempleEmail(email)) { setError('Only Temple University emails (@temple.edu) are allowed.'); return; }
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push('/dashboard');
    } catch (signinFailure) {
      const message = signinFailure instanceof Error ? signinFailure.message : 'Sign in failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendCode() {
    setError('');
    setSuccess('');
    if (!email) {
      setError('Please enter your email first.');
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
          shouldCreateUser: false,
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
    setSuccess('Verification code sent. Check your email and enter the code below.');
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
      {/* Left panel — decorative */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 48 }} className="auth-desktop-panel auth-left-panel">
        {/* Gradient BG */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #1A1A2E 0%, #3C3489 100%)' }} />
        <div className="orb" style={{ width: 500, height: 500, background: 'rgba(124,58,237,0.15)', top: -100, left: -100 }} />
        <div className="orb" style={{ width: 400, height: 400, background: 'rgba(244,63,94,0.1)', bottom: 0, right: 0 }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={18} color="white" fill="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.03em', color: '#FFFFFF' }}>vinculo</span>
        </div>

        {/* Testimonial */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 440 }}>
          {/* Match preview card */}
          <div className="glass" style={{ borderRadius: 20, padding: 20, marginBottom: 28, background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
              <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&q=80" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }} alt="" />
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', marginLeft: -16, border: '2px solid rgba(255,255,255,0.4)' }} alt="" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>Emma & James matched</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>97% compatibility · Values + Goals</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 20 }}>💫</div>
            </div>
            <div style={{ fontSize: 13, color: '#FFFFFF', lineHeight: 1.6 }}>
              &ldquo;We got engaged last month. Vinculo showed me things about our compatibility I never could have seen on my own.&rdquo;
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
              {['Values', 'Goals', 'Communication'].map(t => (
                <span key={t} className="tag tag-violet" style={{ fontSize: 11 }}>{t}</span>
              ))}
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            Welcome back.<br />Your matches are waiting.
          </p>
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

          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8, color: '#F8F7FF' }}>Sign in</h1>
          <p style={{ fontSize: 15, color: 'rgba(240,240,255,0.45)', marginBottom: 36 }}>
            New here?{' '}
            <Link href="/auth/signup" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 500 }}>Create an account</Link>
          </p>

          {/* Form */}
          {!codeMode ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#fda4af' }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#6ee7b7' }}>
                  {success}
                </div>
              )}

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.55)', display: 'block', marginBottom: 8 }}>Email</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.55)' }}>Password</label>
                  <a href="/auth/forgot-password" style={{ fontSize: 12, color: '#a78bfa', textDecoration: 'none' }}>Forgot password?</a>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input-field"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    style={{ paddingRight: 48 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,240,255,0.35)', display: 'flex', padding: 0 }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '15px', marginTop: 8, opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                    Signing in…
                  </span>
                ) : (
                  <>Sign in <ArrowRight size={18} /></>
                )}
              </button>

              <button
                type="button"
                className="btn-ghost"
                style={{ width: '100%', justifyContent: 'center', fontSize: 14 }}
                disabled={loading}
                onClick={handleSendCode}
              >
                Send code to email
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#fda4af' }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#6ee7b7' }}>
                  {success}
                </div>
              )}

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.55)', display: 'block', marginBottom: 8 }}>Email</label>
                <input
                  className="input-field"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.55)', display: 'block', marginBottom: 8 }}>Verification code</label>
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
                style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '15px', marginTop: 8, opacity: loading ? 0.7 : 1 }}
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
                style={{ background: 'none', border: 'none', color: 'rgba(240,240,255,0.4)', fontSize: 13, cursor: 'pointer' }}
                onClick={() => {
                  setCodeMode(false);
                  setOtpCode('');
                  setError('');
                  setSuccess('');
                }}
              >
                Use password instead
              </button>
            </form>
          )}

          <p style={{ fontSize: 12, color: 'rgba(240,240,255,0.25)', textAlign: 'center', marginTop: 28, lineHeight: 1.7 }}>
            By signing in, you agree to our{' '}
            <Link href="/terms" style={{ color: 'rgba(240,240,255,0.45)', textDecoration: 'none' }}>Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" style={{ color: 'rgba(240,240,255,0.45)', textDecoration: 'none' }}>Privacy Policy</Link>.
          </p>
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
