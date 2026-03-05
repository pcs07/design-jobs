/**
 * Generic Playwright-based scraper for companies that don't offer a public API.
 *
 * Each company with sourceType: "scrape" can optionally define a custom
 * scrape function here. The default implementation visits the portalUrl,
 * looks for common job-listing patterns, and extracts what it can.
 *
 * IMPORTANT: Respect robots.txt. Only use this for companies that explicitly
 * allow scraping or have no robots.txt restriction on their careers pages.
 * Always include a polite User-Agent and rate-limit requests.
 */

import { chromium } from 'playwright';
import { matchesDesignKeyword } from '../utils/keywords';
import { generateId, extractSalary, extractExperience } from '../utils/extract';
import { politeDelay } from '../utils/rateLimit';
import type { JobRecord, CompanyConfig } from '../schema';

const USER_AGENT =
  'DesignJobsHub/1.0 (https://github.com/your-org/design-jobs; hello@example.com)';

export async function scrapeWithPlaywright(
  company: CompanyConfig
): Promise<JobRecord[]> {
  console.log(`  Scraping ${company.name} with Playwright…`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  });

  const jobs: JobRecord[] = [];

  try {
    const page = await context.newPage();
    await page.goto(company.portalUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await politeDelay(1000, 2000);

    // Generic extraction: look for links that look like job postings
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors
        .filter((a) => {
          const href = (a as HTMLAnchorElement).href;
          const text = a.textContent?.trim() ?? '';
          return (
            text.length > 5 &&
            text.length < 200 &&
            (href.includes('/job') ||
              href.includes('/position') ||
              href.includes('/careers') ||
              href.includes('/opening'))
          );
        })
        .map((a) => ({
          title: a.textContent?.trim() ?? '',
          url: (a as HTMLAnchorElement).href,
        }));
    });

    for (const link of links) {
      if (!matchesDesignKeyword(link.title)) continue;

      // Visit job page to extract details
      try {
        await politeDelay(600, 1200);
        const jobPage = await context.newPage();
        await jobPage.goto(link.url, { waitUntil: 'domcontentloaded', timeout: 20_000 });

        const details = await jobPage.evaluate(() => {
          const body = document.body.innerText;
          // Try to find a location element
          const locationEl =
            document.querySelector('[data-testid*="location"]') ??
            document.querySelector('.location') ??
            document.querySelector('[class*="location"]');
          return {
            bodyText: body,
            location: locationEl?.textContent?.trim() ?? '',
          };
        });

        await jobPage.close();

        jobs.push({
          id: generateId(company.name, link.title, details.location, link.url),
          company: company.name,
          companySlug: company.slug,
          title: link.title,
          location: details.location,
          experience: extractExperience(details.bodyText),
          salary: extractSalary(details.bodyText),
          postedAt: null,
          postedText: null,
          url: link.url,
          source: 'playwright',
        });
      } catch (err) {
        console.warn(`    Could not scrape job page: ${link.url}`, err);
      }
    }

    console.log(`  ✓ ${company.name}: ${jobs.length} design jobs (Playwright)`);
  } finally {
    await browser.close();
  }

  return jobs;
}
