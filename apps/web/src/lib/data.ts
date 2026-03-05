import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { JobsData, CompanyConfig, CompanyStat } from './types';

// process.cwd() = apps/web when running next dev / next build
const JOBS_FILE = join(process.cwd(), 'public', 'data', 'jobs.json');
const COMPANIES_FILE = join(process.cwd(), '..', '..', 'config', 'companies.json');

export function loadJobsData(): JobsData {
  if (!existsSync(JOBS_FILE)) {
    return { generatedAt: null, totalJobs: 0, jobs: [] };
  }
  try {
    const raw = readFileSync(JOBS_FILE, 'utf-8');
    return JSON.parse(raw) as JobsData;
  } catch {
    return { generatedAt: null, totalJobs: 0, jobs: [] };
  }
}

export function loadCompaniesConfig(): CompanyConfig[] {
  if (!existsSync(COMPANIES_FILE)) return [];
  try {
    const raw = readFileSync(COMPANIES_FILE, 'utf-8');
    return JSON.parse(raw) as CompanyConfig[];
  } catch {
    return [];
  }
}

export function buildCompanyStats(
  companies: CompanyConfig[],
  data: JobsData
): CompanyStat[] {
  return companies.map((c) => {
    const jobs = data.jobs.filter((j) => j.companySlug === c.slug);
    const dates = jobs
      .map((j) => (j.postedAt ? new Date(j.postedAt).getTime() : 0))
      .filter((t) => t > 0);
    const lastUpdated =
      dates.length > 0
        ? new Date(Math.max(...dates)).toISOString()
        : data.generatedAt;
    return {
      slug: c.slug,
      name: c.name,
      domain: c.domain,
      portalUrl: c.portalUrl,
      jobCount: jobs.length,
      lastUpdated,
    };
  });
}
