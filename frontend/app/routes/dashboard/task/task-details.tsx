import { BackButton } from "@/components/back-button";
import { CommentSection } from "@/components/task/comment-section";
import { SubTasksDetails } from "@/components/task/sub-task";
import { TaskActivity } from "@/components/task/task-activity";
import { TaskAssigneesSelector } from "@/components/task/task-assignees-selector";
import { TaskDescription } from "@/components/task/task-description";
import { TaskPrioritySelector } from "@/components/task/task-priority-selector";
import { TaskStatusSelector } from "@/components/task/task-status-selector";
import { TaskTitle } from "@/components/task/task-title";
import { TaskPresence } from "@/components/task/task-presence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TaskAttachments } from "@/components/task/task-attachments";
import { TaskTimeTracking } from "@/components/task/task-time-tracking";
import { useRoom } from "@/hooks/use-room";
import {
  useAchievedTaskMutation,
  useDeleteTaskMutation,
  useTaskByIdQuery,
} from "@/hooks/use-task";
import { useAuth } from "@/provider/auth-context";
import type { Project, Task } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { useProjectRole } from "@/hooks/use-project-role";

// Skeleton de chargement aligné sur la disposition de la page
const TaskDetailsSkeleton = () => {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6 animate-pulse">
      {/* Top Bar / Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-20 bg-muted rounded-md" />
          <div className="h-6 w-px bg-muted" />
          <div className="h-4 w-24 bg-muted rounded" />
          <span className="text-sm text-muted-foreground">/</span>
          <div className="h-4 w-40 bg-muted rounded" />
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex items-center gap-4">
          <div className="h-8 w-20 bg-muted rounded-md" />
          <div className="h-8 w-24 bg-muted rounded-md" />
          <div className="h-8 w-20 bg-muted rounded-md" />
        </div>
      </div>

      {/* Main Grid Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (Main Details) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border shadow-sm">
            <CardContent className="p-6 space-y-6">
              {/* Header Info Skeleton */}
              <div className="space-y-3">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-8 w-3/4 bg-muted rounded" />
              </div>

              <Separator />

              {/* Description Skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="rounded-md bg-muted/40 p-4 space-y-2">
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-5/6 bg-muted rounded" />
                </div>
              </div>

              {/* Attachments Skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-28 bg-muted rounded" />
                <div className="h-16 w-full bg-muted/40 rounded-md" />
              </div>

              {/* Time Tracking Skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-12 w-full bg-muted/40 rounded-md" />
              </div>

              <Separator />

              {/* Subtasks Skeleton */}
              <div className="space-y-3">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="space-y-2">
                  <div className="h-8 w-full bg-muted/40 rounded-md" />
                  <div className="h-8 w-full bg-muted/40 rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comment Section Skeleton */}
          <Card className="border shadow-sm">
            <CardHeader>
              <div className="h-5 w-28 bg-muted rounded" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-20 w-full bg-muted/40 rounded-md" />
              <div className="h-12 w-full bg-muted/30 rounded-md" />
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar Skeleton */}
        <div className="space-y-6 lg:sticky lg:top-6">
          {/* Attributes Panel Skeleton */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="h-5 w-24 bg-muted rounded" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-8 w-28 bg-muted rounded-md" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-8 w-24 bg-muted rounded-md" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="flex -space-x-2">
                  <div className="size-8 rounded-full bg-muted border-2 border-background" />
                  <div className="size-8 rounded-full bg-muted border-2 border-background" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Section Skeleton */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="h-5 w-20 bg-muted rounded" />
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              <div className="h-10 w-full bg-muted/40 rounded" />
              <div className="h-10 w-full bg-muted/40 rounded" />
              <div className="h-10 w-full bg-muted/40 rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const TaskDetails = () => {
  // 1. Déclarations de TOUS les Hooks en haut du composant
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTaskMutation();
  const { user } = useAuth();
  const { taskId, projectId, workspaceId } = useParams<{
    taskId: string;
    projectId: string;
    workspaceId: string;
  }>();

  useRoom(taskId ? `task:${taskId}` : null);
  const navigate = useNavigate();

  const { data, isLoading } = useTaskByIdQuery(taskId!) as {
    data: {
      task: Task;
      project: Project;
    };
    isLoading: boolean;
  };

  const { mutate: achievedTask, isPending: isAchieved } =
    useAchievedTaskMutation();

  // Appelé avec fallback sécurisé pour maintenir l'ordre des Hooks
  const { canEdit, canManage } = useProjectRole(data?.project);

  // 2. Returns conditionnels APRÈS l'exécution de tous les Hooks
  if (isLoading) {
    return <TaskDetailsSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Task not found</h2>
        <BackButton />
      </div>
    );
  }

  const { task, project } = data;

  const handleAchievedTask = () => {
    achievedTask(
      { taskId: task._id },
      {
        onSuccess: () => {
          toast.success(task.isArchived ? "Task unarchived" : "Task archived");
        },
        onError: () => {
          toast.error("Failed to update archive status");
        },
      },
    );
  };

  const handleDeleteTask = () => {
    deleteTask(
      { taskId: task._id },
      {
        onSuccess: () => {
          toast.success("Task deleted");
          navigate(`/workspaces/${workspaceId}/projects/${projectId}`);
        },
        onError: (error: any) => {
          const errorMessage =
            error.response?.data?.error || "Failed to delete task";
          toast.error(errorMessage);
        },
      },
    );
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Top Bar / Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm font-medium text-muted-foreground">
            {project?.title || "Project"}
          </span>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm font-semibold text-foreground">
            {task.title}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <TaskPresence taskId={task._id} />

          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAchievedTask}
              disabled={isAchieved}
              className="gap-2"
            >
              {task.isArchived ? (
                <>
                  <ArchiveRestore className="size-4" />
                  Unarchive
                </>
              ) : (
                <>
                  <Archive className="size-4" />
                  Archive
                </>
              )}
            </Button>
          )}
          {canManage && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteTask}
              disabled={isDeleting}
              className="gap-2"
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (Main Details & Comments) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border shadow-sm">
            <CardContent className="p-6 space-y-6">
              {/* Header Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {task.isArchived && (
                    <Badge
                      variant="outline"
                      className="border-amber-500 text-amber-500"
                    >
                      Archived
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Created{" "}
                    {formatDistanceToNow(new Date(task.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                <TaskTitle title={task.title} taskId={task._id} />
              </div>

              <Separator />

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Description
                </h3>
                <div className="rounded-md bg-muted/30 p-3">
                  <TaskDescription
                    description={task.description || ""}
                    taskId={task._id}
                  />
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <TaskAttachments
                  taskId={task._id}
                  attachments={task.attachments || []}
                  canEdit={canEdit}
                />
              </div>

              {/* Time Tracking */}
              <div className="space-y-2">
                <TaskTimeTracking
                  taskId={task._id}
                  timeEntries={task.timeEntries || []}
                  canEdit={canEdit}
                />
              </div>

              <Separator />

              {/* Subtasks */}
              <div className="space-y-2">
                <SubTasksDetails
                  subTasks={task.subtasks || []}
                  taskId={task._id}
                  canEdit={canEdit}
                />
              </div>
            </CardContent>
          </Card>

          {/* Comment Section */}
          <CommentSection
            taskId={task._id}
            members={project.members as any}
            canEdit={canEdit}
          />
        </div>

        {/* Right Sidebar (Metadata & Status Controls) */}
        <div className="space-y-6 lg:sticky lg:top-6">
          {/* Attributes Panel */}
          <Card className="border shadow-sm overflow-visible">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Attributes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 overflow-visible">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-muted-foreground">
                  Status
                </span>
                <TaskStatusSelector
                  status={task.status}
                  taskId={task._id}
                  canEdit={canEdit}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-muted-foreground">
                  Priority
                </span>
                <TaskPrioritySelector
                  priority={task.priority}
                  taskId={task._id}
                  canEdit={canEdit}
                />
              </div>

              <Separator />

              {/* Conteneur flex pour Assignees */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    Assignees
                  </span>
                  <TaskAssigneesSelector
                    task={task}
                    assignees={task.assignees}
                    projectMembers={project.members as any}
                    canEdit={canManage}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Section */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-80 overflow-y-auto px-6 pb-6">
                <TaskActivity resourceId={task._id} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
