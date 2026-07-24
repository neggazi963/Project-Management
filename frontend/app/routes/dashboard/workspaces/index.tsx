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
} from "@/hooks/use-workspace";
import type { Workspace } from "@/types";
import { Loader, PlusCircle, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";

const Workspaces = () => {
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const { data: workspaces, isPending } = useGetWorkspacesQuery() as {
    data: Workspace[] | undefined;
    isPending: boolean;
  };

  if (isPending) return <Loader />;

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
            <WorkspaceCard key={ws._id} workspace={ws} />
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
    </>
  );
};

const WorkspaceCard = ({ workspace }: { workspace: Workspace }) => {
  const { mutate: deleteWorkspace, isPending: isDeleting } =
    useDeleteWorkspaceMutation();

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
    <Link to={`/workspaces/${workspace._id}`} className="group">
      <Card className="relative transition-all hover:shadow-md hover:-translate-y-1">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 size-7 text-muted-foreground hover:text-destructive"
          disabled={isDeleting}
          onClick={handleDeleteWorkspace}
          title="Delete Workspace"
        >
          <Trash2 className="size-4" />
          <span className="sr-only">Delete Workspace</span>
        </Button>

        <CardHeader className="pb-2">
          <div className="flex items-center justify-between pr-8">
            <div className="flex  gap-2">
              <WorkspaceAvatar name={workspace.name} color={workspace.color} />
              <div>
                <CardTitle>{workspace.name}</CardTitle>
                <span>
                  Created at{" "}
                  {format(workspace.createdAt, "MMMM dd, yyyy hh:mm a")}
                </span>
              </div>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Users className="size-4 mr-1" />
              <span className="text-xs">{workspace.members.length}</span>
            </div>
          </div>
          <CardDescription>
            {workspace.description || "No description"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            View workspace details and projects
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default Workspaces;
