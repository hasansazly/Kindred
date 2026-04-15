'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Heart, Sparkles, Shield, Star,
  Brain, Zap, Users, CheckCircle, ArrowRight, Menu, X, CircleDashed, ScanLine,
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Sign in', href: '/auth/login' },
];

const FEATURES = [
  {
    icon: ScanLine,
    title: 'Compatibility Clarity',
    desc: 'See exactly why a match fits before you invest time or emotional energy.',
    color: 'violet',
  },
  {
    icon: Zap,
    title: 'Daily Five',
    desc: 'Get five intentional introductions each day so depth stays higher than noise.',
    color: 'amber',
  },
  {
    icon: Brain,
    title: 'AI Conversation Coach',
    desc: 'Get concise guidance that helps conversations stay clear, human, and forward-moving.',
    color: 'rose',
  },
  {
    icon: Shield,
    title: 'Safety Score',
    desc: 'Spot pressure patterns early so you can date with context and confidence.',
    color: 'rose',
  },
];

const PROBLEM_COMPARE = [
  {
    title: 'Every other app',
    points: [
      'Delivers matches without meaningful context.',
      'Optimizes for swiping, not understanding.',
      'Prioritizes volume over emotional quality.',
      'Leaves momentum to chance after matching.',
    ],
    tone: 'muted' as const,
  },
  {
    title: 'Vinculo',
    points: [
      'Explains each match with visible compatibility logic.',
      'Keeps focus high with curated daily introductions.',
      'Builds shared momentum before the first date.',
      'Supports safer, clearer conversations throughout.',
    ],
    tone: 'bright' as const,
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Build Your Compatibility Profile',
    desc: 'Tell us your values, communication style, and relationship goals in a few quick steps.',
    icon: Users,
  },
  {
    step: '02',
    title: 'Meet Better Matches Daily',
    desc: 'We send a limited number of aligned matches each day to keep quality high.',
    icon: Brain,
  },
  {
    step: '03',
    title: 'Understand the Match',
    desc: 'You’ll see the key reasons a person fits before you invest your time or energy.',
    icon: Sparkles,
  },
  {
    step: '04',
    title: 'Keep Momentum Going',
    desc: 'Simple conversation support helps you avoid stalled chats and move forward clearly.',
    icon: Heart,
  },
];

