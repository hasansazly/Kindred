'use client';

import { FormEvent, useState } from 'react';
import { getSupabaseBrowserClient } from '../../../utils/supabase/client';
import { isQaAccessEmail } from '@/lib/utils';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isQaAccessEmail(email)) {
      setError('Access is limited to approved tester emails.');
      return;
    }

    setLoading(true);

    let signUpError: { message: string } | null = null;
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      signUpError = error;
    } catch (clientError) {
      const message = clientError instanceof Error ? clientError.message : 'Supabase client setup failed.';
      setError(message);
      setLoading(false);
      return;
    }

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess('Signup successful. Check your email to confirm your account.');
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#FFF0F1] text-[#1A0A1E] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[rgba(255,88,100,0.2)] bg-[#FAF8F5] p-6 shadow-xl">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Create your account</h1>
        <p className="text-sm text-[#6B4B5E] mb-6">Sign up with your email and password.</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-[#6B4B5E] mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[rgba(255,88,100,0.25)] bg-white px-3 py-2 text-[#1A0A1E] outline-none focus:border-[#FF5864]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-[#6B4B5E] mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[rgba(255,88,100,0.25)] bg-white px-3 py-2 text-[#1A0A1E] outline-none focus:border-[#FF5864]"
              placeholder="Minimum 6 characters"
            />
          </div>

          {error && <p className="text-sm text-[#FF3B5C]">{error}</p>}
          {success && <p className="text-sm text-emerald-400">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#FF5864] px-4 py-2.5 text-sm font-medium text-[rgb(245,238,248)] hover:bg-[#FF3B5C] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>
      </div>
    </main>
  );
}
