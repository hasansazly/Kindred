import Link from 'next/link';

export default function ContactPage() {
  return (
    <main className="contrast-safe light-page" style={{ minHeight: '100vh', background: '#FDF0F5', color: '#1A1A2E', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ borderBottom: '1px solid #F4C0D1', background: 'rgba(253,240,245,0.85)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #D4537E, #7F77DD)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 16, lineHeight: 1 }}>♥</span>
            </div>
            <span style={{ fontWeight: 500, fontSize: 24, letterSpacing: '-0.02em', fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}>vinculo</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link href="/auth/login" style={{ fontSize: 14, textDecoration: 'none', color: '#1A1A2E' }}>Sign in</Link>
            <Link href="/auth/signup" className="btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section style={{ flex: 1, padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{ marginBottom: 10 }}>Contact</h1>
          <p style={{ fontSize: 15, color: '#2C2C2A', lineHeight: 1.75, marginBottom: 12 }}>
            Need help or want to report an issue? Reach us at:
          </p>
          <p style={{ fontSize: 16, fontWeight: 600 }}>
            <a href="mailto:support@tryvinculo.app" style={{ color: '#534AB7', textDecoration: 'none' }}>support@tryvinculo.app</a>
          </p>
          <div style={{ marginTop: 24 }}>
            <Link href="/" className="btn-ghost" style={{ padding: '10px 20px' }}>Back to home</Link>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #2E2A49', padding: '36px 24px', background: '#1A1A2E' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <span style={{ color: '#CECBF6', fontSize: 13 }}>© 2026 Vinculo</span>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <Link href="/privacy" style={{ color: '#CECBF6', textDecoration: 'none', fontSize: 13 }}>Privacy</Link>
            <Link href="/terms" style={{ color: '#CECBF6', textDecoration: 'none', fontSize: 13 }}>Terms</Link>
            <Link href="/" style={{ color: '#CECBF6', textDecoration: 'none', fontSize: 13 }}>Home</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
