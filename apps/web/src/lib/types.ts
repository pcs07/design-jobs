export interface JobRecord {
  id: string;
  company: string;
  companySlug: string;
  title: string;
  location: string;
  experience: string | null;
  salary: string | null;
  postedAt: string | null;
  postedText: string | null;
  url: string;
  source: string;
}

export interface JobsData {
  generatedAt: string | null;
  totalJobs: number;
  jobs: JobRecord[];
}

export interface CompanyConfig {
  id: string;
  name: string;
  slug: string;
  domain: string;
  portalUrl: string;
  sourceType: 'greenhouse' | 'lever' | 'scrape' | 'rss';
  boardToken?: string;
  notes?: string;
}

export interface CompanyStat {
  slug: string;
  name: string;
  domain: string;
  portalUrl: string;
  jobCount: number;
  lastUpdated: string | null;
}

export type SortOption = 'newest' | 'company_az' | 'salary_desc';
export type LocationFilter = 'all' | 'remote' | 'hybrid' | 'onsite';
export type RoleFilter =
  | 'all'
  | 'product_designer'
  | 'ux_designer'
  | 'ui_designer'
  | 'researcher'
  | 'design_systems'
  | 'motion'
  | 'content'
  | 'visual'
  | 'leadership'
  | 'other';
export type DateFilter = 'all' | '7d' | '30d' | '90d';
export type ExperienceFilter = 'all' | 'entry' | 'mid' | 'senior';
