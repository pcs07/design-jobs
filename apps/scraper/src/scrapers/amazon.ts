/**
 * Amazon Jobs — public JSON search API used by amazon.jobs
 */
import { matchesDesignKeyword } from '../utils/keywords';
import { generateId, stripHtml, extractSalary, extractExperience } from '../utils/extract';
import { withRetry, politeDelay } from '../utils/rateLimit';
import type { JobRecord, CompanyConfig } from '../schema';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

interface AmazonJob {
  id_icims: string;
  title: string;
  location: string;
  posted_date: string;
  description_short?: string;
  description?: string;
  basic_qualifications?: string;
  preferred_qualifications?: string;
  job_path?: string;
  salary_min?: number;
  salary_max?: number;
}

interface AmazonResponse {
  jobs?: AmazonJob[];
  hits?: number;
}

export async function fetchAmazonJobs(company: CompanyConfig): Promise<JobRecord[]> {
  const jobs: JobRecord[] = [];
  const keywords = ['designer', 'ux', 'user experience', 'design systems'];

  for (const kw of keywords) {
    try {
      const url =
        `https://www.amazon.jobs/en/search.json` +
        `?base_query=${encodeURIComponent(kw)}` +
        `&normalized_country_code%5B%5D=USA` +
        `&result_limit=100` +
        `&job_type=Full-Time`;

      const data = await withRetry(async () => {
        const res = await fetch(url, {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/json',
            'Referer': 'https://www.amazon.jobs/',
          },
        });
        if (!res.ok) throw new Error(`Amazon Jobs API ${res.status}`);
        return res.json() as Promise<AmazonResponse>;
      }, 2, 3000);

      for (const job of (data.jobs ?? [])) {
        if (!matchesDesignKeyword(job.title)) continue;

        const text = stripHtml([
          job.description ?? '',
          job.basic_qualifications ?? '',
          job.preferred_qualifications ?? '',
        ].join(' '));

        const jobUrl = job.job_path
          ? `https://www.amazon.jobs${job.job_path}`
          : `https://www.amazon.jobs/en/jobs/${job.id_icims}`;

        // Build salary string if available
        let salary: string | null = null;
        if (job.salary_min && job.salary_max) {
          const fmt = (n: number) => `$${Math.round(n / 1000)}K`;
          salary = `${fmt(job.salary_min)}–${fmt(job.salary_max)}`;
        } else {
          salary = extractSalary(text);
        }

        jobs.push({
          id: generateId(company.name, job.title, job.location, jobUrl),
          company: company.name,
          companySlug: company.slug,
          title: job.title,
          location: job.location ?? '',
          experience: extractExperience(text),
          salary,
          postedAt: job.posted_date ? new Date(job.posted_date).toISOString() : null,
          postedText: null,
          url: jobUrl,
          source: 'amazon_api',
        });
      }

      await politeDelay(800, 1500);
    } catch (err) {
      console.warn(`  Amazon API error for "${kw}":`, err instanceof Error ? err.message : err);
    }
  }

  // Dedup within company
  const seen = new Set<string>();
  const unique = jobs.filter((j) => {
    if (seen.has(j.id)) return false;
    seen.add(j.id);
    return true;
  });

  console.log(`  ✓ ${company.name}: ${unique.length} design jobs (Amazon API)`);
  return unique;
}
