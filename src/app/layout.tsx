import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Source_Sans_3 } from 'next/font/google';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400','500','600','700'],
  variable: '--font-display',
});
const text = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-text',
});

export const metadata: Metadata = {
  title: 'Wedding Guests',
  description: 'Guests list with audio intros (offline-ready)',
  manifest: '/manifest.webmanifest',
};
export const viewport: Viewport = { themeColor: '#f3a6bf' }; // softer pink

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={`${display.variable} ${text.variable}`}>
      <body className="font-text antialiased">{children}</body>
    </html>
  );
}