import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format, isPast, isWithinInterval, addDays } from "date-fns";
import { Calendar, Flame, CalendarClock, Inbox, Trash2 } from "lucide-react";
import type { Task } from "@/types";

interface EisenhowerTabProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

const isUrgent = (task: Task) => {
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate);
  if (isPast(due)) return true;
  return isWithinInterval(due, {
    start: new Date(),
    end: addDays(new Date(), 3),
  });
};

const isImportant = (task: Task) => task.priority === "High";

const QUADRANTS = [
  {
    key: "do-first",
    title: "Do First",
    subtitle: "Urgent & Important",
    icon: Flame,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    match: (t: Task) => isUrgent(t) && isImportant(t),
  },
  {
    key: "schedule",
    title: "Schedule",
    subtitle: "Not Urgent & Important",
    icon: CalendarClock,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    match: (t: Task) => !isUrgent(t) && isImportant(t),
  },
  {
    key: "delegate",
    title: "Delegate",
    subtitle: "Urgent & Not Important",
    icon: Inbox,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    match: (t: Task) => isUrgent(t) && !isImportant(t),
  },
  {
    key: "eliminate",
    title: "Eliminate",
    subtitle: "Not Urgent & Not Important",
    icon: Trash2,
    color: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    match: (t: Task) => !isUrgent(t) && !isImportant(t),
  },
];

export const EisenhowerTab = ({ tasks, onTaskClick }: EisenhowerTabProps) => {
  const activeTasks = tasks.filter((t) => t.status !== "Done");

  if (activeTasks.length === 0) {
    return (
      <div className="text-center py-16 border rounded-lg">
        <p className="text-sm text-muted-foreground">
          No active tasks to prioritize. Completed tasks are excluded from this
          view.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Tasks are auto-sorted: <strong>Important</strong> = High priority,{" "}
        <strong>Urgent</strong> = due within 3 days or overdue. Completed tasks
        are hidden.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {QUADRANTS.map((quadrant) => {
          const quadrantTasks = activeTasks.filter(quadrant.match);
          const Icon = quadrant.icon;

          return (
            <div
              key={quadrant.key}
              className={cn("border rounded-lg p-4 space-y-3", quadrant.color)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="size-4" />
                  <div>
                    <h3 className="font-semibold text-sm">{quadrant.title}</h3>
                    <p className="text-xs opacity-70">{quadrant.subtitle}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-background">
                  {quadrantTasks.length}
                </Badge>
              </div>

              <div className="space-y-2 min-h-20">
                {quadrantTasks.length === 0 ? (
                  <p className="text-xs opacity-60 py-4 text-center">
                    Nothing here
                  </p>
                ) : (
                  quadrantTasks.map((task) => (
                    <Card
                      key={task._id}
                      onClick={() => onTaskClick(task._id)}
                      className="cursor-pointer hover:shadow-sm transition-all bg-background"
                    >
                      <CardContent className="py-3 px-3 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium line-clamp-1">
                            {task.title}
                          </p>
                          <Badge
                            className={
                              task.priority === "High"
                                ? "bg-red-500 text-white text-[10px] shrink-0"
                                : task.priority === "Medium"
                                  ? "bg-orange-500 text-white text-[10px] shrink-0"
                                  : "bg-slate-500 text-white text-[10px] shrink-0"
                            }
                          >
                            {task.priority}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          {task.assignees && task.assignees.length > 0 && (
                            <div className="flex -space-x-1.5">
                              {task.assignees.slice(0, 3).map((member) => (
                                <Avatar
                                  key={member._id}
                                  className="size-5 border border-background"
                                  title={member.name}
                                >
                                  <AvatarImage src={member.profilePicture} />
                                  <AvatarFallback className="text-[9px]">
                                    {member.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                          )}
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {format(new Date(task.dueDate), "MMM d")}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
