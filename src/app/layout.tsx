import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Kindred — AI Dating for Real Connections',
    template: '%s | Kindred',
  },
  description:
    'Kindred uses deep AI analysis to match you with people who genuinely complement your personality, values, and life goals. No endless swiping — just curated daily matches with transparent compatibility explanations.',
  keywords: ['AI dating', 'dating app', 'compatibility', 'meaningful connections', 'AI matchmaking'],
  authors: [{ name: 'Kindred' }],
  openGraph: {
    title: 'Kindred — AI Dating for Real Connections',
    description: 'Deep AI compatibility. Curated daily matches. Real connections.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#07070f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
