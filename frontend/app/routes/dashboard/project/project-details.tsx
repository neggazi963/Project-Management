import { BackButton } from "@/components/back-button";
import { CreateTaskDialog } from "@/components/task/create-task-dialog";
import { NotesTab } from "@/components/project/notes-tab";
import { RoadmapTab } from "@/components/project/roadmap-tab";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UseProjectQuery } from "@/hooks/use-project";
import { useUpdateTaskStatusMutation } from "@/hooks/use-task";
import { getProjectProgress } from "@/lib";
import { cn } from "@/lib/utils";
import type { Project, Task, TaskStatus } from "@/types";
import { EisenhowerTab } from "@/components/project/eisenhower-tab";
import { format } from "date-fns";
import { ObjectiveDialog } from "@/components/project/objective-dialog";
import { ObjectiveCard } from "@/components/project/objective-card";
import { Target } from "lucide-react";
import {
  AlertCircle,
  Calendar,
  CalendarClock,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { GanttTab } from "@/components/project/gantt-tab";
import { ProjectCover } from "@/components/project/project-cover";
import { EditProjectDialog } from "@/components/project/edit-project-dialog";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useRoom } from "@/hooks/use-room";
import { useProjectRole } from "@/hooks/use-project-role";
import { ManageMembersDialog } from "@/components/project/manage-members-dialog";
import { Users } from "lucide-react";
import { useExportProject } from "@/hooks/use-export";
import { Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SaveAsTemplateDialog } from "@/components/project/save-as-template-dialog";
import { LayoutTemplate } from "lucide-react";

