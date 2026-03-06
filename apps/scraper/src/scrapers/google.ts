/**
 * Google Careers — unofficial JSON API used by careers.google.com
 * Paginates through results, filters by design keywords.
 */
import { matchesDesignKeyword } from '../utils/keywords';
import { generateId, stripHtml, extractSalary, extractExperience } from '../utils/extract';
import { withRetry, politeDelay } from '../utils/rateLimit';
import type { JobRecord, CompanyConfig } from '../schema';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

interface GoogleJob {
  id: string;
  title: string;
  locations: { display: string }[];
  qualifications: string;
  responsibilities: string;
  description: string;
  apply_url: string;
  date_published: string;
  company_name?: string;
}

interface GoogleSearchResponse {
  jobs: GoogleJob[];
  count: number;
  num_pages: number;
  page_size: number;
}

export async function fetchGoogleJobs(company: CompanyConfig): Promise<JobRecord[]> {
  const jobs: JobRecord[] = [];
  const keywords = ['ux designer', 'product designer', 'interaction designer',
    'visual designer', 'design systems', 'ux researcher', 'content designer',
    'motion designer', 'design operations'];

  for (const kw of keywords) {
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages && page <= 3) {
      const url = `https://careers.google.com/api/v3/search/?q=${encodeURIComponent(kw)}&location=United+States&num=20&page=${page}`;

      try {
        const data = await withRetry(async () => {
          const res = await fetch(url, {
            headers: {
              'User-Agent': USER_AGENT,
              'Accept': 'application/json',
              'Referer': 'https://careers.google.com/',
            },
          });
          if (!res.ok) throw new Error(`Google API ${res.status}`);
          return res.json() as Promise<GoogleSearchResponse>;
        }, 2, 3000);

        totalPages = data.num_pages ?? 1;

        for (const job of (data.jobs ?? [])) {
          if (!matchesDesignKeyword(job.title)) continue;
          const location = job.locations?.[0]?.display ?? '';
          const text = stripHtml([job.qualifications, job.responsibilities, job.description].join(' '));

          jobs.push({
            id: generateId(company.name, job.title, location, job.apply_url),
            company: company.name,
            companySlug: company.slug,
            title: job.title,
            location,
            experience: extractExperience(text),
            salary: extractSalary(text),
            postedAt: job.date_published ? new Date(job.date_published).toISOString() : null,
            postedText: null,
            url: job.apply_url,
            source: 'google_api',
          });
        }

        page++;
        await politeDelay(800, 1500);
      } catch (err) {
        console.warn(`  Google API error for keyword "${kw}":`, err instanceof Error ? err.message : err);
        break;
      }
    }
  }

  // Dedup within this company (same job can match multiple keywords)
  const seen = new Set<string>();
  const unique = jobs.filter((j) => {
    if (seen.has(j.id)) return false;
    seen.add(j.id);
    return true;
  });

  console.log(`  ✓ ${company.name}: ${unique.length} design jobs (Google API)`);
  return unique;
}
