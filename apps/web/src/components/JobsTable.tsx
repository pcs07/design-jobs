'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { JobRecord, SortOption, LocationFilter, RoleFilter, DateFilter, ExperienceFilter } from '@/lib/types';
import {
  relativeTime,
  detectLocationType,
  parseSalaryNum,
  detectRoleCategory,
  detectExperienceLevel,
} from '@/lib/utils';

const PAGE_SIZE = 25;

type SortCol = 'company' | 'title' | 'location' | 'experience' | 'salary' | 'posted';

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none" stroke="currentColor" strokeWidth="1.3" className="opacity-30 inline ml-1">
      <path d="M5 1v10M2 4l3-3 3 3M2 8l3 3 3-3" />
    </svg>
  );
  return dir === 'asc'
    ? <svg width="10" height="12" viewBox="0 0 10 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-500 inline ml-1"><path d="M5 10V2M2 5l3-3 3 3" /></svg>
    : <svg width="10" height="12" viewBox="0 0 10 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-500 inline ml-1"><path d="M5 2v8M2 7l3 3 3-3" /></svg>;
}

function ExternalIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="inline flex-shrink-0">
      <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7" />
      <path d="M7 1h4v4" /><path d="M11 1L5.5 6.5" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 5l4 4 4-4" />
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
      {type !== 'unknown' && type !== 'onsite' && (
        <span className="mr-1 capitalize">{type}</span>
      )}
      <span className="max-w-[140px] truncate">{location || '—'}</span>
    </span>
  );
}

function RoleBadge({ title }: { title: string }) {
  const role = detectRoleCategory(title);
  const colors: Record<string, string> = {
    'Product Designer': 'bg-purple-50 text-purple-700',
    'UX Designer': 'bg-blue-50 text-blue-700',
    'UI Designer': 'bg-sky-50 text-sky-700',
    'Researcher': 'bg-teal-50 text-teal-700',
    'Design Systems': 'bg-indigo-50 text-indigo-700',
    'Motion': 'bg-pink-50 text-pink-700',
    'Content': 'bg-orange-50 text-orange-700',
    'Visual Designer': 'bg-violet-50 text-violet-700',
    'Leadership': 'bg-amber-50 text-amber-700',
    'Other': 'bg-slate-50 text-slate-500',
  };
  return (
    <span className={`badge ${colors[role] ?? colors['Other']}`}>
      {role}
    </span>
  );
}

// ── Filter select component ──────────────────────────────────────────────────

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="select-base pr-8 appearance-none cursor-pointer"
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
        <ChevronDown />
      </span>
    </div>
  );
}