// Skeleton de chargement pour la page ProjectDetails
const ProjectDetailsSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Cover Skeleton */}
      <div className="w-full h-48 bg-muted rounded-xl" />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-3">
          <div className="h-9 w-24 bg-muted rounded-md" />
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-4 w-96 bg-muted rounded" />
          <div className="flex flex-wrap gap-2 pt-4">
            <div className="h-6 w-20 bg-muted rounded-full" />
            <div className="h-6 w-32 bg-muted rounded-full" />
            <div className="h-6 w-32 bg-muted rounded-full" />
          </div>
        </div>

        {/* Action buttons Skeleton */}
        <div className="flex flex-wrap gap-2">
          <div className="h-10 w-24 bg-muted rounded-md" />
          <div className="h-10 w-24 bg-muted rounded-md" />
          <div className="h-10 w-28 bg-muted rounded-md" />
        </div>
      </div>

      {/* Objective Card Skeleton */}
      <div className="h-24 w-full bg-muted/60 rounded-xl" />

      {/* Tabs Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="h-10 w-full sm:w-96 bg-muted rounded-lg" />
        <div className="h-6 w-48 bg-muted rounded" />
      </div>

      {/* Kanban Board Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, colIndex) => (
          <div key={colIndex} className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-5 w-24 bg-muted rounded" />
              <div className="h-5 w-8 bg-muted rounded-full" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, cardIndex) => (
                <Card key={cardIndex} className="h-32 bg-muted/40 border-muted">
                  <CardHeader className="pb-2">
                    <div className="h-4 w-16 bg-muted rounded" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const STATUSES: TaskStatus[] = ["To Do", "In Progress", "Done"];

const ProjectDetails = () => {
  const { projectId, workspaceId } = useParams<{
    projectId: string;
    workspaceId: string;
  }>();
  useRoom(projectId ? `project:${projectId}` : null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isCreateTask, setIsCreateTask] = useState(false);
  const [taskFilter, setTaskFilter] = useState<TaskStatus | "All">("All");
  const [isEditProject, setIsEditProject] = useState(false);
  const [isManageMembers, setIsManageMembers] = useState(false);
  const [isSaveTemplate, setIsSaveTemplate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditObjective, setIsEditObjective] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { data, isLoading } = UseProjectQuery(projectId!) as {
    data: {
      tasks: Task[];
      project: Project;
    };
    isLoading: boolean;
  };

  const { mutate: updateTaskStatus } = useUpdateTaskStatusMutation();
  const { exportProject } = useExportProject();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const { canEdit, canManage } = useProjectRole(data?.project);

  if (isLoading || !data) return <ProjectDetailsSkeleton />;

  const { project, tasks } = data;
  const projectProgress = getProjectProgress(tasks);

  const handleExport = async (format: "csv" | "pdf") => {
    setIsExporting(true);
    try {
      await exportProject(project._id, format, project.title);
    } catch {
      toast.error("Failed to export project");
    } finally {
      setIsExporting(false);
    }
  };

  const handleTaskClick = (taskId: string) => {
    navigate(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t._id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === newStatus) return;

    updateTaskStatus(
      { taskId, status: newStatus },
      {
        onSuccess: () => {
          toast.success("Task status updated");
          queryClient.invalidateQueries({ queryKey: ["project"] });
        },
        onError: (error: any) => {
          const errorMessage =
            error.response?.data?.error || "Failed to update task status";
          toast.error(errorMessage);
        },
      },
    );
  };

  return (
    <div className="space-y-8">
      <ProjectCover
        projectId={project._id}
        coverImage={project.coverImage}
        coverPosition={project.coverPosition}
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <BackButton />
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold">{project.title}</h1>
          </div>

          {project.description && (
            <p className="text-sm text-gray-500">{project.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-10">
            {project.status && (
              <Badge
                variant="outline"
                className={cn(
                  "font-medium",
                  project.status === "Completed" &&
                    "bg-green-500/10 text-green-600 border-green-500/20",
                  project.status === "In Progress" &&
                    "bg-blue-500/10 text-blue-600 border-blue-500/20",
                  project.status === "Planning" &&
                    "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
                  project.status === "On Hold" &&
                    "bg-orange-500/10 text-orange-600 border-orange-500/20",
                  project.status === "Cancelled" &&
                    "bg-red-500/10 text-red-600 border-red-500/20",
                )}
              >
                {project.status}
              </Badge>
            )}

            {project.startDate && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1">
                <Calendar className="size-3" />
                start date :{" "}
                {format(new Date(project.startDate), "MMM d, yyyy")}
              </span>
            )}

            {project.dueDate && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1">
                <CalendarClock className="size-3" />
                due date : {format(new Date(project.dueDate), "MMM d, yyyy")}
              </span>
            )}

            {project.createdAt && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1">
                <Clock className="size-3" />
                created at :{" "}
                {format(new Date(project.createdAt), "MMM d, yyyy")}
              </span>
            )}
            {project.tags && (
              <div className="flex flex-wrap gap-2 mt-2">
                {project.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
                  >
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 min-w-32">
            <div className="text-sm text-muted-foreground">Progress:</div>
            <div className="flex-1">
              <Progress
                value={projectProgress}
                className="h-1.5 rounded-full"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {projectProgress}%
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" disabled={isExporting}>
                  <Download className="size-4 mr-2" />
                  Export
                </Button>
              }
            />
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canManage && (
            <Button variant="outline" onClick={() => setIsEditProject(true)}>
              Edit
            </Button>
          )}
          {canManage && (
            <Button variant="outline" onClick={() => setIsEditObjective(true)}>
              <Target className="size-4 mr-2" />
              Objective
            </Button>
          )}
          {canManage && (
            <Button variant="outline" onClick={() => setIsManageMembers(true)}>
              <Users className="size-4 mr-2" />
              Members
            </Button>
          )}
          {canManage && (
            <Button variant="outline" onClick={() => setIsSaveTemplate(true)}>
              <LayoutTemplate className="size-4 mr-2" />
              Save as Template
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => setIsCreateTask(true)}>Add Task</Button>
          )}
          <EditProjectDialog
            open={isEditProject}
            onOpenChange={setIsEditProject}
            project={project}
          />
          <ManageMembersDialog
            open={isManageMembers}
            onOpenChange={setIsManageMembers}
            project={project}
            workspaceId={workspaceId!}
          />
          <SaveAsTemplateDialog
            open={isSaveTemplate}
            onOpenChange={setIsSaveTemplate}
            projectId={project._id}
            defaultTitle={project.title}
          />
          <ObjectiveDialog
            open={isEditObjective}
            onOpenChange={setIsEditObjective}
            project={project}
          />
        </div>
      </div>
      <ObjectiveCard project={project} />
      <div className="flex items-center justify-between">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setTaskFilter("All")}>
                All Tasks
              </TabsTrigger>
              <TabsTrigger value="todo" onClick={() => setTaskFilter("To Do")}>
                To Do
              </TabsTrigger>
              <TabsTrigger
                value="in-progress"
                onClick={() => setTaskFilter("In Progress")}
              >
                In Progress
              </TabsTrigger>
              <TabsTrigger value="done" onClick={() => setTaskFilter("Done")}>
                Done
              </TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
              <TabsTrigger value="gantt">Gantt</TabsTrigger>
              {canManage && (
                <TabsTrigger value="eisenhower">Eisenhower</TabsTrigger>
              )}
            </TabsList>

            <div className="flex items-center text-sm">
              <span className="text-muted-foreground">Status:</span>
              <div>
                <Badge variant="outline" className="bg-background">
                  {tasks.filter((task) => task.status === "To Do").length} To Do
                </Badge>
                <Badge variant="outline" className="bg-background">
                  {tasks.filter((task) => task.status === "In Progress").length}{" "}
                  In Progress
                </Badge>
                <Badge variant="outline" className="bg-background">
                  {tasks.filter((task) => task.status === "Done").length} Done
                </Badge>
              </div>
            </div>
          </div>

          <TabsContent value="all" className="m-0">
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-3 gap-4">
                {STATUSES.map((status) => (
                  <TaskColumn
                    key={status}
                    status={status}
                    title={status}
                    tasks={tasks.filter((task) => task.status === status)}
                    onTaskClick={handleTaskClick}
                    canEdit={canEdit}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeTask ? (
                  <TaskCardContent task={activeTask} dragOverlay />
                ) : null}
              </DragOverlay>
            </DndContext>
          </TabsContent>

          <TabsContent value="todo" className="m-0">
            <div className="grid md:grid-cols-1 gap-4">
              <TaskColumn
                status="To Do"
                title="To Do"
                tasks={tasks.filter((task) => task.status === "To Do")}
                onTaskClick={handleTaskClick}
                isFullWidth
                draggable={false}
                canEdit={canEdit}
              />
            </div>
          </TabsContent>

          <TabsContent value="in-progress" className="m-0">
            <div className="grid md:grid-cols-1 gap-4">
              <TaskColumn
                status="In Progress"
                title="In Progress"
                tasks={tasks.filter((task) => task.status === "In Progress")}
                onTaskClick={handleTaskClick}
                isFullWidth
                draggable={false}
              />
            </div>
          </TabsContent>

          <TabsContent value="done" className="m-0">
            <div className="grid md:grid-cols-1 gap-4">
              <TaskColumn
                status="Done"
                title="Done"
                tasks={tasks.filter((task) => task.status === "Done")}
                onTaskClick={handleTaskClick}
                isFullWidth
                draggable={false}
              />
            </div>
          </TabsContent>

          <TabsContent value="notes" className="m-0">
            <NotesTab projectId={projectId!} canEdit={canEdit} />
          </TabsContent>

          <TabsContent value="roadmap" className="m-0">
            <RoadmapTab projectId={projectId!} canEdit={canEdit} />
          </TabsContent>
          <TabsContent value="gantt" className="m-0">
            <GanttTab tasks={tasks} />
          </TabsContent>
          {canManage && (
            <TabsContent value="eisenhower" className="m-0">
              <EisenhowerTab tasks={tasks} onTaskClick={handleTaskClick} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <CreateTaskDialog
        open={isCreateTask}
        onOpenChange={setIsCreateTask}
        projectId={projectId!}
        projectMembers={project.members as any}
      />
    </div>
  );
};

export default ProjectDetails;

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  isFullWidth?: boolean;
  draggable?: boolean;
  canEdit?: boolean;
}

const TaskColumn = ({
  status,
  title,
  tasks,
  onTaskClick,
  isFullWidth = false,
  draggable = true,
  canEdit = false,
}: TaskColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const canDrag = draggable && canEdit;

  return (
    <div
      className={
        isFullWidth
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : ""
      }
    >
      <div
        ref={canDrag ? setNodeRef : undefined}
        className={cn(
          "space-y-4 rounded-lg transition-colors",
          !isFullWidth ? "h-full" : "col-span-full mb-4",
          canDrag && isOver && "bg-muted/50 ring-2 ring-primary/30",
        )}
      >
        {!isFullWidth && (
          <div className="flex items-center justify-between">
            <h1 className="font-medium">{title}</h1>
            <Badge variant="outline">{tasks.length}</Badge>
          </div>
        )}

        <div
          className={cn(
            "space-y-3 min-h-16",
            isFullWidth && "grid grid-cols-2 lg:grid-cols-3 gap-4",
          )}
        >
          {tasks.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">
              No tasks yet
            </div>
          ) : (
            tasks.map((task) =>
              canDrag ? (
                <DraggableTaskCard
                  key={task._id}
                  task={task}
                  onClick={() => onTaskClick(task._id)}
                  canEdit={canEdit}
                />
              ) : (
                <TaskCard
                  key={task._id}
                  task={task}
                  onClick={() => onTaskClick(task._id)}
                  canEdit={canEdit}
                />
              ),
            )
          )}
        </div>
      </div>
    </div>
  );
};

const DraggableTaskCard = ({
  task,
  onClick,
  canEdit,
}: {
  task: Task;
  onClick: () => void;
  canEdit?: boolean;
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task._id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-30",
      )}
    >
      <TaskCard task={task} onClick={onClick} canEdit={canEdit} />
    </div>
  );
};

const TaskCard = ({
  task,
  onClick,
  canEdit = false,
}: {
  task: Task;
  onClick: () => void;
  canEdit?: boolean;
}) => {
  const queryClient = useQueryClient();
  const { mutate: updateTaskStatus, isPending } = useUpdateTaskStatusMutation();

  const handleStatusChange = (e: React.MouseEvent, status: TaskStatus) => {
    e.stopPropagation();

    updateTaskStatus(
      { taskId: task._id, status },
      {
        onSuccess: () => {
          toast.success("Task status updated");
          queryClient.invalidateQueries({ queryKey: ["project"] });
        },
        onError: (error: any) => {
          const errorMessage =
            error.response?.data?.error || "Failed to update task status";
          toast.error(errorMessage);
        },
      },
    );
  };

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-md transition-all duration-300 hover:translate-y-1"
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge
            className={
              task.priority === "High"
                ? "bg-red-500 text-white"
                : task.priority === "Medium"
                  ? "bg-orange-500 text-white"
                  : "bg-slate-500 text-white"
            }
          >
            {task.priority}
          </Badge>

          {canEdit && (
            <div className="flex gap-1">
              {task.status !== "To Do" && (
                <Button
                  variant={"ghost"}
                  size={"icon"}
                  className="size-6"
                  disabled={isPending}
                  onClick={(e) => handleStatusChange(e, "To Do")}
                  title="Mark as To Do"
                >
                  <AlertCircle className={cn("size-4")} />
                  <span className="sr-only">Mark as To Do</span>
                </Button>
              )}
              {task.status !== "In Progress" && (
                <Button
                  variant={"ghost"}
                  size={"icon"}
                  className="size-6"
                  disabled={isPending}
                  onClick={(e) => handleStatusChange(e, "In Progress")}
                  title="Mark as In Progress"
                >
                  <Clock className={cn("size-4")} />
                  <span className="sr-only">Mark as In Progress</span>
                </Button>
              )}
              {task.status !== "Done" && (
                <Button
                  variant={"ghost"}
                  size={"icon"}
                  className="size-6"
                  disabled={isPending}
                  onClick={(e) => handleStatusChange(e, "Done")}
                  title="Mark as Done"
                >
                  <CheckCircle className={cn("size-4")} />
                  <span className="sr-only">Mark as Done</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <TaskCardContent task={task} />
    </Card>
  );
};

const TaskCardContent = ({
  task,
  dragOverlay = false,
}: {
  task: Task;
  dragOverlay?: boolean;
}) => {
  const content = (
    <CardContent>
      <h4 className="font-medium mb-2">{task.title}</h4>

      {task.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {task.assignees && task.assignees.length > 0 && (
            <div className="flex -space-x-2">
              {task.assignees.slice(0, 5).map((member) => (
                <Avatar
                  key={member._id}
                  className="relative size-8 bg-gray-700 rounded-full border-2 border-background overflow-hidden"
                  title={member.name}
                >
                  <AvatarImage src={member.profilePicture} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}

              {task.assignees.length > 5 && (
                <span className="text-xs text-muted-foreground">
                  + {task.assignees.length - 5}
                </span>
              )}
            </div>
          )}
        </div>

        {task.dueDate && (
          <div className="text-xs text-muted-foreground flex items-center">
            <Calendar className="size-3 mr-1" />
            {format(new Date(task.dueDate), "MMM d, yyyy")}
          </div>
        )}
      </div>

      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          {task.subtasks.filter((subtask) => subtask.completed).length} /{" "}
          {task.subtasks.length} subtasks
        </div>
      )}
    </CardContent>
  );

  if (!dragOverlay) return content;

  return (
    <Card className="shadow-xl rotate-2 cursor-grabbing w-80">
      <CardHeader>
        <Badge
          className={
            task.priority === "High"
              ? "bg-red-500 text-white"
              : task.priority === "Medium"
                ? "bg-orange-500 text-white"
                : "bg-slate-500 text-white"
          }
        >
          {task.priority}
        </Badge>
      </CardHeader>
      {content}
    </Card>
  );
};
