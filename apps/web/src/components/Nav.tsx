'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const path = usePathname();

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold text-base">
          <span className="text-blue-400">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect x="2" y="2" width="7" height="7" rx="1.5" />
              <rect x="11" y="2" width="7" height="7" rx="1.5" opacity="0.6" />
              <rect x="2" y="11" width="7" height="7" rx="1.5" opacity="0.6" />
              <rect x="11" y="11" width="7" height="7" rx="1.5" opacity="0.3" />
            </svg>
          </span>
          <span>DesignJobsHub</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              path === '/'
                ? 'bg-slate-700 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Companies
          </Link>
          <Link
            href="/jobs"
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              path === '/jobs'
                ? 'bg-slate-700 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Jobs
          </Link>
        </nav>
      </div>
    </header>
  );
}
