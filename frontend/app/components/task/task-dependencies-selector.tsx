import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateTaskDependenciesMutation } from "@/hooks/use-task";
import { toast } from "sonner";
import { Link2, X, ChevronDown } from "lucide-react";
import type { Task, TaskDependency } from "@/types";

interface TaskDependenciesSelectorProps {
  taskId: string;
  dependencies: (TaskDependency | string)[];
  allProjectTasks: Task[];
}

export const TaskDependenciesSelector = ({
  taskId,
  dependencies,
  allProjectTasks,
}: TaskDependenciesSelectorProps) => {
  const { mutate: updateDependencies, isPending } =
    useUpdateTaskDependenciesMutation();

  const currentIds = dependencies.map((d) =>
    typeof d === "string" ? d : d._id,
  );

  const otherTasks = allProjectTasks.filter((t) => t._id !== taskId);

  const toggleDependency = (depId: string) => {
    const newDeps = currentIds.includes(depId)
      ? currentIds.filter((id) => id !== depId)
      : [...currentIds, depId];

    updateDependencies(
      { taskId, dependencies: newDeps },
      {
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to update dependencies",
          );
        },
      },
    );
  };

  const removeDependency = (depId: string) => {
    toggleDependency(depId);
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">
        Depends on
      </h3>

      <div className="flex flex-wrap items-center gap-2">
        {dependencies.length === 0 ? (
          <span className="text-sm text-muted-foreground">No dependencies</span>
        ) : (
          dependencies.map((dep) => {
            const dep_ = typeof dep === "string" ? null : dep;
            const depId = typeof dep === "string" ? dep : dep._id;
            return (
              <Badge
                key={depId}
                variant="outline"
                className="flex items-center gap-1"
              >
                <Link2 className="size-3" />
                {dep_?.title || "Task"}
                <button
                  onClick={() => removeDependency(depId)}
                  className="ml-1 hover:text-destructive"
                  disabled={isPending}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            );
          })
        )}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" disabled={isPending}>
                Add dependency <ChevronDown className="size-3 ml-1" />
              </Button>
            }
          />

          <DropdownMenuContent className="max-h-64 overflow-y-auto w-64">
            {otherTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2 py-2">
                No other tasks in this project
              </p>
            ) : (
              otherTasks.map((t) => (
                <button
                  key={t._id}
                  onClick={() => toggleDependency(t._id)}
                  className="w-full flex items-center justify-between px-2 py-2 text-sm rounded hover:bg-muted text-left"
                >
                  <span className="truncate">{t.title}</span>
                  {currentIds.includes(t._id) && (
                    <span className="text-primary text-xs">Added</span>
                  )}
                </button>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
