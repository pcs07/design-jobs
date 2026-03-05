import { loadJobsData } from '@/lib/data';
import JobsTable from '@/components/JobsTable';

export const metadata = {
  title: 'All Design Jobs — DesignJobsHub',
  description: 'Browse all UX, product design, design systems, and research jobs aggregated from top tech companies.',
};

export default function JobsPage() {
  const { jobs, generatedAt, totalJobs } = loadJobsData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">All Design Jobs</h1>
        <p className="text-slate-500 mt-1 text-sm">
          {totalJobs} design-related jobs across all companies
          {generatedAt && (
            <span className="ml-2 text-slate-400">
              &middot; Refreshed daily
            </span>
          )}
        </p>
      </div>
      <JobsTable jobs={jobs} generatedAt={generatedAt} />
    </div>
  );
}