const TESTIMONIALS = [
  {
    name: 'Natalie R.',
    age: 29,
    city: 'New York',
    initials: 'NR',
    text: 'I finally knew why a match made sense before the first message. That changed everything about how I date.',
    stars: 5,
    verified: true,
  },
  {
    name: 'Marcus T.',
    age: 32,
    city: 'Los Angeles',
    initials: 'MT',
    text: 'Vinculo gave me confidence instead of confusion. Fewer matches, better conversations, and no emotional whiplash.',
    stars: 5,
    verified: true,
  },
];

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
            <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em' }}>vinculo</span>
          </Link>

          {/* Nav links */}
          <div style={{ alignItems: 'center', gap: 32 }} className="nav-desktop-links">
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
              <h1 style={{ fontSize: 'clamp(42px, 5vw, 68px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 24 }}>
                Don&apos;t just get a match
                <br /> <span className="gradient-text">understand the match.</span>
              </h1>

              <p style={{ fontSize: 18, lineHeight: 1.65, color: 'rgba(240,240,255,0.55)', marginBottom: 36, maxWidth: 460 }}>
                Fewer, better matches with clear reasons, so you can invest your time and emotions with confidence.
              </p>

              <div className="hero-cta-group" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <Link href="/auth/signup" className="btn-primary" style={{ fontSize: 16, padding: '15px 32px' }}>
                  Start Dating with Clarity
                  <ArrowRight size={18} />
                </Link>
                <a href="#how-it-works" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(240,240,255,0.48)', textDecoration: 'none' }}>
                  See a Sample Match Breakdown
                </a>
              </div>

              <div style={{ marginTop: 20, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', fontSize: 12, color: 'rgba(240,240,255,0.35)', fontWeight: 500 }}>
                <span>Privacy first</span>
                <span>·</span>
                <span>Verified profiles</span>
                <span>·</span>
                <span>4.9 rating</span>
              </div>
            </div>

            {/* Right — compatibility report mockup */}
            <div className="hero-phone-wrap" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <div className="hero-phone-frame glass" style={{ width: 320, borderRadius: 28, padding: 22, animation: 'float 6s ease-in-out infinite' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Compatibility Report</div>
                    <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>Vinculo Match Clarity</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>92%</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {[
                    ['Values', 94],
                    ['Communication', 91],
                    ['Goals', 95],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 100, fontSize: 12, color: 'rgba(240,240,255,0.52)' }}>{label}</span>
                      <div style={{ flex: 1, height: 4, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div style={{ width: `${value}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #7c3aed, #db2777)' }} />
                      </div>
                      <span style={{ width: 30, textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#a78bfa' }}>{value}%</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.52)', lineHeight: 1.5 }}>
                  Why this match works: high alignment on values, communication style, and relationship intent.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section style={{ padding: '90px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 'clamp(30px, 4vw, 46px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 14 }}>
              Most apps match you. None explain why.
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(240,240,255,0.45)', maxWidth: 640, margin: '0 auto', lineHeight: 1.65 }}>
              Vinculo helps you decide where to invest your emotional energy before it gets wasted.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }} className="problem-grid">
            {PROBLEM_COMPARE.map(col => (
              <div key={col.title} className="glass" style={{ borderRadius: 20, padding: 28, border: col.tone === 'bright' ? '1px solid rgba(139,92,246,0.28)' : undefined }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, color: col.tone === 'bright' ? '#c4b5fd' : '#f0f0ff' }}>{col.title}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.points.map(point => (
                    <div key={point} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <CheckCircle size={14} color={col.tone === 'bright' ? '#a78bfa' : 'rgba(240,240,255,0.3)'} style={{ marginTop: 3, flexShrink: 0 }} />
                      <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.62)', lineHeight: 1.6 }}>{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Connection Track ── */}
      <section style={{ padding: '20px 24px 90px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="glass" style={{ borderRadius: 24, padding: '30px 28px', border: '1px solid rgba(139,92,246,0.25)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 999, padding: '5px 12px', marginBottom: 14 }}>
              <CircleDashed size={12} color="#a78bfa" />
              <span style={{ fontSize: 11, color: '#c4b5fd', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>New: Connection Track v1</span>
            </div>
            <h3 style={{ fontSize: 'clamp(26px, 3.4vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>
              Keep promising matches moving with purpose.
            </h3>
            <p style={{ fontSize: 16, color: 'rgba(240,240,255,0.5)', lineHeight: 1.65, maxWidth: 760, marginBottom: 20 }}>
              Connection Track gives each match a lightweight shared cadence so conversations keep moving with purpose.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }} className="connection-grid">
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Daily micro-question</div>
                <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.52)', lineHeight: 1.6 }}>One short prompt each day keeps momentum alive.</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Weekly compatibility pulse</div>
                <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.52)', lineHeight: 1.6 }}>See how your alignment evolves over time.</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Pre-date intention check</div>
                <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.52)', lineHeight: 1.6 }}>Set expectations before meeting to reduce anxiety and mixed signals.</p>
              </div>
            </div>
          </div>
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
              Built for calm, confident decisions.
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(240,240,255,0.45)', maxWidth: 500, margin: '0 auto', lineHeight: 1.65 }}>
              Connection Track leads the experience. Everything else exists to make your next choice clearer.
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
                <div key={f.title} className="glass card-lift" style={{ borderRadius: 20, padding: 28, border: f.title === 'Compatibility Clarity' ? '1px solid rgba(139,92,246,0.35)' : undefined }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }} className="testimonials-grid">
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
                  <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#c4b5fd' }}>
                    {t.initials}
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
            <p style={{ fontSize: 17, color: 'rgba(240,240,255,0.45)' }}>Start with clarity. Upgrade when you want deeper guidance.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 900, margin: '0 auto' }} className="pricing-grid">
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'forever',
                features: ['3 daily matches', 'Core compatibility view', 'Standard messaging', 'Profile setup'],
                cta: 'Start Free',
                href: '/auth/signup',
                highlight: false,
              },
              {
                name: 'Clarity',
                price: '$19',
                period: 'per month',
                features: ['5 daily matches', 'Full match explanation', 'AI Conversation Coach', 'Connection Track', 'Safety Score', 'Priority matching'],
                cta: 'Start 7-Day Free Trial',
                href: '/auth/signup',
                highlight: true,
              },
              {
                name: 'Intelligence',
                price: '$39',
                period: 'per month',
                features: ['Expanded match access', 'Everything in Clarity', 'Deeper compatibility insights', 'Advanced connection guidance', 'Date intention tools', 'VIP support'],
                cta: 'Go Deep',
                href: '/auth/signup',
                highlight: false,
              },
            ].map(plan => (
              <div
                key={plan.name}
                className={`pricing-item ${plan.highlight ? 'pricing-item-featured' : ''}`}
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
                    {plan.name === 'Clarity' ? 'Start Free Trial' : plan.name === 'Intelligence' ? 'Choose Intelligence' : 'Start Free'}
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
                Join 200,000+ people choosing more intentional, compatibility-first dating.
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
            <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.03em' }}>vinculo</span>
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
          <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.25)' }}>© 2026 Vinculo. Made with ♥</div>
        </div>
      </footer>

      {/* Responsive styles */}
      <style>{`
        .nav-desktop-links { display: flex; }
        @media (max-width: 767px) {
          .nav-desktop-links { display: none !important; }
          .hero-grid { grid-template-columns: 1fr !important; gap: 24px !important; text-align: center; }
          .hero-phone-wrap { margin-top: 24px; }
          .hero-phone-frame { width: min(280px, 100%) !important; max-width: 280px !important; }
          .hero-floating-card { display: none !important; }
          .hero-cta-group { flex-direction: column !important; }
          .hero-cta-group > a { width: 100% !important; }
          .problem-grid { grid-template-columns: 1fr !important; }
          .connection-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { display: flex !important; flex-direction: column; }
          .pricing-item { order: 2; }
          .pricing-item-featured { order: 1; }
        }
        @media (max-width: 600px) {
          .steps-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 767px) {
          .hamburger-btn { display: flex !important; }
          .nav-login-link { display: none !important; }
          .mobile-menu { display: flex !important; }
          .cta-banner { padding: 40px 24px !important; }
          /* Footer flex */
          footer > div { flex-direction: column; align-items: flex-start !important; }
        }
      `}</style>
    </div>
  );
}
