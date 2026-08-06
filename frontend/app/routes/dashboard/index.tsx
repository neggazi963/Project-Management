import { RecentProjects } from "@/components/dashboard/recnt-projects";
import { StatsCard } from "@/components/dashboard/stat-card";
import { StatisticsCharts } from "@/components/dashboard/statistics-charts";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";
import { Loader } from "@/components/loader";

import { useGetWorkspaceStatsQuery } from "@/hooks/use-workspace";
import type {
  Project,
  ProjectStatusData,
  StatsCardProps,
  TaskPriorityData,
  TaskTrendsData,
  UpcomingDeadline,
  WorkloadData,
  WorkspaceProductivityData,
} from "@/types";
import { useSearchParams } from "react-router";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");

  const { data, isPending } = useGetWorkspaceStatsQuery(workspaceId ?? "") as {
    data:
      | {
          stats: StatsCardProps;
          taskTrendsData: TaskTrendsData[];
          projectStatusData: ProjectStatusData[];
          taskPriorityData: TaskPriorityData[];
          workspaceProductivityData: WorkspaceProductivityData[];
          workloadData: WorkloadData[];
          upcomingDeadlines: UpcomingDeadline[];
          recentProjects: Project[];
        }
      | undefined;
    isPending: boolean;
  };

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
        Please select a workspace to view its dashboard.
      </div>
    );
  }

  if (isPending || !data) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-8 2xl:space-y-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <StatsCard data={data.stats} />

      <StatisticsCharts
        taskTrendsData={data.taskTrendsData}
        projectStatusData={data.projectStatusData}
        taskPriorityData={data.taskPriorityData}
        workspaceProductivityData={data.workspaceProductivityData}
        workloadData={data.workloadData}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentProjects data={data.recentProjects} />
        <UpcomingDeadlines data={data.upcomingDeadlines} />
      </div>
    </div>
  );
};

export default Dashboard;
