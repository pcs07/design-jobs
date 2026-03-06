/**
 * Workday — public JSON API used by many large companies
 * (Adobe, Salesforce, Nike, Deloitte, McKinsey, Accenture, etc.)
 *
 * Endpoint pattern:
 *   POST https://{tenant}.wd{n}.myworkdayjobs.com/wday/cxs/{tenant}/{board}/jobs
 *   Body: { appliedFacets: {}, limit: 20, offset: 0, searchText: "designer" }
 */
import { matchesDesignKeyword } from '../utils/keywords';
import { generateId, stripHtml, extractSalary, extractExperience } from '../utils/extract';
import { withRetry, politeDelay } from '../utils/rateLimit';
import type { JobRecord, CompanyConfig } from '../schema';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

interface WorkdayJob {
  title: string;
  locationsText?: string;
  postedOn?: string;
  externalPath?: string;
  bulletFields?: string[];
  jobReqId?: string;
}

interface WorkdayResponse {
  jobPostings?: WorkdayJob[];
  total?: number;
}

// Extract the Workday endpoint from notes field, format:
// "workday:tenant:wd5:BoardName"
function parseWorkdayConfig(company: CompanyConfig): { tenant: string; wdNum: string; board: string } | null {
  if (!company.notes?.startsWith('workday:')) return null;
  const parts = company.notes.split(':');
  if (parts.length < 4) return null;
  return { tenant: parts[1], wdNum: parts[2], board: parts[3] };
}

export async function fetchWorkdayJobs(company: CompanyConfig): Promise<JobRecord[]> {
  const cfg = parseWorkdayConfig(company);
  if (!cfg) {
    console.warn(`  No Workday config for ${company.name}`);
    return [];
  }

  const baseUrl = `https://${cfg.tenant}.${cfg.wdNum}.myworkdayjobs.com/wday/cxs/${cfg.tenant}/${cfg.board}/jobs`;
  const designTerms = ['designer', 'design systems', 'ux', 'user experience', 'researcher', 'motion'];

  const jobs: JobRecord[] = [];
  const LIMIT = 20;

  for (const term of designTerms) {
    let offset = 0;
    let total = Infinity;

    while (offset < total && offset < 100) {
      try {
        const data = await withRetry(async () => {
          const res = await fetch(baseUrl, {
            method: 'POST',
            headers: {
              'User-Agent': USER_AGENT,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Referer': company.portalUrl,
            },
            body: JSON.stringify({
              appliedFacets: {},
              limit: LIMIT,
              offset,
              searchText: term,
            }),
          });
          if (!res.ok) throw new Error(`Workday API ${res.status} for ${company.name}`);
          return res.json() as Promise<WorkdayResponse>;
        }, 2, 2000);

        total = data.total ?? 0;
        const batch = data.jobPostings ?? [];
        if (batch.length === 0) break;

        for (const job of batch) {
          if (!matchesDesignKeyword(job.title)) continue;

          const location = job.locationsText ?? '';
          const description = (job.bulletFields ?? []).join(' ');
          const text = stripHtml(description);

          const jobUrl = job.externalPath
            ? `https://${cfg.tenant}.${cfg.wdNum}.myworkdayjobs.com${job.externalPath}`
            : company.portalUrl;

          jobs.push({
            id: generateId(company.name, job.title, location, jobUrl),
            company: company.name,
            companySlug: company.slug,
            title: job.title,
            location,
            experience: extractExperience(text),
            salary: extractSalary(text),
            postedAt: job.postedOn ? new Date(job.postedOn).toISOString() : null,
            postedText: null,
            url: jobUrl,
            source: 'workday',
          });
        }

        offset += LIMIT;
        await politeDelay(600, 1000);
      } catch (err) {
        console.warn(`  Workday error (${term}):`, err instanceof Error ? err.message : err);
        break;
      }
    }
  }

  // Dedup within company
  const seen = new Set<string>();
  const unique = jobs.filter((j) => {
    if (seen.has(j.id)) return false;
    seen.add(j.id);
    return true;
  });

  console.log(`  ✓ ${company.name}: ${unique.length} design jobs (Workday)`);
  return unique;
}
