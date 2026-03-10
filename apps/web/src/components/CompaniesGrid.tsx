'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { CompanyStat } from '@/lib/types';
import { relativeTime } from '@/lib/utils';

function ExternalIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="inline"
    >
      <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7" />
      <path d="M7 1h4v4" />
      <path d="M11 1L5.5 6.5" />
    </svg>
  );
}

function CompanyLogo({ domain, name }: { domain: string; name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt={name}
        width={32}
        height={32}
        className="w-8 h-8 object-contain"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
        }}
      />
      <span className="hidden text-xs font-bold text-slate-500">{initials}</span>
    </div>
  );
}

interface Props {
  companies: CompanyStat[];
  totalJobs: number;
  generatedAt: string | null;
}

export default function CompaniesGrid({ companies, totalJobs, generatedAt }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          1,500+ Top US Design Companies
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {companies.length} companies tracked &middot;{' '}
          <span className="font-medium text-blue-600">{totalJobs} design jobs</span>
          {generatedAt && (
            <span className="ml-2 text-slate-400">
              &middot; Last scraped {relativeTime(generatedAt)}
            </span>
          )}
        </p>
      </div>

      {/* Search + CTA */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="6.5" cy="6.5" r="5" />
            <path d="M10.5 10.5l3 3" />
          </svg>
          <input
            type="text"
            placeholder="Search companies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-9"
          />
        </div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          View All Design Jobs
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 7h10M8 3l4 4-4 4" />
          </svg>
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200" aria-label="Companies directory">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="th-base pl-6">Company</th>
                <th scope="col" className="th-base">Design Jobs</th>
                <th scope="col" className="th-base">Last Updated</th>
                <th scope="col" className="th-base">Job Portal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No companies found for &ldquo;{search}&rdquo;
                  </td>
                </tr>
              )}
              {filtered.map((company) => (
                <tr
                  key={company.slug}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-3">
                    <Link
                      href={`/company/${company.slug}`}
                      className="flex items-center gap-3 group"
                    >
                      <CompanyLogo domain={company.domain} name={company.name} />
                      <span className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                        {company.name}
                      </span>
                    </Link>
                  </td>
                  <td className="table-cell-base">
                    {company.jobCount > 0 ? (
                      <Link href={`/company/${company.slug}`}>
                        <span className="badge bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer">
                          {company.jobCount} job{company.jobCount !== 1 ? 's' : ''}
                        </span>
                      </Link>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-400">0 jobs</span>
                    )}
                  </td>
                  <td className="table-cell-base text-slate-400">
                    {relativeTime(company.lastUpdated)}
                  </td>
                  <td className="table-cell-base">
                    <a
                      href={company.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Careers page <ExternalIcon />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-slate-400 mt-3 text-right">
          Showing {filtered.length} of {companies.length} companies
        </p>
      )}
    </div>
  );
}
