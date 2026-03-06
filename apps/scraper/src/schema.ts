import { z } from 'zod';

export const JobRecordSchema = z.object({
  id: z.string(),
  company: z.string(),
  companySlug: z.string(),
  title: z.string(),
  location: z.string(),
  experience: z.string().nullable(),
  salary: z.string().nullable(),
  postedAt: z.string().nullable(),
  postedText: z.string().nullable(),
  url: z.string().url(),
  source: z.string(),
});

export type JobRecord = z.infer<typeof JobRecordSchema>;

export const CompanyConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  domain: z.string(),
  portalUrl: z.string().url(),
  sourceType: z.enum([
    'greenhouse',
    'lever',
    'workday',
    'scrape',
    'rss',
    'amazon',
    'meta',
  ]),
  boardToken: z.string().optional(),
  notes: z.string().optional(),
});

export type CompanyConfig = z.infer<typeof CompanyConfigSchema>;
