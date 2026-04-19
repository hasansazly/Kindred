import type { Metadata, Viewport } from 'next';
import './globals.css';
import ViewportFix from './ViewportFix';

export const metadata: Metadata = {
  title: {
    default: 'Vinculo — Intentional Dating with Clarity',
    template: '%s | Vinculo',
  },
  description:
    'Vinculo helps you understand why a match may fit before you invest your time or emotional energy. No endless swiping — just curated daily matches with clear compatibility context.',
  keywords: ['intentional dating', 'dating app', 'compatibility', 'meaningful connections', 'curated matches'],
  authors: [{ name: 'Vinculo' }],
  openGraph: {
    title: 'Vinculo — Intentional Dating with Clarity',
    description: 'Compatibility designed for real intent. Curated daily matches. Real connections.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ViewportFix />
        {children}
      </body>
    </html>
  );
}
