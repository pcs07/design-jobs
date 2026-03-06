/**
 * Microsoft Careers — public JSON search API
 * Used by careers.microsoft.com
 */
import { matchesDesignKeyword } from '../utils/keywords';
import { generateId, stripHtml, extractSalary, extractExperience } from '../utils/extract';
import { withRetry, politeDelay } from '../utils/rateLimit';
import type { JobRecord, CompanyConfig } from '../schema';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

interface MSJob {
  jobId: string;
  title: string;
  properties: {
    primaryWorkLocation?: string;
    postedDate?: string;
    employmentType?: string;
    experienceRequirements?: string;
    description?: string;
    qualifications?: string;
  };
  jobUrl?: string;
}

interface MSResponse {
  operationResult?: {
    result?: {
      jobs?: MSJob[];
      totalJobCount?: number;
    };
  };
}

export async function fetchMicrosoftJobs(company: CompanyConfig): Promise<JobRecord[]> {
  const jobs: JobRecord[] = [];
  const PAGE_SIZE = 20;
  let skip = 0;
  let total = Infinity;

  while (skip < total && skip < 100) {
    const url =
      `https://gcsservices.careers.microsoft.com/search/api/v1/search` +
      `?q=designer&lc=United+States&l=en_us&pgSz=${PAGE_SIZE}&pgNum=${Math.floor(skip / PAGE_SIZE) + 1}` +
      `&o=Relevance&flt=true`;

    try {
      const data = await withRetry(async () => {
        const res = await fetch(url, {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/json',
            'Referer': 'https://careers.microsoft.com/',
          },
        });
        if (!res.ok) throw new Error(`Microsoft API ${res.status}`);
        return res.json() as Promise<MSResponse>;
      }, 2, 3000);

      const result = data?.operationResult?.result;
      if (!result) break;

      total = result.totalJobCount ?? 0;
      const batch = result.jobs ?? [];
      if (batch.length === 0) break;

      for (const job of batch) {
        if (!matchesDesignKeyword(job.title)) continue;

        const location = job.properties?.primaryWorkLocation ?? '';
        const text = stripHtml([
          job.properties?.description ?? '',
          job.properties?.qualifications ?? '',
          job.properties?.experienceRequirements ?? '',
        ].join(' '));

        const jobUrl = job.jobUrl
          ?? `https://careers.microsoft.com/us/en/job/${job.jobId}`;

        jobs.push({
          id: generateId(company.name, job.title, location, jobUrl),
          company: company.name,
          companySlug: company.slug,
          title: job.title,
          location,
          experience: extractExperience(text),
          salary: extractSalary(text),
          postedAt: job.properties?.postedDate
            ? new Date(job.properties.postedDate).toISOString()
            : null,
          postedText: null,
          url: jobUrl,
          source: 'microsoft_api',
        });
      }

      skip += PAGE_SIZE;
      await politeDelay(800, 1500);
    } catch (err) {
      console.warn(`  Microsoft API error:`, err instanceof Error ? err.message : err);
      break;
    }
  }

  console.log(`  ✓ ${company.name}: ${jobs.length} design jobs (Microsoft API)`);
  return jobs;
}
