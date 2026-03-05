import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Design Jobs Hub — Top 100 Companies',
  description:
    'Aggregated design job listings from the top 100 tech companies. Find UX, product design, design systems, and research roles in one place.',
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
            Design Jobs Hub — data refreshed daily via GitHub Actions. Jobs
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
