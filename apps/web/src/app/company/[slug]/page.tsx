import { notFound } from 'next/navigation';
import Link from 'next/link';
import { loadJobsData, loadCompaniesConfig } from '@/lib/data';
import JobsTable from '@/components/JobsTable';
import type { CompanyConfig } from '@/lib/types';
import { isUSLocation } from '@/lib/utils';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const companies = loadCompaniesConfig();
  return companies.map((c: CompanyConfig) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: Props) {
  const companies = loadCompaniesConfig();
  const company = companies.find((c: CompanyConfig) => c.slug === params.slug);
  if (!company) return {};
  return {
    title: `${company.name} UX & Design Jobs — UX Jobs in US`,
    description: `Browse US-based UX, product design, and research jobs at ${company.name}.`,
  };
}

export default function CompanyPage({ params }: Props) {
  const companies = loadCompaniesConfig();
  const company = companies.find((c: CompanyConfig) => c.slug === params.slug);

  if (!company) notFound();

  const { jobs, generatedAt } = loadJobsData();

  // Only show US locations on company pages
  const companyJobs = jobs
    .filter((j) => j.companySlug === params.slug)
    .filter((j) => isUSLocation(j.location));

  const totalAtCompany = jobs.filter((j) => j.companySlug === params.slug).length;
  const nonUSCount = totalAtCompany - companyJobs.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500 mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Companies
            </Link>
          </li>
          <li className="text-slate-300">/</li>
          <li className="text-slate-900 font-medium">{company.name}</li>
        </ol>
      </nav>

      {/* Company header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shadow-sm flex-shrink-0">
          <img
            src={`https://logo.clearbit.com/${company.domain}`}
            alt={company.name}
            width={56}
            height={56}
            className="w-14 h-14 object-contain"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-sm text-slate-500">
              {companyJobs.length} US design job{companyJobs.length !== 1 ? 's' : ''}
            </span>
            {nonUSCount > 0 && (
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {nonUSCount} non-US role{nonUSCount !== 1 ? 's' : ''} hidden
              </span>
            )}
            <span className="text-slate-300">·</span>
            <a
              href={company.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              Official careers page
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7" />
                <path d="M7 1h4v4" /><path d="M11 1L5.5 6.5" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* US-only notice */}
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-6 w-fit">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="6.5" cy="6.5" r="5.5" />
          <path d="M6.5 6v3M6.5 4v.5" />
        </svg>
        Showing US-based and US remote roles only
      </div>

      {/* Jobs table */}
      <JobsTable
        jobs={companyJobs}
        showCompanyCol={false}
        generatedAt={generatedAt}
        companyName={company.name}
      />
    </div>
  );
}
