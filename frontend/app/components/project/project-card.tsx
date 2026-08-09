import type { Project } from "@/types";
import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { getTaskStatusColor } from "@/lib";
import { Progress } from "../ui/progress";
import { format } from "date-fns";
import { CalendarDays, Trash2 } from "lucide-react";
import { useDeleteProjectMutation } from "@/hooks/use-project";
import { useProjectRole } from "@/hooks/use-project-role"; // 👈 ajoute
import { toast } from "sonner";

interface ProjectCardProps {
  project: Project;
  progress: number;
  workspaceId: string;
}

export const ProjectCard = ({
  project,
  progress,
  workspaceId,
}: ProjectCardProps) => {
  const { mutate: deleteProject, isPending: isDeleting } =
    useDeleteProjectMutation();
  const { canManage } = useProjectRole(project); // 👈 ajoute

  const handleDeleteProject = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `Delete "${project.title}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    deleteProject(
      { projectId: project._id },
      {
        onSuccess: () => {
          toast.success("Project deleted");
        },
        onError: (error: any) => {
          const errorMessage =
            error.response?.data?.error || "Failed to delete project";
          toast.error(errorMessage);
        },
      },
    );
  };

  return (
    <Link to={`/workspaces/${workspaceId}/projects/${project._id}`}>
      <Card className="relative transition-all duration-300 hover:shadow-md hover:translate-y-1">
        {canManage && ( // 👈 masque le bouton pour non-managers
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 size-7 text-muted-foreground hover:text-destructive"
            disabled={isDeleting}
            onClick={handleDeleteProject}
            title="Delete Project"
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Delete Project</span>
          </Button>
        )}
        {project.coverImage && (
          <div className="w-full h-24 overflow-hidden rounded-t-lg -mt-6 -mx-6 mb-2">
            <img
              src={project.coverImage}
              alt={project.title}
              className="w-full h-full object-cover"
              style={{
                objectPosition: `center ${project.coverPosition ?? 50}%`,
              }}
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-center justify-between pr-8">
            <CardTitle>{project.title}</CardTitle>
            <span
              className={cn(
                "text-xs rounded-full",
                getTaskStatusColor(project.status),
              )}
            >
              {project.status}
            </span>
          </div>
          <CardDescription className="line-clamp-2">
            {project.description || "No description"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>

              <Progress value={progress} className="h-2" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm gap-2 text-muted-foreground">
                <span>{project.tasks.length}</span>
                <span>Tasks</span>
              </div>

              {project.dueDate && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <CalendarDays className="w-4 h-4" />
                  <span>{format(project.dueDate, "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
