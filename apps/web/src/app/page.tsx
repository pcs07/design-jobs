import { loadJobsData, loadCompaniesConfig, buildCompanyStats } from '@/lib/data';
import CompaniesGrid from '@/components/CompaniesGrid';

export default function HomePage() {
  const jobsData = loadJobsData();
  const companies = loadCompaniesConfig();
  const stats = buildCompanyStats(companies, jobsData);

  return (
    <CompaniesGrid
      companies={stats}
      totalJobs={jobsData.totalJobs}
      generatedAt={jobsData.generatedAt}
    />
  );
}
