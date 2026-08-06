import type {
  ProjectStatusData,
  TaskPriorityData,
  TaskTrendsData,
  WorkspaceProductivityData,
} from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { ChartBarBig, ChartLine, ChartPie } from "lucide-react";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

interface StatisticsChartsProps {
  taskTrendsData?: TaskTrendsData[];
  projectStatusData?: ProjectStatusData[];
  taskPriorityData?: TaskPriorityData[];
  workspaceProductivityData?: WorkspaceProductivityData[];
}

// 🎨 Configurations Shadcn Chart (Labels + Couleurs)
const taskTrendsConfig = {
  completed: { label: "Completed", color: "#10b981" },
  inProgress: { label: "In Progress", color: "#3b82f6" },
  todo: { label: "To Do", color: "#6b7280" },
} satisfies ChartConfig;

const projectStatusConfig = {
  Completed: { label: "Completed", color: "#10b981" },
  "In Progress": { label: "In Progress", color: "#3b82f6" },
  Planning: { label: "Planning", color: "#f59e0b" },
} satisfies ChartConfig;

const taskPriorityConfig = {
  High: { label: "High", color: "#ef4444" },
  Medium: { label: "Medium", color: "#f59e0b" },
  Low: { label: "Low", color: "#6b7280" },
} satisfies ChartConfig;

const productivityConfig = {
  total: { label: "Total Tasks", color: "#64748b" },
  completed: { label: "Completed Tasks", color: "#3b82f6" },
} satisfies ChartConfig;

// ⚙️ Style commun pour les axes
const commonAxisProps = {
  stroke: "#888888",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
};

// 🏷️ Formatage du label pour les Pie Charts
const renderPieLabel = ({
  name,
  percent,
}: {
  name?: string;
  percent?: number;
}) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`;

export const StatisticsCharts = ({
  taskTrendsData = [],
  projectStatusData = [],
  taskPriorityData = [],
  workspaceProductivityData = [],
}: StatisticsChartsProps) => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
      {/* 📈 Task Trends */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-medium">Task Trends</CardTitle>
            <CardDescription>Daily task status changes</CardDescription>
          </div>
          <ChartLine className="size-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="w-full overflow-x-auto md:overflow-x-hidden">
          <div className="min-w-87.5">
            <ChartContainer className="h-75 w-full" config={taskTrendsConfig}>
              <LineChart data={taskTrendsData}>
                <XAxis dataKey="name" {...commonAxisProps} />
                <YAxis {...commonAxisProps} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="var(--color-completed)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="inProgress"
                  stroke="var(--color-inProgress)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="todo"
                  stroke="var(--color-todo)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </LineChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* 🍕 Project Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-medium">
              Project Status
            </CardTitle>
            <CardDescription>Project status breakdown</CardDescription>
          </div>
          <ChartPie className="size-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="w-full overflow-x-auto md:overflow-x-hidden">
          <div className="min-w-87.5">
            <ChartContainer
              className="h-75 w-full"
              config={projectStatusConfig}
            >
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  label={renderPieLabel}
                  labelLine={false}
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`project-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* 🎯 Task Priority */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-medium">
              Task Priority
            </CardTitle>
            <CardDescription>Task priority breakdown</CardDescription>
          </div>
          <ChartPie className="size-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="w-full overflow-x-auto md:overflow-x-hidden">
          <div className="min-w-87.5">
            <ChartContainer className="h-75 w-full" config={taskPriorityConfig}>
              <PieChart>
                <Pie
                  data={taskPriorityData}
                  cx="50%"
                  cy="50%"
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  label={renderPieLabel}
                  labelLine={false}
                >
                  {taskPriorityData.map((entry, index) => (
                    <Cell key={`priority-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* 📊 Workspace Productivity */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-medium">
              Workspace Productivity
            </CardTitle>
            <CardDescription>Task completion by project</CardDescription>
          </div>
          <ChartBarBig className="size-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="w-full overflow-x-auto md:overflow-x-hidden">
          <div className="min-w-87.5">
            <ChartContainer className="h-75 w-full" config={productivityConfig}>
              <BarChart
                data={workspaceProductivityData}
                barGap={4}
                barSize={20}
              >
                <XAxis dataKey="name" {...commonAxisProps} />
                <YAxis {...commonAxisProps} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="total"
                  fill="var(--color-total)"
                  radius={[4, 4, 0, 0]}
                  name="Total Tasks"
                />
                <Bar
                  dataKey="completed"
                  fill="var(--color-completed)"
                  radius={[4, 4, 0, 0]}
                  name="Completed Tasks"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
