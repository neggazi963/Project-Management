import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { CalendarClock } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import type { UpcomingDeadline } from "@/types";

interface UpcomingDeadlinesProps {
  data: UpcomingDeadline[];
}

const priorityColor = {
  High: "bg-red-500 text-white",
  Medium: "bg-orange-500 text-white",
  Low: "bg-slate-500 text-white",
};

export const UpcomingDeadlines = ({ data }: UpcomingDeadlinesProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">
          Upcoming Deadlines
        </CardTitle>
        <CalendarClock className="size-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No deadlines in the next 7 days
          </p>
        ) : (
          <div className="space-y-3">
            {data.map((task) => {
              const daysLeft = differenceInCalendarDays(
                new Date(task.dueDate),
                new Date(),
              );

              return (
                <div
                  key={task._id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {task.projectTitle} ·{" "}
                      {format(new Date(task.dueDate), "MMM d")} ·{" "}
                      {daysLeft === 0
                        ? "Today"
                        : daysLeft === 1
                          ? "Tomorrow"
                          : `In ${daysLeft} days`}
                    </p>
                  </div>
                  <Badge className={priorityColor[task.priority]}>
                    {task.priority}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
