/**
 * Design Jobs Scraper — main entry point
 *
 * Usage:
 *   pnpm scrape                       # runs with defaults
 *   OUTPUT_DIR=/path/to/out pnpm scrape
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fetchGreenhouseJobs } from './scrapers/greenhouse';
import { fetchLeverJobs } from './scrapers/lever';
import { scrapeWithPlaywright } from './scrapers/playwright-scraper';
import { dedup } from './utils/dedup';
import { politeDelay } from './utils/rateLimit';
import { JobRecordSchema, CompanyConfigSchema } from './schema';
import type { JobRecord, CompanyConfig } from './schema';

// ── Paths ──────────────────────────────────────────────────────────────────────
const ROOT = join(__dirname, '../../..');
const COMPANIES_FILE = join(ROOT, 'config', 'companies.json');
const OUTPUT_DIR =
  process.env.OUTPUT_DIR ?? join(ROOT, 'apps', 'web', 'public', 'data');

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Design Jobs Scraper ===');
  console.log(`Output → ${OUTPUT_DIR}\n`);

  // Load and validate companies config
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
        case 'scrape':
          jobs = await scrapeWithPlaywright(company);
          break;
        case 'rss':
          console.warn(`  ⚠ RSS source not yet implemented for ${company.name}, skipping`);
          break;
        default:
          console.warn(`  ⚠ Unknown sourceType for ${company.name}, skipping`);
      }

      // Validate each job record
      const validated = jobs
        .map((j) => {
          const result = JobRecordSchema.safeParse(j);
          if (!result.success) {
            console.warn(`  Invalid job record skipped:`, result.error.issues[0]);
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

    // Polite delay between companies
    await politeDelay(1000, 2000);
  }

  // Deduplicate
  const dedupedJobs = dedup(allJobs);
  console.log(`\nDeduplication: ${allJobs.length} → ${dedupedJobs.length} jobs`);

  // Sort by postedAt descending
  dedupedJobs.sort((a, b) => {
    const ta = a.postedAt ? new Date(a.postedAt).getTime() : 0;
    const tb = b.postedAt ? new Date(b.postedAt).getTime() : 0;
    return tb - ta;
  });

  // Write output
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
    console.warn(`⚠ ${errors.length} company/ies had errors:`);
    errors.forEach((e) => console.warn(`  - ${e.company}: ${e.error}`));
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
