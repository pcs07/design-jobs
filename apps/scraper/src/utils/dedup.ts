import type { JobRecord } from '../schema';

export function dedup(jobs: JobRecord[]): JobRecord[] {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    const key = `${job.company}::${job.title.toLowerCase()}::${job.location.toLowerCase()}::${job.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
