import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'UX Jobs in US — Top 200 Companies',
  description:
    'Aggregated UX and design job listings from the top 200 US tech companies. Find product design, UX research, design systems, and more — all in one place.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="bg-slate-900 text-slate-400 text-xs py-6 px-4 text-center mt-12">
          <p>
            UX Jobs in US — data refreshed daily via GitHub Actions. Jobs
            sourced from official company portals.
          </p>
          <p className="mt-1">
            Not affiliated with any listed company. Always verify listings on
            the official portal.
          </p>
        </footer>
      </body>
    </html>
  );
}
