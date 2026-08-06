import type { StatsCardProps } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "@/lib/utils";
import {
  FolderKanban,
  ListChecks,
  Circle,
  Clock,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

interface StatEntry {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  iconClass: string;
  accent?: "warning" | "danger";
}

export const StatsCard = ({ data }: { data: StatsCardProps }) => {
  const entries: StatEntry[] = [
    {
      title: "Total Projects",
      value: data.totalProjects,
      subtitle: `${data.totalProjectInProgress} in progress`,
      icon: FolderKanban,
      iconClass: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Total Tasks",
      value: data.totalTasks,
      subtitle: `${data.totalTaskCompleted} completed`,
      icon: ListChecks,
      iconClass: "bg-violet-500/10 text-violet-600",
    },
    {
      title: "To Do",
      value: data.totalTaskToDo,
      subtitle: "Tasks waiting to be done",
      icon: Circle,
      iconClass: "bg-slate-500/10 text-slate-600",
    },
    
    {
      title: "Completion Rate",
      value: `${data.completionRate}%`,
      subtitle:
        data.avgCompletionDays !== null
          ? `~${data.avgCompletionDays}d avg. to complete`
          : "No completed tasks yet",
      icon: TrendingUp,
      iconClass: "bg-green-500/10 text-green-600",
    },
    {
      title: "Overdue",
      value: data.totalTaskOverdue,
      subtitle:
        data.totalTaskOverdue > 0 ? "Tasks past due date" : "Nothing overdue",
      icon: AlertTriangle,
      iconClass: "bg-red-500/10 text-red-600",
      accent: data.totalTaskOverdue > 0 ? "danger" : undefined,
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      {entries.map((entry) => (
        <Card
          key={entry.title}
          className={cn(
            entry.accent === "danger" && "border-red-500/30 bg-red-500/5",
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{entry.title}</CardTitle>
            <div className={cn("rounded-full p-1.5", entry.iconClass)}>
              <entry.icon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entry.value}</div>
            <p className="text-xs text-muted-foreground">{entry.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
