import { useAuth } from "@/provider/auth-context";
import type { Workspace } from "@/types";

export type WorkspaceRole = "admin" | "member" | "viewer" | "owner" | null;

const getMemberUserId = (user: unknown): string | null => {
  if (typeof user === "string") return user;
  if (user && typeof user === "object" && "_id" in user) {
    return (user as { _id: string })._id;
  }
  return null;
};

export const useWorkspaceRole = (workspace: Workspace | undefined) => {
  const { user } = useAuth();

  const role: WorkspaceRole =
    (workspace?.members.find((m) => getMemberUserId(m.user) === user?._id)
      ?.role as WorkspaceRole) ?? null;

  const canCreateProject = role !== null && role !== "viewer";
  const canInvite = role === "admin" || role === "owner";

  return { role, canCreateProject, canInvite };
};