// ── Active filter chip ────────────────────────────────────────────────────────

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-blue-900 ml-0.5" aria-label={`Remove ${label} filter`}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 2l6 6M8 2l-6 6" />
        </svg>
      </button>
    </span>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  jobs: JobRecord[];
  showCompanyCol?: boolean;
  generatedAt?: string | null;
  companyName?: string;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function JobsTable({
  jobs,
  showCompanyCol = true,
  generatedAt,
  companyName,
}: Props) {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [expFilter, setExpFilter] = useState<ExperienceFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [sortCol, setSortCol] = useState<SortCol>('posted');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);

  function handleColSort(col: SortCol) {
    if (col === sortCol) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir(col === 'posted' || col === 'salary' || col === 'experience' ? 'desc' : 'asc');
    }
    setSortBy('newest'); // reset dropdown when using column sort
    setPage(1);
  }

  const reset = (setter: (v: never) => void, val: never) => {
    setter(val);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const now = Date.now();
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
      result = result.filter((j) => detectLocationType(j.location) === locationFilter);
    }

    if (roleFilter !== 'all') {
      const roleMap: Record<RoleFilter, string> = {
        all: '',
        product_designer: 'Product Designer',
        ux_designer: 'UX Designer',
        ui_designer: 'UI Designer',
        researcher: 'Researcher',
        design_systems: 'Design Systems',
        motion: 'Motion',
        content: 'Content',
        visual: 'Visual Designer',
        leadership: 'Leadership',
        other: 'Other',
      };
      result = result.filter((j) => detectRoleCategory(j.title) === roleMap[roleFilter]);
    }

    if (dateFilter !== 'all') {
      const days: Record<DateFilter, number> = { all: 0, '7d': 7, '30d': 30, '90d': 90 };
      const cutoff = now - days[dateFilter] * 86400000;
      result = result.filter((j) => {
        if (!j.postedAt) return false;
        return new Date(j.postedAt).getTime() >= cutoff;
      });
    }

    if (expFilter !== 'all') {
      result = result.filter((j) => detectExperienceLevel(j.experience) === expFilter);
    }

    result.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;

      // Column header sort takes priority
      switch (sortCol) {
        case 'company': return dir * a.company.localeCompare(b.company);
        case 'title': return dir * a.title.localeCompare(b.title);
        case 'location': return dir * a.location.localeCompare(b.location);
        case 'experience': {
          const ea = parseInt(a.experience ?? '0') || 0;
          const eb = parseInt(b.experience ?? '0') || 0;
          return dir * (ea - eb);
        }
        case 'salary': return dir * (parseSalaryNum(a.salary) - parseSalaryNum(b.salary));
        case 'posted': {
          const ta = a.postedAt ? new Date(a.postedAt).getTime() : 0;
          const tb = b.postedAt ? new Date(b.postedAt).getTime() : 0;
          return dir * (ta - tb);
        }
      }

      // Dropdown sort fallback
      if (sortBy === 'newest') {
        const ta = a.postedAt ? new Date(a.postedAt).getTime() : 0;
        const tb = b.postedAt ? new Date(b.postedAt).getTime() : 0;
        return tb - ta;
      }
      if (sortBy === 'salary_desc') return parseSalaryNum(b.salary) - parseSalaryNum(a.salary);
      if (sortBy === 'company_az') return a.company.localeCompare(b.company);
      return 0;
    });

    return result;
  }, [jobs, search, locationFilter, roleFilter, dateFilter, expFilter, sortBy, sortCol, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Active filter chips
  const activeFilters: { label: string; clear: () => void }[] = [];
  if (locationFilter !== 'all') activeFilters.push({ label: locationFilter, clear: () => { setLocationFilter('all'); setPage(1); } });
  if (roleFilter !== 'all') activeFilters.push({ label: roleFilter.replace('_', ' '), clear: () => { setRoleFilter('all'); setPage(1); } });
  if (dateFilter !== 'all') activeFilters.push({ label: `Last ${dateFilter}`, clear: () => { setDateFilter('all'); setPage(1); } });
  if (expFilter !== 'all') activeFilters.push({ label: expFilter, clear: () => { setExpFilter('all'); setPage(1); } });

  const hasRemote = jobs.some((j) => detectLocationType(j.location) === 'remote');
  const hasHybrid = jobs.some((j) => detectLocationType(j.location) === 'hybrid');

  return (
    <div>
      {/* Search row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6.5" cy="6.5" r="5" /><path d="M10.5 10.5l3 3" />
          </svg>
          <input
            type="text"
            placeholder={showCompanyCol ? 'Search company, title, location…' : 'Search title or location…'}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-base pl-9"
          />
        </div>

        <button
          onClick={() => setShowFilters((f) => !f)}
          className={`btn-ghost gap-1.5 ${showFilters ? 'bg-slate-100' : ''}`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 3h12M3 7h8M5 11h4" />
          </svg>
          Filters
          {activeFilters.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full leading-none">
              {activeFilters.length}
            </span>
          )}
        </button>

        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as SortOption); setPage(1); }}
            className="select-base pr-8 appearance-none cursor-pointer"
            aria-label="Sort jobs"
          >
            <option value="newest">Newest First</option>
            <option value="company_az">Company A–Z</option>
            <option value="salary_desc">Salary High–Low</option>
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><ChevronDown /></span>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Work Type</label>
            <FilterSelect
              label="Work type"
              value={locationFilter}
              onChange={(v) => { setLocationFilter(v); setPage(1); }}
              options={[
                { value: 'all', label: 'All types' },
                ...(hasRemote ? [{ value: 'remote' as LocationFilter, label: 'Remote' }] : []),
                ...(hasHybrid ? [{ value: 'hybrid' as LocationFilter, label: 'Hybrid' }] : []),
                { value: 'onsite', label: 'On-site' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Role Type</label>
            <FilterSelect
              label="Role type"
              value={roleFilter}
              onChange={(v) => { setRoleFilter(v); setPage(1); }}
              options={[
                { value: 'all', label: 'All roles' },
                { value: 'product_designer', label: 'Product Designer' },
                { value: 'ux_designer', label: 'UX Designer' },
                { value: 'ui_designer', label: 'UI Designer' },
                { value: 'researcher', label: 'Researcher' },
                { value: 'design_systems', label: 'Design Systems' },
                { value: 'motion', label: 'Motion' },
                { value: 'content', label: 'Content' },
                { value: 'visual', label: 'Visual Designer' },
                { value: 'leadership', label: 'Leadership' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Posted Within</label>
            <FilterSelect
              label="Date posted"
              value={dateFilter}
              onChange={(v) => { setDateFilter(v); setPage(1); }}
              options={[
                { value: 'all', label: 'Any time' },
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' },
                { value: '90d', label: 'Last 3 months' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Experience</label>
            <FilterSelect
              label="Experience level"
              value={expFilter}
              onChange={(v) => { setExpFilter(v); setPage(1); }}
              options={[
                { value: 'all', label: 'All levels' },
                { value: 'entry', label: 'Entry (0–2 yrs)' },
                { value: 'mid', label: 'Mid (3–5 yrs)' },
                { value: 'senior', label: 'Senior (6+ yrs)' },
              ]}
            />
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {activeFilters.map((f) => (
            <FilterChip key={f.label} label={f.label} onRemove={f.clear} />
          ))}
          <button
            onClick={() => {
              setLocationFilter('all');
              setRoleFilter('all');
              setDateFilter('all');
              setExpFilter('all');
              setPage(1);
            }}
            className="text-xs text-slate-400 hover:text-slate-600 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-3 text-sm text-slate-500">
        <span>
          <span className="font-medium text-slate-800">{filtered.length}</span> job{filtered.length !== 1 ? 's' : ''} found
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
          <table
            className="min-w-full divide-y divide-slate-200"
            aria-label={companyName ? `${companyName} UX jobs` : 'UX and design jobs'}
          >
            <thead className="bg-slate-50">
              <tr>
                {showCompanyCol && (
                  <th scope="col" onClick={() => handleColSort('company')}
                    className="th-base pl-5 cursor-pointer hover:bg-slate-100 select-none">
                    Company <SortIcon active={sortCol === 'company'} dir={sortDir} />
                  </th>
                )}
                <th scope="col" onClick={() => handleColSort('title')}
                  className="th-base cursor-pointer hover:bg-slate-100 select-none">
                  Role <SortIcon active={sortCol === 'title'} dir={sortDir} />
                </th>
                <th scope="col" className="th-base">Category</th>
                <th scope="col" onClick={() => handleColSort('location')}
                  className="th-base cursor-pointer hover:bg-slate-100 select-none">
                  Location <SortIcon active={sortCol === 'location'} dir={sortDir} />
                </th>
                <th scope="col" onClick={() => handleColSort('experience')}
                  className="th-base cursor-pointer hover:bg-slate-100 select-none">
                  Experience <SortIcon active={sortCol === 'experience'} dir={sortDir} />
                </th>
                <th scope="col" onClick={() => handleColSort('salary')}
                  className="th-base cursor-pointer hover:bg-slate-100 select-none">
                  Salary <SortIcon active={sortCol === 'salary'} dir={sortDir} />
                </th>
                <th scope="col" onClick={() => handleColSort('posted')}
                  className="th-base cursor-pointer hover:bg-slate-100 select-none">
                  Posted <SortIcon active={sortCol === 'posted'} dir={sortDir} />
                </th>
                <th scope="col" className="th-base">Apply</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={showCompanyCol ? 8 : 7}
                    className="px-6 py-16 text-center text-slate-400 text-sm"
                  >
                    {jobs.length === 0
                      ? 'No jobs yet — run the scraper or seed to populate data.'
                      : 'No jobs match your current filters.'}
                  </td>
                </tr>
              )}
              {paginated.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                  {showCompanyCol && (
                    <td className="px-5 py-3">
                      <Link
                        href={`/company/${job.companySlug}`}
                        className="text-sm font-medium text-slate-800 hover:text-blue-600 transition-colors whitespace-nowrap"
                      >
                        {job.company}
                      </Link>
                    </td>
                  )}
                  <td className="px-4 py-3 max-w-[240px]">
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
                    <RoleBadge title={job.title} />
                  </td>
                  <td className="px-4 py-3">
                    <LocationBadge location={job.location} />
                  </td>
                  <td className="table-cell-base">
                    {job.experience
                      ? <span className="text-slate-700">{job.experience}</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="table-cell-base">
                    {job.salary
                      ? <span className="text-slate-700 font-medium">{job.salary}</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="table-cell-base text-slate-400 whitespace-nowrap">
                    {job.postedAt
                      ? relativeTime(job.postedAt)
                      : job.postedText
                        ? job.postedText
                        : <span className="text-slate-300">—</span>}
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
            Page {page} of {totalPages}&nbsp;&middot;&nbsp;{filtered.length} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            {/* Page numbers — show up to 5 around current page */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              return start + i;
            }).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
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
