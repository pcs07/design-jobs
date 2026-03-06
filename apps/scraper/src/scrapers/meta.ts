/**
 * Meta Careers — GraphQL API used by metacareers.com
 */
import { matchesDesignKeyword } from '../utils/keywords';
import { generateId, stripHtml, extractSalary, extractExperience } from '../utils/extract';
import { withRetry, politeDelay } from '../utils/rateLimit';
import type { JobRecord, CompanyConfig } from '../schema';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

interface MetaJob {
  id: string;
  title: string;
  location?: { city?: string; state?: string; country?: string; location_type?: string };
  post_date?: string;
  description?: string;
  qualifications?: string;
  responsibilities?: string;
  job_url?: string;
}

interface MetaResponse {
  data?: {
    job_search?: {
      results?: MetaJob[];
      count?: number;
    };
  };
}

export async function fetchMetaJobs(company: CompanyConfig): Promise<JobRecord[]> {
  const jobs: JobRecord[] = [];
  const keywords = ['designer', 'ux', 'design systems', 'researcher'];

  for (const kw of keywords) {
    try {
      const payload = {
        operationName: 'CareersJobSearch',
        variables: {
          search_input: {
            q: kw,
            locations: [{ city: '', country: 'US', state: '' }],
            page: { limit: 50, offset: 0 },
          },
        },
        query: `query CareersJobSearch($search_input: JobSearchInput) {
          job_search(search_input: $search_input) {
            count
            results {
              id title post_date description qualifications responsibilities
              location { city state country location_type }
              job_url
            }
          }
        }`,
      };

      const data = await withRetry(async () => {
        const res = await fetch('https://www.metacareers.com/graphql', {
          method: 'POST',
          headers: {
            'User-Agent': USER_AGENT,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Referer': 'https://www.metacareers.com/jobs',
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Meta GraphQL ${res.status}`);
        return res.json() as Promise<MetaResponse>;
      }, 2, 3000);

      const results = data?.data?.job_search?.results ?? [];

      for (const job of results) {
        if (!matchesDesignKeyword(job.title)) continue;

        const loc = job.location;
        const locationStr = loc
          ? [loc.city, loc.state, loc.country].filter(Boolean).join(', ')
          : '';

        const text = stripHtml([
          job.description ?? '',
          job.qualifications ?? '',
          job.responsibilities ?? '',
        ].join(' '));

        const jobUrl = job.job_url ?? `https://www.metacareers.com/jobs/${job.id}`;

        jobs.push({
          id: generateId(company.name, job.title, locationStr, jobUrl),
          company: company.name,
          companySlug: company.slug,
          title: job.title,
          location: locationStr,
          experience: extractExperience(text),
          salary: extractSalary(text),
          postedAt: job.post_date ? new Date(job.post_date).toISOString() : null,
          postedText: null,
          url: jobUrl,
          source: 'meta_api',
        });
      }

      await politeDelay(800, 1500);
    } catch (err) {
      console.warn(`  Meta API error for "${kw}":`, err instanceof Error ? err.message : err);
    }
  }

  const seen = new Set<string>();
  const unique = jobs.filter((j) => {
    if (seen.has(j.id)) return false;
    seen.add(j.id);
    return true;
  });

  console.log(`  ✓ ${company.name}: ${unique.length} design jobs (Meta API)`);
  return unique;
}
