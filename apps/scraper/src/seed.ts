/**
 * Seed script — generates realistic sample jobs.json for local development.
 * Run: pnpm seed
 * This lets the web app display data without running the real scraper.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { generateId } from './utils/extract';

const ROOT = join(__dirname, '../../..');
const OUTPUT_DIR =
  process.env.OUTPUT_DIR ?? join(ROOT, 'apps', 'web', 'public', 'data');

const sampleJobs = [
  {
    company: 'Airbnb',
    companySlug: 'airbnb',
    title: 'Senior Product Designer',
    location: 'San Francisco, CA / Remote',
    experience: '5–8 yrs',
    salary: '$160K–$200K',
    postedAt: daysAgo(2),
    portalUrl: 'https://careers.airbnb.com',
  },
  {
    company: 'Airbnb',
    companySlug: 'airbnb',
    title: 'Design Systems Engineer',
    location: 'Remote',
    experience: '3–6 yrs',
    salary: '$150K–$185K',
    postedAt: daysAgo(5),
    portalUrl: 'https://careers.airbnb.com',
  },
  {
    company: 'Netflix',
    companySlug: 'netflix',
    title: 'UX Researcher',
    location: 'Los Angeles, CA',
    experience: '4–7 yrs',
    salary: '$170K–$220K',
    postedAt: daysAgo(1),
    portalUrl: 'https://jobs.netflix.com',
  },
  {
    company: 'Netflix',
    companySlug: 'netflix',
    title: 'Senior UX Designer — Payments',
    location: 'Remote',
    experience: '5+ yrs',
    salary: '$180K–$230K',
    postedAt: daysAgo(3),
    portalUrl: 'https://jobs.netflix.com',
  },
  {
    company: 'Figma',
    companySlug: 'figma',
    title: 'Product Designer — Editor',
    location: 'San Francisco, CA',
    experience: '3–5 yrs',
    salary: '$140K–$175K',
    postedAt: daysAgo(4),
    portalUrl: 'https://www.figma.com/careers',
  },
  {
    company: 'Figma',
    companySlug: 'figma',
    title: 'Motion Designer',
    location: 'Remote',
    experience: '2–4 yrs',
    salary: '$120K–$155K',
    postedAt: daysAgo(8),
    portalUrl: 'https://www.figma.com/careers',
  },
  {
    company: 'Stripe',
    companySlug: 'stripe',
    title: 'Product Designer — Dashboard',
    location: 'New York, NY / Hybrid',
    experience: '4–6 yrs',
    salary: '$155K–$195K',
    postedAt: daysAgo(0),
    portalUrl: 'https://stripe.com/jobs',
  },
  {
    company: 'Stripe',
    companySlug: 'stripe',
    title: 'UX Researcher — Payments',
    location: 'Remote',
    experience: '3–5 yrs',
    salary: '$145K–$180K',
    postedAt: daysAgo(6),
    portalUrl: 'https://stripe.com/jobs',
  },
  {
    company: 'Shopify',
    companySlug: 'shopify',
    title: 'Senior UX Designer',
    location: 'Remote',
    experience: '5–8 yrs',
    salary: '$130K–$165K',
    postedAt: daysAgo(2),
    portalUrl: 'https://www.shopify.com/careers',
  },
  {
    company: 'Dropbox',
    companySlug: 'dropbox',
    title: 'Interaction Designer',
    location: 'Remote',
    experience: '3–5 yrs',
    salary: '$135K–$170K',
    postedAt: daysAgo(10),
    portalUrl: 'https://jobs.dropbox.com',
  },
  {
    company: 'GitHub',
    companySlug: 'github',
    title: 'Design Systems Designer',
    location: 'Remote',
    experience: '4+ yrs',
    salary: '$145K–$185K',
    postedAt: daysAgo(7),
    portalUrl: 'https://github.com/about/careers',
  },
  {
    company: 'GitHub',
    companySlug: 'github',
    title: 'Content Designer',
    location: 'Remote',
    experience: '2–4 yrs',
    salary: '$110K–$140K',
    postedAt: daysAgo(14),
    portalUrl: 'https://github.com/about/careers',
  },
  {
    company: 'Lyft',
    companySlug: 'lyft',
    title: 'Product Designer — Driver Experience',
    location: 'San Francisco, CA / Hybrid',
    experience: '3–5 yrs',
    salary: '$130K–$160K',
    postedAt: daysAgo(3),
    portalUrl: 'https://www.lyft.com/careers',
  },
  {
    company: 'Duolingo',
    companySlug: 'duolingo',
    title: 'Visual Designer',
    location: 'Pittsburgh, PA',
    experience: '2–4 yrs',
    salary: '$100K–$130K',
    postedAt: daysAgo(5),
    portalUrl: 'https://careers.duolingo.com',
  },
  {
    company: 'Squarespace',
    companySlug: 'squarespace',
    title: 'Senior Product Designer — Templates',
    location: 'New York, NY / Hybrid',
    experience: '5+ yrs',
    salary: '$140K–$175K',
    postedAt: daysAgo(1),
    portalUrl: 'https://www.squarespace.com/about/careers',
  },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const jobs = sampleJobs.map((j, i) => ({
  id: generateId(j.company, j.title, j.location, `${j.portalUrl}/job/${i}`),
  company: j.company,
  companySlug: j.companySlug,
  title: j.title,
  location: j.location,
  experience: j.experience,
  salary: j.salary,
  postedAt: j.postedAt,
  postedText: null,
  url: `${j.portalUrl}/jobs/${i + 1000}`,
  source: 'seed',
}));

mkdirSync(OUTPUT_DIR, { recursive: true });
const outPath = join(OUTPUT_DIR, 'jobs.json');

const output = {
  generatedAt: new Date().toISOString(),
  totalJobs: jobs.length,
  jobs,
  _meta: { companiesProcessed: 10, errors: 0 },
};

writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`✓ Seed data written: ${jobs.length} jobs → ${outPath}`);
