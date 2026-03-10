/**
 * UX Jobs in US — Scraper entry point
 *
 * Usage:
 *   pnpm scrape
 *   OUTPUT_DIR=/path/to/out pnpm scrape
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fetchGreenhouseJobs } from './scrapers/greenhouse';
import { fetchLeverJobs } from './scrapers/lever';
import { fetchWorkdayJobs } from './scrapers/workday';
import { fetchAmazonJobs } from './scrapers/amazon';
import { fetchMetaJobs } from './scrapers/meta';
import { fetchGoogleJobs } from './scrapers/google';
import { fetchMicrosoftJobs } from './scrapers/microsoft';
import { scrapeWithPlaywright } from './scrapers/playwright-scraper';
import { dedup } from './utils/dedup';
import { politeDelay } from './utils/rateLimit';
import { JobRecordSchema, CompanyConfigSchema } from './schema';
import type { JobRecord, CompanyConfig } from './schema';

const ROOT = join(__dirname, '../../..');
const COMPANIES_FILE = join(ROOT, 'config', 'companies.json');
const OUTPUT_DIR =
  process.env.OUTPUT_DIR ?? join(ROOT, 'apps', 'web', 'public', 'data');

async function main() {
  console.log('=== UX Jobs in US — Scraper ===');
  console.log(`Output → ${OUTPUT_DIR}\n`);

  const raw = readFileSync(COMPANIES_FILE, 'utf-8');
  const companies: CompanyConfig[] = JSON.parse(raw).map((c: unknown) =>
    CompanyConfigSchema.parse(c)
  );
  console.log(`Loaded ${companies.length} companies from config\n`);

  const allJobs: JobRecord[] = [];
  const errors: { company: string; error: string }[] = [];

  for (const company of companies) {
    console.log(`[${companies.indexOf(company) + 1}/${companies.length}] ${company.name}`);
    try {
      let jobs: JobRecord[] = [];

      switch (company.sourceType) {
        case 'greenhouse':
          jobs = await fetchGreenhouseJobs(company);
          break;
        case 'lever':
          jobs = await fetchLeverJobs(company);
          break;
        case 'workday':
          jobs = await fetchWorkdayJobs(company);
          break;
        case 'amazon':
          jobs = await fetchAmazonJobs(company);
          break;
        case 'meta':
          jobs = await fetchMetaJobs(company);
          break;
        case 'google':
          jobs = await fetchGoogleJobs(company);
          break;
        case 'microsoft':
          jobs = await fetchMicrosoftJobs(company);
          break;
        case 'scrape':
          jobs = await scrapeWithPlaywright(company);
          break;
        case 'rss':
          console.warn(`  ⚠ RSS not implemented for ${company.name}, skipping`);
          break;
        default:
          console.warn(`  ⚠ Unknown sourceType for ${company.name}, skipping`);
      }

      const validated = jobs
        .map((j) => {
          const result = JobRecordSchema.safeParse(j);
          if (!result.success) {
            console.warn(`  Skipping invalid record:`, result.error.issues[0]);
            return null;
          }
          return result.data;
        })
        .filter((j): j is JobRecord => j !== null);

      allJobs.push(...validated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ Error: ${msg}`);
      errors.push({ company: company.name, error: msg });
    }

    await politeDelay(800, 1500);
  }

  const dedupedJobs = dedup(allJobs);
  console.log(`\nDeduplication: ${allJobs.length} → ${dedupedJobs.length} jobs`);

  dedupedJobs.sort((a, b) => {
    const ta = a.postedAt ? new Date(a.postedAt).getTime() : 0;
    const tb = b.postedAt ? new Date(b.postedAt).getTime() : 0;
    return tb - ta;
  });

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const output = {
    generatedAt: new Date().toISOString(),
    totalJobs: dedupedJobs.length,
    jobs: dedupedJobs,
    _meta: {
      companiesProcessed: companies.length,
      errors: errors.length,
      errorDetails: errors,
    },
  };

  const outPath = join(OUTPUT_DIR, 'jobs.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`\n✓ Done! ${dedupedJobs.length} jobs written to ${outPath}`);
  if (errors.length > 0) {
    console.warn(`⚠ ${errors.length} companies had errors:`);
    errors.forEach((e) => console.warn(`  - ${e.company}: ${e.error}`));
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
