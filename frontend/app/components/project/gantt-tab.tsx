import { useMemo } from "react";
import { Gantt, Willow } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/all.css";
import type { Task } from "@/types";
import { useUpdateTaskScheduleMutation } from "@/hooks/use-task";
import { toast } from "sonner";

interface GanttTabProps {
  tasks: Task[];
}

const FALLBACK_DURATION_DAYS = 3;

const scales = [
  { unit: "month", step: 1, format: "%F %Y" },
  { unit: "day", step: 1, format: "%j" },
];

// Custom grid columns without the default "add-task" (+) column
const columns = [
  { id: "text", header: "Task name", flexgrow: 3, width: 200 },
  { id: "start", header: "Start date", flexgrow: 1, align: "center" as const },
  { id: "duration", header: "Duration", align: "center" as const, flexgrow: 1 },
];

export const GanttTab = ({ tasks }: GanttTabProps) => {
  const { mutate: updateSchedule } = useUpdateTaskScheduleMutation();

  const ganttTasks = useMemo(() => {
    return tasks
      .filter((t) => t.dueDate)
      .map((t) => {
        const end = new Date(t.dueDate);
        const start = t.startDate
          ? new Date(t.startDate)
          : new Date(
              end.getTime() - FALLBACK_DURATION_DAYS * 24 * 60 * 60 * 1000,
            );

        return {
          id: t._id,
          text: t.title,
          start,
          end,
          progress:
            t.status === "Done" ? 100 : t.status === "In Progress" ? 50 : 0,
          type: "task",
        };
      });
  }, [tasks]);

  const ganttLinks = useMemo(() => {
    const links: {
      id: string;
      source: string;
      target: string;
      type: string;
    }[] = [];

    for (const t of tasks) {
      const depIds = (t.dependencies || []).map((d) =>
        typeof d === "string" ? d : d._id,
      );
      for (const depId of depIds) {
        links.push({
          id: `${depId}-${t._id}`,
          source: depId,
          target: t._id,
          type: "e2s", // end-to-start: source must finish before target starts
        });
      }
    }

    return links;
  }, [tasks]);

  const init = (api: any) => {
    api.on("update-task", (ev: { id: string; task: any }) => {
      updateSchedule(
        {
          taskId: String(ev.id),
          startDate: ev.task.start?.toISOString(),
          dueDate: ev.task.end?.toISOString(),
        },
        {
          onError: (error: any) => {
            toast.error(
              error.response?.data?.message || "Failed to update schedule",
            );
          },
        },
      );
    });
  };

  if (ganttTasks.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-12 border rounded-lg">
        No tasks with a due date yet. Set a due date on your tasks to see them
        here.
      </div>
    );
  }

  return (
    <div
      className="border rounded-lg overflow-hidden"
      style={{ height: "80vh" }}
    >
      <Willow>
        <Gantt
          tasks={ganttTasks}
          links={ganttLinks}
          scales={scales}
          columns={columns}
          init={init}
          cellWidth={45}
          cellHeight={50}
          scaleHeight={44}
        />
      </Willow>
    </div>
  );
};
