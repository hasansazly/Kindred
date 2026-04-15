import Link from 'next/link';

const policyProvider = (process.env.NEXT_PUBLIC_POLICY_PROVIDER ?? '').toLowerCase();
const managedPolicyUrl =
  policyProvider === 'termly'
    ? process.env.NEXT_PUBLIC_TERMLY_PRIVACY_URL
    : policyProvider === 'iubenda'
      ? process.env.NEXT_PUBLIC_IUBENDA_PRIVACY_URL
      : process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL;

const lastUpdated = process.env.NEXT_PUBLIC_PRIVACY_LAST_UPDATED ?? 'April 15, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 22 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 10 }}>{title}</h2>
      <div style={{ display: 'grid', gap: 10, color: 'rgba(240,240,255,0.72)', lineHeight: 1.7, fontSize: 14 }}>{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#07070f', color: '#f0f0ff', padding: '64px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10 }}>Privacy Policy</h1>
        <p style={{ fontSize: 15, color: 'rgba(240,240,255,0.62)', lineHeight: 1.7, marginBottom: 12 }}>
          Vinculo is built for intentional dating with clear privacy controls. This page explains what we collect, why we collect it, and how you can control it.
        </p>
        <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.4)', marginBottom: 24 }}>Last updated: {lastUpdated}</p>

        {managedPolicyUrl && (
          <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: '12px 14px', marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: 'rgba(240,240,255,0.75)', lineHeight: 1.6 }}>
              This policy is managed via {policyProvider === 'termly' ? 'Termly' : policyProvider === 'iubenda' ? 'iubenda' : 'our policy provider'}.
              {' '}
              <a href={managedPolicyUrl} target="_blank" rel="noreferrer" style={{ color: '#c4b5fd', textDecoration: 'none', fontWeight: 600 }}>
                View the hosted policy
              </a>
              .
            </p>
          </div>
        )}

        <Section title="1. Information We Collect">
          <p>Account information: name, email, age, profile details, photos, and onboarding responses.</p>
          <p>Usage information: actions you take in the app (likes, passes, messages, settings, and feature interactions).</p>
          <p>Device and technical information: IP address, browser type, and diagnostics used for reliability and security.</p>
        </Section>

        <Section title="2. Why We Use Your Information">
          <p>To provide and improve matching clarity, conversation support, trust features, and app performance.</p>
          <p>To detect abuse, enforce platform rules, and support moderation and safety workflows.</p>
          <p>To communicate important service updates, security notices, and support responses.</p>
        </Section>

        <Section title="3. Trust Signals and Safety Context">
          <p>Trust Signals may include verification status, profile completeness, and behavioral consistency cues.</p>
          <p>These signals are intended to provide context for better decisions; they are not guarantees about any person or outcome.</p>
          <p>You can use reporting and blocking tools at any time if an interaction feels unsafe or inappropriate.</p>
        </Section>

        <Section title="4. Legal Bases and Consent">
          <p>Where required, we process data based on consent, contractual necessity, legitimate interests, and legal obligations.</p>
          <p>You may withdraw consent for optional processing where applicable through your settings or by contacting support.</p>
        </Section>

        <Section title="5. Sharing and Third Parties">
          <p>We do not sell your personal data.</p>
          <p>We may share limited data with service providers that help us operate the product (hosting, analytics, infrastructure, and communications).</p>
          <p>We may disclose information when required by law or to protect users, platform integrity, or legal rights.</p>
        </Section>

        <Section title="6. Data Retention">
          <p>We keep data only as long as needed for product functionality, security, legal compliance, and legitimate business purposes.</p>
          <p>When data is no longer needed, we delete it or anonymize it.</p>
        </Section>

        <Section title="7. Your Privacy Controls">
          <p>You can update profile details, manage certain visibility preferences, and use safety controls directly in the app.</p>
          <p>You may request account deletion and data access by contacting support.</p>
          <p>Where applicable, you may also object to specific processing or request correction of inaccurate information.</p>
        </Section>

        <Section title="8. International Transfers">
          <p>If data is processed across regions, we apply appropriate safeguards under applicable privacy laws.</p>
        </Section>

        <Section title="9. Children">
          <p>Vinculo is intended for adults only. We do not knowingly collect personal information from individuals under 18.</p>
        </Section>

        <Section title="10. Contact">
          <p>
            For privacy questions, data requests, or concerns, contact us at{' '}
            <a href="mailto:privacy@tryvinculo.app" style={{ color: '#c4b5fd', textDecoration: 'none' }}>
              privacy@tryvinculo.app
            </a>
            .
          </p>
        </Section>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 26 }}>
          <Link href="/" style={{ color: '#a78bfa', textDecoration: 'none' }}>Back to home</Link>
          <Link href="/terms" style={{ color: 'rgba(240,240,255,0.62)', textDecoration: 'none' }}>View Terms</Link>
        </div>
      </div>
    </main>
  );
}

