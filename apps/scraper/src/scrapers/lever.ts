import { matchesDesignKeyword } from '../utils/keywords';
import { generateId, stripHtml, extractSalary, extractExperience } from '../utils/extract';
import { withRetry } from '../utils/rateLimit';
import type { JobRecord, CompanyConfig } from '../schema';

const USER_AGENT =
  'DesignJobsHub/1.0 (https://github.com/your-org/design-jobs; hello@example.com)';

interface LeverPosting {
  id: string;
  text: string;
  categories: {
    location?: string;
    team?: string;
    commitment?: string;
  };
  hostedUrl: string;
  createdAt: number;
  descriptionPlain?: string;
  description?: string;
  lists?: { text: string; content: string }[];
  additional?: string;
}

export async function fetchLeverJobs(
  company: CompanyConfig
): Promise<JobRecord[]> {
  const token = company.boardToken ?? company.slug;
  const url = `https://api.lever.co/v0/postings/${token}?mode=json`;

  const postings = await withRetry(async () => {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`Lever API ${res.status} for ${company.name}: ${url}`);
    }
    return res.json() as Promise<LeverPosting[]>;
  });

  const jobs: JobRecord[] = [];

  for (const posting of postings) {
    if (!matchesDesignKeyword(posting.text)) continue;

    // Combine all text content for extraction
    const rawText = [
      posting.descriptionPlain ?? '',
      posting.description ? stripHtml(posting.description) : '',
      posting.additional ? stripHtml(posting.additional) : '',
      (posting.lists ?? []).map((l) => `${l.text}: ${l.content}`).join(' '),
    ].join(' ');

    const location = posting.categories?.location ?? '';
    const postedAt =
      posting.createdAt
        ? new Date(posting.createdAt).toISOString()
        : null;

    jobs.push({
      id: generateId(company.name, posting.text, location, posting.hostedUrl),
      company: company.name,
      companySlug: company.slug,
      title: posting.text,
      location,
      experience: extractExperience(rawText),
      salary: extractSalary(rawText),
      postedAt,
      postedText: null,
      url: posting.hostedUrl,
      source: 'lever',
    });
  }

  console.log(`  ✓ ${company.name}: ${jobs.length} design jobs (Lever)`);
  return jobs;
}
