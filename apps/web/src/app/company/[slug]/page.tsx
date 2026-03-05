import { notFound } from 'next/navigation';
import Link from 'next/link';
import { loadJobsData, loadCompaniesConfig } from '@/lib/data';
import JobsTable from '@/components/JobsTable';
import type { CompanyConfig } from '@/lib/types';

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
    title: `${company.name} Design Jobs — DesignJobsHub`,
    description: `Browse design, UX, and product design jobs at ${company.name}.`,
  };
}

export default function CompanyPage({ params }: Props) {
  const companies = loadCompaniesConfig();
  const company = companies.find((c: CompanyConfig) => c.slug === params.slug);

  if (!company) notFound();

  const { jobs, generatedAt } = loadJobsData();
  const companyJobs = jobs.filter((j) => j.companySlug === params.slug);

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
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shadow-sm">
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
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-slate-500">
              {companyJobs.length} design job{companyJobs.length !== 1 ? 's' : ''}
            </span>
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
