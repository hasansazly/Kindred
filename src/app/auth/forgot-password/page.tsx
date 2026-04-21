'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '../../../../utils/supabase/client';
import { isQaAccessEmail } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [codeMode, setCodeMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const readResponseError = async (response: Response) => {
    const raw = await response.text();
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      return parsed.error || raw || `Request failed with status ${response.status}`;
    } catch {
      return raw || `Request failed with status ${response.status}`;
    }
  };

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
    if (!isQaAccessEmail(email)) {
      setError('Access is limited to approved tester emails.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New password and confirm password must match.');
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
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : 'Unknown network error';
      setError(`Network request failed: ${message}`);
      return;
    } finally {
      setLoading(false);
    }

    setCodeMode(true);
    setOtpSent(true);
    setSuccess('Verification code sent. Check your email.');
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !otpCode || !newPassword || !confirmNewPassword) {
      setError('Please complete all fields.');
      return;
    }
    if (!isQaAccessEmail(email)) {
      setError('Access is limited to approved tester emails.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New password and confirm password must match.');
      return;
    }

    setLoading(true);
    try {
      const verifyResponse = await fetch('/api/otp/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token: otpCode,
        }),
      });

      if (!verifyResponse.ok) {
        const message = await readResponseError(verifyResponse);
        setError(`Verify code failed (${verifyResponse.status}): ${message}`);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess('Password reset successful. Redirecting...');
      router.push('/onboarding');
    } catch (resetError) {
      const message = resetError instanceof Error ? resetError.message : 'Unknown network error';
      setError(`Network request failed: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page" style={{ minHeight: '100vh', background: '#FFF0F1', display: 'flex' }}>
      <div className="auth-form-shell" style={{ width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px' }}>
        <div style={{ width: '100%', maxWidth: 520, marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }} className="auth-mobile-logo">
            <img src="/vinculo-logo.svg" alt="Vinculo" style={{ width: 34, height: 34, borderRadius: 9, display: 'block' }} />
            <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em', color: '#1A0A1E' }}>vinculo</span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8, color: '#1A0A1E' }}>
            Reset your password
          </h1>
          <p style={{ fontSize: 15, color: '#6B4B5E', marginBottom: 32 }}>
            Remembered it?{' '}
            <Link href="/auth/login" style={{ color: '#FF3B5C', textDecoration: 'none', fontWeight: 500 }}>
              Back to sign in
            </Link>
          </p>

          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error ? (
              <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#fda4af' }}>
                {error}
              </div>
            ) : null}
            {success ? (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#6ee7b7' }}>
                {success}
              </div>
            ) : null}

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.82)', display: 'block', marginBottom: 8 }}>Email</label>
              <input className="input-field" type="email" placeholder="you@school.edu" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.82)', display: 'block', marginBottom: 8 }}>Add new Pass</label>
              <input
                className="input-field"
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,240,255,0.82)', display: 'block', marginBottom: 8 }}>Confirm new Pass</label>
              <input
                className="input-field"
                type="password"
                placeholder="Re-enter new password"
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {codeMode ? (
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
            ) : null}

            {!codeMode ? (
              <button
                type="button"
                className="btn-ghost"
                style={{ width: '100%', justifyContent: 'center', fontSize: 14 }}
                disabled={loading}
                onClick={handleSendCode}
              >
                {loading ? 'Sending code…' : 'Verify with mail code'}
              </button>
            ) : null}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '15px', marginTop: 4, opacity: loading ? 0.7 : 1 }}
              disabled={loading || !codeMode}
            >
              {loading ? 'Confirming…' : 'Confirm'}
              <ArrowRight size={18} />
            </button>

            {codeMode ? (
              <button
                type="button"
                className="btn-ghost"
                style={{ width: '100%', justifyContent: 'center', fontSize: 14 }}
                disabled={loading}
                onClick={handleSendCode}
              >
                {otpSent ? 'Resend code' : 'Send code'}
              </button>
            ) : null}
          </form>

          <style>{`
            .auth-mobile-logo {
              justify-content: center;
            }
            @media (max-width: 767px) {
              .auth-form-shell {
                padding: 20px 16px !important;
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
