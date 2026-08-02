import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PRIORITY_DOT: Record<string, string> = {
  High: "bg-red-500",
  Medium: "bg-orange-500",
  Low: "bg-slate-500",
};

interface TaskCalendarProps {
  tasks: Task[];
}

export const TaskCalendar = ({ tasks }: TaskCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = format(new Date(task.dueDate), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return map;
  }, [tasks]);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium">{format(currentMonth, "MMMM yyyy")}</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-xs font-medium text-muted-foreground border-b">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="p-2 text-center">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay.get(key) || [];
          const inMonth = isSameMonth(day, currentMonth);

          return (
            <div
              key={key}
              className={cn(
                "min-h-24 border-b border-r p-1.5 last:border-r-0",
                !inMonth && "bg-muted/30",
              )}
            >
              <div
                className={cn(
                  "text-xs mb-1 inline-flex items-center justify-center size-5 rounded-full",
                  isToday(day) &&
                    "bg-primary text-primary-foreground font-medium",
                  !inMonth && "text-muted-foreground",
                )}
              >
                {format(day, "d")}
              </div>

              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <Link
                    key={task._id}
                    to={`/workspaces/${task.project.workspace}/projects/${task.project._id}/tasks/${task._id}`}
                    className="flex items-center gap-1 text-xs bg-muted hover:bg-muted/70 rounded px-1.5 py-1 truncate"
                    title={task.title}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full shrink-0",
                        PRIORITY_DOT[task.priority] || "bg-slate-400",
                      )}
                    />
                    <span className="truncate">{task.title}</span>
                  </Link>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1.5">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
