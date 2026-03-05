'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { JobRecord, SortOption, LocationFilter } from '@/lib/types';
import { relativeTime, detectLocationType, parseSalaryNum } from '@/lib/utils';

const PAGE_SIZE = 25;

function ExternalIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="inline flex-shrink-0">
      <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7" />
      <path d="M7 1h4v4" /><path d="M11 1L5.5 6.5" />
    </svg>
  );
}

function LocationBadge({ location }: { location: string }) {
  const type = detectLocationType(location);
  const styles: Record<string, string> = {
    remote: 'bg-green-50 text-green-700 border-green-200',
    hybrid: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    onsite: 'bg-slate-100 text-slate-600 border-slate-200',
    unknown: 'bg-slate-100 text-slate-400 border-slate-200',
  };
  return (
    <span className={`badge border ${styles[type]}`}>
      {type !== 'unknown' && type !== 'onsite' ? (
        <span className="mr-1 capitalize">{type}</span>
      ) : null}
      <span className="max-w-[140px] truncate">{location || '—'}</span>
    </span>
  );
}

interface Props {
  jobs: JobRecord[];
  showCompanyCol?: boolean;
  generatedAt?: string | null;
  companyName?: string;
}

export default function JobsTable({
  jobs,
  showCompanyCol = true,
  generatedAt,
  companyName,
}: Props) {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...jobs];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q)
      );
    }

    if (locationFilter !== 'all') {
      result = result.filter(
        (j) => detectLocationType(j.location) === locationFilter
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') {
        const ta = a.postedAt ? new Date(a.postedAt).getTime() : 0;
        const tb = b.postedAt ? new Date(b.postedAt).getTime() : 0;
        return tb - ta;
      }
      if (sortBy === 'salary_desc') {
        return parseSalaryNum(b.salary) - parseSalaryNum(a.salary);
      }
      if (sortBy === 'company_az') {
        return a.company.localeCompare(b.company);
      }
      return 0;
    });

    return result;
  }, [jobs, search, locationFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleLocationFilter = (v: LocationFilter) => { setLocationFilter(v); setPage(1); };
  const handleSort = (v: SortOption) => { setSortBy(v); setPage(1); };

  const hasRemote = jobs.some((j) => detectLocationType(j.location) === 'remote');
  const hasHybrid = jobs.some((j) => detectLocationType(j.location) === 'hybrid');

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6.5" cy="6.5" r="5" /><path d="M10.5 10.5l3 3" />
          </svg>
          <input
            type="text"
            placeholder={showCompanyCol ? 'Search by company, title, location…' : 'Search by title or location…'}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-base pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {(hasRemote || hasHybrid) && (
            <select
              value={locationFilter}
              onChange={(e) => handleLocationFilter(e.target.value as LocationFilter)}
              className="select-base"
              aria-label="Filter by location type"
            >
              <option value="all">All Locations</option>
              {hasRemote && <option value="remote">Remote</option>}
              {hasHybrid && <option value="hybrid">Hybrid</option>}
              <option value="onsite">On-site</option>
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value as SortOption)}
            className="select-base"
            aria-label="Sort jobs"
          >
            <option value="newest">Newest First</option>
            <option value="company_az">Company A–Z</option>
            <option value="salary_desc">Salary High–Low</option>
          </select>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-3 text-sm text-slate-500">
        <span>
          {filtered.length} job{filtered.length !== 1 ? 's' : ''} found
          {search && <span className="ml-1">for &ldquo;{search}&rdquo;</span>}
        </span>
        {generatedAt && (
          <span className="text-xs text-slate-400">
            Updated {relativeTime(generatedAt)}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200" aria-label={companyName ? `${companyName} design jobs` : 'Design jobs'}>
            <thead className="bg-slate-50">
              <tr>
                {showCompanyCol && <th scope="col" className="th-base pl-5">Company</th>}
                <th scope="col" className="th-base">Job Title</th>
                <th scope="col" className="th-base">Location</th>
                <th scope="col" className="th-base">Experience</th>
                <th scope="col" className="th-base">Salary Range</th>
                <th scope="col" className="th-base">Posted</th>
                <th scope="col" className="th-base">Apply</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={showCompanyCol ? 7 : 6}
                    className="px-6 py-16 text-center text-slate-400 text-sm"
                  >
                    {jobs.length === 0
                      ? 'No design jobs yet. Run the scraper to collect jobs.'
                      : 'No jobs match your filters.'}
                  </td>
                </tr>
              )}
              {paginated.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  {showCompanyCol && (
                    <td className="px-5 py-3">
                      <Link
                        href={`/company/${job.companySlug}`}
                        className="text-sm font-medium text-slate-800 hover:text-blue-600 transition-colors"
                      >
                        {job.company}
                      </Link>
                    </td>
                  )}
                  <td className="px-4 py-3 max-w-[260px]">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors line-clamp-2"
                    >
                      {job.title}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <LocationBadge location={job.location} />
                  </td>
                  <td className="table-cell-base">
                    {job.experience ? (
                      <span className="text-slate-700">{job.experience}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="table-cell-base">
                    {job.salary ? (
                      <span className="text-slate-700 font-medium">{job.salary}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="table-cell-base text-slate-400">
                    {job.postedAt ? relativeTime(job.postedAt) : (job.postedText || <span className="text-slate-300">—</span>)}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                    >
                      Apply <ExternalIcon />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages} &middot; {filtered.length} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
