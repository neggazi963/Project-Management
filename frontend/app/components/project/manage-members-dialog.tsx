import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  useUpdateProjectMemberRoleMutation,
  useRemoveProjectMemberMutation,
  useAddProjectMemberMutation,
} from "@/hooks/use-project";
import { useGetWorkspaceDetailsQuery } from "@/hooks/use-workspace";
import { useAuth } from "@/provider/auth-context";
import type { Project, Workspace } from "@/types";

interface ManageMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  workspaceId: string;
}

export const ManageMembersDialog = ({
  open,
  onOpenChange,
  project,
  workspaceId,
}: ManageMembersDialogProps) => {
  const { user } = useAuth();
  const { mutate: updateRole, isPending: isUpdating } =
    useUpdateProjectMemberRoleMutation();
  const { mutate: removeMember, isPending: isRemoving } =
    useRemoveProjectMemberMutation();
  const { mutate: addMember, isPending: isAdding } =
    useAddProjectMemberMutation();

  const { data: workspace } = useGetWorkspaceDetailsQuery(workspaceId) as {
    data: Workspace | undefined;
  };

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<
    "manager" | "contributor" | "viewer"
  >("contributor");

  // On ignore tout membre dont l'utilisateur référencé n'existe plus (compte supprimé)
  const validProjectMembers = project.members.filter((m) => !!m.user);
  const validWorkspaceMembers = (workspace?.members || []).filter(
    (m) => !!m.user,
  );

  const managerCount = validProjectMembers.filter(
    (m) => m.role === "manager",
  ).length;

  const projectMemberIds = new Set(validProjectMembers.map((m) => m.user._id));
  const availableWorkspaceMembers = validWorkspaceMembers.filter(
    (m) => !projectMemberIds.has(m.user._id),
  );

  const handleRoleChange = (
    memberId: string,
    role: "manager" | "contributor" | "viewer",
  ) => {
    updateRole(
      { projectId: project._id, memberId, role },
      {
        onSuccess: () => toast.success("Role updated"),
        onError: (error: any) => {
          toast.error(error.response?.data?.message || "Failed to update role");
        },
      },
    );
  };

  const handleRemove = (memberId: string, memberName: string) => {
    const confirmed = window.confirm(`Remove ${memberName} from this project?`);
    if (!confirmed) return;

    removeMember(
      { projectId: project._id, memberId },
      {
        onSuccess: () => toast.success("Member removed"),
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to remove member",
          );
        },
      },
    );
  };

  const handleAddMember = () => {
    if (!selectedUserId) {
      toast.error("Select a member to add");
      return;
    }

    addMember(
      {
        projectId: project._id,
        userId: selectedUserId,
        role: selectedRole,
      },
      {
        onSuccess: () => {
          toast.success("Member added to project");
          setSelectedUserId("");
          setSelectedRole("contributor");
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || "Failed to add member");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage members</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-72 overflow-y-auto">
          {validProjectMembers.map((member) => {
            const isSelf = member.user._id === user?._id;
            const isLastManager =
              member.role === "manager" && managerCount <= 1;

            return (
              <div
                key={member.user._id}
                className="flex items-center gap-3 p-2 border rounded-md"
              >
                <Avatar className="size-8">
                  <AvatarImage src={member.user.profilePicture} />
                  <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.user.name} {isSelf && "(you)"}
                  </p>
                </div>

                <Select
                  value={member.role}
                  onValueChange={(role) =>
                    handleRoleChange(
                      member.user._id,
                      (role ?? "contributor") as
                        "manager" | "contributor" | "viewer",
                    )
                  }
                  disabled={isUpdating || (isSelf && isLastManager)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="contributor">Contributor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  disabled={isRemoving || isLastManager}
                  onClick={() =>
                    handleRemove(member.user._id, member.user.name)
                  }
                  title={
                    isLastManager
                      ? "Cannot remove the only manager"
                      : "Remove member"
                  }
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium">Add a workspace member</p>

          {availableWorkspaceMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All workspace members are already in this project.
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <Select
                value={selectedUserId}
                onValueChange={(value) => setSelectedUserId(value ?? "")}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {availableWorkspaceMembers.map((m) => (
                    <SelectItem key={m.user._id} value={m.user._id}>
                      {m.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedRole}
                onValueChange={(role) =>
                  setSelectedRole(
                    (role ?? "contributor") as
                      "manager" | "contributor" | "viewer",
                  )
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="contributor">Contributor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="icon"
                onClick={handleAddMember}
                disabled={isAdding || !selectedUserId}
              >
                <UserPlus className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
