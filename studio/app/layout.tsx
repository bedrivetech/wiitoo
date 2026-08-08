import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import StudioShell from './shell';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Wiitoo Studio',
  description: 'Creator dashboard for Wiitoo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <StudioShell>{children}</StudioShell>
      </body>
    </html>
  );
}