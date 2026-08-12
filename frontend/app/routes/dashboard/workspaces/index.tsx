import { NoDataFound } from "@/components/no-data-found";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateWorkspace } from "@/components/workspace/create-workspace";
import { WorkspaceAvatar } from "@/components/workspace/workspace-avatar";
import {
  useDeleteWorkspaceMutation,
  useGetWorkspacesQuery,
  useUpdateWorkspaceMutation,
} from "@/hooks/use-workspace";
import { useWorkspaceRole } from "@/hooks/use-workspace-role";
import type { Workspace } from "@/types";
import { Pencil, PlusCircle, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Composant Skeleton dédié pour la grille de Workspaces
const WorkspacesSkeleton = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-muted animate-pulse rounded-md" />
        <div className="h-10 w-36 bg-muted animate-pulse rounded-md" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="h-40 animate-pulse">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-muted rounded" />
                    <div className="h-3 w-20 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-4 w-8 bg-muted rounded" />
              </div>
              <div className="mt-4 h-3 w-3/4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-3 w-1/2 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const Workspaces = () => {
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(
    null,
  );

  const { data: workspaces, isPending } = useGetWorkspacesQuery() as {
    data: Workspace[] | undefined;
    isPending: boolean;
  };

  // Affichage du Skeleton pendant le chargement
  if (isPending) return <WorkspacesSkeleton />;

  const workspaceList = workspaces ?? [];

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-3xl font-bold">Workspaces</h2>
          <Button onClick={() => setIsCreatingWorkspace(true)}>
            <PlusCircle className="size-4 mr-2" />
            New Workspace
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {workspaceList.map((ws) => (
            <WorkspaceCard
              key={ws._id}
              workspace={ws}
              onEdit={(workspace) => setEditingWorkspace(workspace)}
            />
          ))}

          {workspaceList.length === 0 && (
            <NoDataFound
              title="No Workspaces found"
              description="Create a new workspace to get started."
              buttonText="Create Workspace"
              buttonAction={() => setIsCreatingWorkspace(true)}
            />
          )}
        </div>
      </div>

      <CreateWorkspace
        isCreatingWorkspace={isCreatingWorkspace}
        setIsCreatingWorkspace={setIsCreatingWorkspace}
      />

      {editingWorkspace && (
        <EditWorkspaceModal
          workspace={editingWorkspace}
          isOpen={!!editingWorkspace}
          onClose={() => setEditingWorkspace(null)}
        />
      )}
    </>
  );
};

const WorkspaceCard = ({
  workspace,
  onEdit,
}: {
  workspace: Workspace;
  onEdit: (workspace: Workspace) => void;
}) => {
  const { mutate: deleteWorkspace, isPending: isDeleting } =
    useDeleteWorkspaceMutation();

  const { role } = useWorkspaceRole(workspace);
  const canManageWorkspace = role === "admin" || role === "owner";

  const handleEditWorkspace = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(workspace);
  };

  const handleDeleteWorkspace = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `Delete "${workspace.name}"? This will delete all its projects and tasks. This action cannot be undone.`,
    );
    if (!confirmed) return;

    deleteWorkspace(
      { workspaceId: workspace._id },
      {
        onSuccess: () => {
          toast.success("Workspace deleted");
        },
        onError: (error: any) => {
          const errorMessage =
            error.response?.data?.error || "Failed to delete workspace";
          toast.error(errorMessage);
        },
      },
    );
  };

  return (
    <Card className="relative transition-all hover:shadow-md hover:-translate-y-1 group">
      {canManageWorkspace && (
        <div className="absolute top-3 right-3 flex items-center gap-1 z-20">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={handleEditWorkspace}
            title="Edit Workspace"
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit Workspace</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-destructive"
            disabled={isDeleting}
            onClick={handleDeleteWorkspace}
            title="Delete Workspace"
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Delete Workspace</span>
          </Button>
        </div>
      )}

      <Link to={`/workspaces/${workspace._id}`} className="block h-full">
        <CardHeader className="pb-2">
          <div
            className={
              canManageWorkspace
                ? "flex items-center justify-between pr-16"
                : "flex items-center justify-between"
            }
          >
            <div className="flex gap-2">
              <WorkspaceAvatar name={workspace.name} color={workspace.color} />
              <div>
                <CardTitle className="group-hover:underline">
                  {workspace.name}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  Created at{" "}
                  {format(new Date(workspace.createdAt), "MMMM dd, yyyy")}
                </span>
              </div>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Users className="size-4 mr-1" />
              <span className="text-xs">{workspace.members?.length || 0}</span>
            </div>
          </div>
          <CardDescription className="mt-2">
            {workspace.description || "No description"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            View workspace details and projects
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

const EditWorkspaceModal = ({
  workspace,
  isOpen,
  onClose,
}: {
  workspace: Workspace;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description || "");

  const { mutate: updateWorkspace, isPending } = useUpdateWorkspaceMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateWorkspace(
      {
        workspaceId: workspace._id,
        workspaceData: {
          name,
          description,
        },
      },
      {
        onSuccess: () => {
          toast.success("Workspace updated");
          onClose();
        },
        onError: (error: any) => {
          const errorMessage =
            error.response?.data?.error || "Failed to update workspace";
          toast.error(errorMessage);
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Workspaces;
