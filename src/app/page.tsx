'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  Heart, Sparkles, Shield, MessageCircle, Star, ChevronRight,
  Brain, Zap, Users, CheckCircle, ArrowRight, Lock, BarChart2,
  Camera, Coffee, Mountain, Music, Menu, X,
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Pricing', href: '#pricing' },
];

const FEATURES = [
  {
    icon: Brain,
    title: 'Aura Intelligence',
    desc: 'Our AI builds a deep personality model from your responses — not just interests, but communication style, attachment patterns, and values hierarchy.',
    color: 'violet',
  },
  {
    icon: BarChart2,
    title: 'Transparent Compatibility',
    desc: 'We don\'t just say "you\'re a match" — we show a full breakdown across 6 dimensions so you understand exactly why two people fit.',
    color: 'rose',
  },
  {
    icon: MessageCircle,
    title: 'AI Conversation Coach',
    desc: 'Real-time suggestions that help you start genuine conversations — not cheesy pick-up lines, but thoughtful, authentic icebreakers.',
    color: 'amber',
  },
  {
    icon: Shield,
    title: 'Safety Score',
    desc: 'Behavioral AI monitors for red flags in communication patterns. You get context clues so you can always make informed decisions.',
    color: 'green',
  },
  {
    icon: Zap,
    title: 'Daily 5 Matches',
    desc: 'No infinite scrolling. Every morning you get 5 deeply curated matches. Quality over quantity — always.',
    color: 'violet',
  },
  {
    icon: Coffee,
    title: 'AI Date Planner',
    desc: 'Once you\'re ready, our AI generates personalized first-date ideas based on your shared interests, city, and vibe.',
    color: 'rose',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Build Your Aura Profile',
    desc: 'Go beyond photos. Answer our 10-minute personality deep-dive that reveals your communication style, values, and relationship patterns.',
    icon: Users,
  },
  {
    step: '02',
    title: 'AI Runs the Analysis',
    desc: 'Our model analyzes thousands of compatibility signals — not just who you say you are, but who you show up as.',
    icon: Brain,
  },
  {
    step: '03',
    title: 'Receive Your Daily 5',
    desc: 'Every morning, 5 new matches arrive with a full compatibility report. Read why you\'re a match before you even say hello.',
    icon: Sparkles,
  },
  {
    step: '04',
    title: 'Connect Authentically',
    desc: 'Chat with AI coaching support. When it feels right, let our Date Planner craft the perfect first meeting.',
    icon: Heart,
  },
];

const TESTIMONIALS = [
  {
    name: 'Natalie R.',
    age: 29,
    city: 'New York',
    photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&q=80',
    text: 'I was on Hinge for two years and got nowhere. Kindred matched me with my now-boyfriend in week one. The compatibility report was scarily accurate — it explained things about us I couldn\'t have articulated myself.',
    stars: 5,
    verified: true,
  },
  {
    name: 'Marcus T.',
    age: 32,
    city: 'Los Angeles',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    text: 'The AI coach actually helped me open up in ways I normally don\'t. The conversation suggestions weren\'t cringey — they were thoughtful. I genuinely had better first conversations here than anywhere else.',
    stars: 5,
    verified: true,
  },
  {
    name: 'Aisha K.',
    age: 27,
    city: 'Chicago',
    photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&q=80',
    text: 'As someone who\'s naturally guarded, the safety score feature made me feel protected. And only 5 matches a day meant I actually paid attention to each one instead of mindlessly swiping.',
    stars: 5,
    verified: true,
  },
];

const STATS = [
  { value: '94%', label: 'of users report better quality conversations' },
  { value: '3.2×', label: 'more likely to go on a second date vs. other apps' },
  { value: '89%', label: 'say matches feel genuinely compatible' },
  { value: '47k+', label: 'meaningful relationships started' },
];

