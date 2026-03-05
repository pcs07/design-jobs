import { matchesDesignKeyword } from '../utils/keywords';
import { generateId, stripHtml, extractSalary, extractExperience } from '../utils/extract';
import { withRetry } from '../utils/rateLimit';
import type { JobRecord, CompanyConfig } from '../schema';

const USER_AGENT =
  'DesignJobsHub/1.0 (https://github.com/your-org/design-jobs; hello@example.com)';

interface GreenhouseJob {
  id: number;
  title: string;
  updated_at: string;
  location: { name: string };
  absolute_url: string;
  content?: string;
  departments?: { name: string }[];
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

export async function fetchGreenhouseJobs(
  company: CompanyConfig
): Promise<JobRecord[]> {
  const token = company.boardToken ?? company.slug;
  const url = `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`;

  const data = await withRetry(async () => {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`Greenhouse API ${res.status} for ${company.name}: ${url}`);
    }
    return res.json() as Promise<GreenhouseResponse>;
  });

  const jobs: JobRecord[] = [];

  for (const job of data.jobs) {
    if (!matchesDesignKeyword(job.title)) continue;

    const text = job.content ? stripHtml(job.content) : '';

    jobs.push({
      id: generateId(company.name, job.title, job.location.name, job.absolute_url),
      company: company.name,
      companySlug: company.slug,
      title: job.title,
      location: job.location.name ?? '',
      experience: extractExperience(text),
      salary: extractSalary(text),
      postedAt: job.updated_at ?? null,
      postedText: null,
      url: job.absolute_url,
      source: 'greenhouse',
    });
  }

  console.log(`  ✓ ${company.name}: ${jobs.length} design jobs (Greenhouse)`);
  return jobs;
}