function FloatingCard({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div
      className={`glass rounded-2xl p-4 ${className}`}
      style={{ animation: `float ${4 + delay}s ease-in-out ${delay}s infinite` }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex-shrink-0" />
        <div className="space-y-1.5">
          <div className="h-2.5 rounded-full bg-white/20 w-20" />
          <div className="h-2 rounded-full bg-white/10 w-14" />
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-green-400 font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          94%
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div style={{ background: '#07070f', minHeight: '100vh', color: '#f0f0ff' }}>
      {/* ── Nav ── */}
      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          transition: 'all 0.3s ease',
          background: scrolled ? 'rgba(7,7,15,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #7c3aed, #db2777)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(124,58,237,0.4)',
            }}>
              <Heart size={18} color="white" fill="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em' }}>kindred</span>
          </Link>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hidden md:flex">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} style={{
                color: 'rgba(240,240,255,0.6)', fontSize: 14, fontWeight: 500,
                textDecoration: 'none', transition: 'color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f0f0ff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,240,255,0.6)')}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/auth/login" className="btn-ghost hidden-mobile" style={{ padding: '9px 20px', fontSize: 14 }}>
              Sign in
            </Link>
            <Link href="/auth/signup" className="btn-primary" style={{ padding: '9px 20px', fontSize: 14 }}>
              Get Started
            </Link>
            {/* Hamburger — mobile only */}
            <button
              className="hamburger-btn"
              onClick={() => setMenuOpen(o => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,240,255,0.7)', padding: 4, display: 'none' }}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile nav menu */}
        {menuOpen && (
          <div className="mobile-menu" style={{
            background: 'rgba(7,7,15,0.97)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            padding: '12px 24px 20px',
            display: 'none',
            flexDirection: 'column',
            gap: 4,
          }}>
            {NAV_LINKS.map(l => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                style={{ color: 'rgba(240,240,255,0.65)', fontSize: 15, fontWeight: 500, textDecoration: 'none', padding: '12px 4px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'block' }}
              >
                {l.label}
              </a>
            ))}
            <Link href="/auth/login" onClick={() => setMenuOpen(false)} style={{ color: 'rgba(240,240,255,0.65)', fontSize: 15, fontWeight: 500, textDecoration: 'none', padding: '12px 4px', display: 'block' }}>
              Sign in
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', paddingTop: 100 }}>
        {/* Orbs */}
        <div className="orb" style={{ width: 600, height: 600, background: 'rgba(124,58,237,0.18)', top: -200, left: -200 }} />
        <div className="orb" style={{ width: 500, height: 500, background: 'rgba(244,63,94,0.12)', bottom: -100, right: -100 }} />
        <div className="orb" style={{ width: 300, height: 300, background: 'rgba(251,191,36,0.08)', top: '40%', right: '20%' }} />

        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="hero-grid">

            {/* Left */}
            <div>
              {/* Pill badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 999, padding: '6px 14px', marginBottom: 28 }}>
                <Sparkles size={13} color="#a78bfa" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#c4b5fd', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Powered by Deep AI</span>
              </div>

              <h1 style={{ fontSize: 'clamp(42px, 5vw, 68px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 24 }}>
                Dating that{' '}
                <span className="gradient-text">actually</span>
                <br />understands you.
              </h1>

              <p style={{ fontSize: 18, lineHeight: 1.65, color: 'rgba(240,240,255,0.55)', marginBottom: 36, maxWidth: 460 }}>
                Kindred goes beyond surface-level matching. Our AI analyzes personality, attachment style, values, and communication patterns to find people who truly fit.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <Link href="/auth/signup" className="btn-primary" style={{ fontSize: 16, padding: '15px 32px' }}>
                  Find Your Match
                  <ArrowRight size={18} />
                </Link>
                <Link href="#how-it-works" className="btn-ghost" style={{ fontSize: 15 }}>
                  See How It Works
                </Link>
              </div>

              {/* Trust signals */}
              <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                {[
                  { icon: Lock, label: 'Privacy first' },
                  { icon: CheckCircle, label: 'Verified profiles' },
                  { icon: Star, label: '4.9 rating' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(240,240,255,0.4)', fontSize: 13 }}>
                    <Icon size={14} color="rgba(139,92,246,0.8)" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — app mockup */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              {/* Phone frame */}
              <div style={{
                width: 280, height: 560,
                background: 'rgba(15,15,26,0.9)',
                borderRadius: 40,
                border: '1.5px solid rgba(255,255,255,0.1)',
                boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03), inset 0 0 0 1px rgba(255,255,255,0.05)',
                overflow: 'hidden',
                position: 'relative',
                animation: 'float 6s ease-in-out infinite',
              }}>
                {/* Status bar */}
                <div style={{ padding: '14px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>9:41</span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ width: 3, height: 6 + i * 3, background: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />)}
                  </div>
                </div>

                {/* Match card */}
                <div style={{ padding: '16px 16px 0' }}>
                  <div style={{ height: 280, borderRadius: 24, overflow: 'hidden', position: 'relative' }}>
                    <img
                      src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&q=80"
                      alt="Match preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div className="match-overlay" />

                    {/* Compat badge */}
                    <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 999, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399' }}>94% match</span>
                    </div>

                    <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>Sophie, 26</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Art Director · 2 km away</div>
                    </div>
                  </div>

                  {/* Compat bars */}
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[['Values', 92], ['Communication', 95], ['Lifestyle', 91]].map(([label, val]) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', width: 72, flexShrink: 0 }}>{label}</span>
                        <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${val}%`, borderRadius: 2, background: 'linear-gradient(90deg, #7c3aed, #db2777)' }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#a78bfa' }}>{val}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(244,63,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(244,63,94,0.08)' }}>
                      <span style={{ fontSize: 16 }}>✕</span>
                    </div>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', border: '1.5px solid rgba(139,92,246,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(139,92,246,0.12)', boxShadow: '0 0 20px rgba(139,92,246,0.25)' }}>
                      <Heart size={22} color="#a78bfa" fill="rgba(139,92,246,0.4)" />
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(251,191,36,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(251,191,36,0.08)' }}>
                      <Star size={16} color="#fbbf24" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              <div style={{ position: 'absolute', left: -60, top: '15%', width: 180 }} className="glass rounded-xl p-3">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Brain size={14} color="#a78bfa" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa' }}>AI Insight</span>
                </div>
                <p style={{ fontSize: 11, color: 'rgba(240,240,255,0.55)', lineHeight: 1.5 }}>You both have secure attachment styles and share creativity as a core value.</p>
              </div>

              <div style={{ position: 'absolute', right: -50, bottom: '20%', width: 160 }} className="glass rounded-xl p-3" >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                    <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&q=80" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#f0f0ff' }}>New match! 🎉</div>
                    <div style={{ fontSize: 10, color: 'rgba(240,240,255,0.45)' }}>Sophie liked you back</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }} className="stats-grid">
          {STATS.map(s => (
            <div key={s.value} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }} className="gradient-text">{s.value}</div>
              <div style={{ fontSize: 14, color: 'rgba(240,240,255,0.45)', lineHeight: 1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 999, padding: '5px 14px', marginBottom: 20 }}>
              <Sparkles size={12} color="#fb7185" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fb7185', letterSpacing: '0.05em', textTransform: 'uppercase' }}>What Sets Us Apart</span>
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
              Everything you need,<br />nothing you don&apos;t.
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(240,240,255,0.45)', maxWidth: 500, margin: '0 auto', lineHeight: 1.65 }}>
              Built for people who are serious about finding a real connection — not another dopamine loop.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="features-grid">
            {FEATURES.map(f => {
              const Icon = f.icon;
              const colors = {
                violet: { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)', icon: '#a78bfa' },
                rose: { bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.2)', icon: '#fb7185' },
                amber: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', icon: '#fde68a' },
                green: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)', icon: '#6ee7b7' },
              }[f.color];
              return (
                <div key={f.title} className="glass card-lift" style={{ borderRadius: 20, padding: 28 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: colors?.bg, border: `1px solid ${colors?.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Icon size={22} color={colors?.icon} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.5)', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{ padding: '100px 24px', background: 'rgba(15,15,26,0.6)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 999, padding: '5px 14px', marginBottom: 20 }}>
              <Zap size={12} color="#a78bfa" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Simple Process</span>
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, letterSpacing: '-0.03em' }}>
              From sign-up to first date<br />in 4 steps.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 28 }} className="steps-grid">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.step} style={{ position: 'relative' }}>
                  {i < STEPS.length - 1 && (
                    <div style={{ position: 'absolute', top: 24, left: 'calc(50% + 30px)', right: 0, height: 1, background: 'linear-gradient(90deg, rgba(139,92,246,0.4), transparent)' }} className="hidden lg:block" />
                  )}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <Icon size={24} color="#a78bfa" />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(139,92,246,0.6)', letterSpacing: '0.1em', marginBottom: 10 }}>STEP {s.step}</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>{s.title}</h3>
                    <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.45)', lineHeight: 1.65 }}>{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
              Real people,<br />real connections.
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(240,240,255,0.45)' }}>Don&apos;t take our word for it.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="testimonials-grid">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="glass card-lift" style={{ borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Stars */}
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} size={14} color="#fbbf24" fill="#fbbf24" />
                  ))}
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(240,240,255,0.7)', flex: 1 }}>&ldquo;{t.text}&rdquo;</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={t.photo} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</span>
                      {t.verified && <CheckCircle size={13} color="#34d399" fill="rgba(52,211,153,0.2)" />}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>Age {t.age} · {t.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: '100px 24px', background: 'rgba(15,15,26,0.5)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>Simple, fair pricing.</h2>
            <p style={{ fontSize: 17, color: 'rgba(240,240,255,0.45)' }}>Start free. Upgrade when you&apos;re ready.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 900, margin: '0 auto' }} className="pricing-grid">
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'forever',
                features: ['3 daily matches', 'Basic compatibility score', 'Standard messaging', 'Profile creation'],
                cta: 'Start Free',
                href: '/auth/signup',
                highlight: false,
              },
              {
                name: 'Spark',
                price: '$19',
                period: 'per month',
                features: ['5 daily matches', 'Full compatibility breakdown', 'AI Conversation Coach', 'AI Date Planner', 'Safety Score', 'Priority matching'],
                cta: 'Start 7-Day Free Trial',
                href: '/auth/signup',
                highlight: true,
              },
              {
                name: 'Deep',
                price: '$39',
                period: 'per month',
                features: ['Unlimited matches', 'Everything in Spark', 'Advanced personality report', 'Dedicated AI coach', 'See who liked you', 'VIP support'],
                cta: 'Go Deep',
                href: '/auth/signup',
                highlight: false,
              },
            ].map(plan => (
              <div
                key={plan.name}
                style={{
                  borderRadius: 22,
                  padding: plan.highlight ? '2px' : undefined,
                  background: plan.highlight ? 'linear-gradient(135deg, rgba(139,92,246,0.6), rgba(244,63,94,0.5))' : undefined,
                }}
              >
                <div
                  className={plan.highlight ? '' : 'glass'}
                  style={{
                    background: plan.highlight ? '#0f0f1a' : undefined,
                    borderRadius: plan.highlight ? 20 : 22,
                    padding: 28,
                    height: '100%',
                    border: plan.highlight ? 'none' : undefined,
                    position: 'relative',
                  }}
                >
                  {plan.highlight && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #7c3aed, #db2777)', borderRadius: 999, padding: '4px 16px', fontSize: 11, fontWeight: 700, color: 'white', whiteSpace: 'nowrap' }}>
                      MOST POPULAR
                    </div>
                  )}
                  <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'rgba(240,240,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em' }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: 'rgba(240,240,255,0.4)' }}>/{plan.period}</span>
                  </div>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '20px 0' }} />
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(240,240,255,0.65)' }}>
                        <CheckCircle size={15} color={plan.highlight ? '#a78bfa' : '#34d399'} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={plan.highlight ? 'btn-primary' : 'btn-ghost'}
                    style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div className="cta-banner" style={{
            borderRadius: 28,
            padding: '64px 48px',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(219,39,119,0.1) 100%)',
            border: '1px solid rgba(139,92,246,0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div className="orb" style={{ width: 300, height: 300, background: 'rgba(124,58,237,0.15)', top: -100, left: -100 }} />
            <div className="orb" style={{ width: 200, height: 200, background: 'rgba(244,63,94,0.12)', bottom: -60, right: -60 }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💫</div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.15 }}>
                Your person is out there.<br />Let&apos;s find them.
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(240,240,255,0.5)', marginBottom: 36, lineHeight: 1.65 }}>
                Join 200,000+ people who found meaningful connections through genuine AI compatibility — not algorithms built to maximize screen time.
              </p>
              <Link href="/auth/signup" className="btn-primary" style={{ fontSize: 17, padding: '16px 40px' }}>
                Start for Free — No Card Required
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={14} color="white" fill="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.03em' }}>kindred</span>
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {['Privacy', 'Terms', 'Safety', 'Blog', 'Careers', 'Contact'].map(l => (
              <a key={l} href="#" style={{ fontSize: 13, color: 'rgba(240,240,255,0.35)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(240,240,255,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,240,255,0.35)')}
              >
                {l}
              </a>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.25)' }}>© 2026 Kindred. Made with ♥</div>
        </div>
      </footer>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; text-align: center; }
          .hero-grid > div:last-child { display: none; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .hamburger-btn { display: flex !important; }
          .hidden-mobile { display: none !important; }
          .mobile-menu { display: flex !important; }
          .cta-banner { padding: 40px 24px !important; }
          /* Footer flex */
          footer > div { flex-direction: column; align-items: flex-start !important; }
        }
      `}</style>
    </div>
  );
}
