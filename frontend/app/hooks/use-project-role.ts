import { useAuth } from "@/provider/auth-context";
import type { Project } from "@/types";

export type ProjectRole = "manager" | "contributor" | "viewer" | null;

const ROLE_LEVELS: Record<Exclude<ProjectRole, null>, number> = {
  viewer: 0,
  contributor: 1,
  manager: 2,
};

export const useProjectRole = (project: Project | undefined) => {
  const { user } = useAuth();

  const role: ProjectRole =
    project?.members.find((m) => m.user && m.user._id === user?._id)?.role ??
    null;

  const hasAtLeast = (minRole: Exclude<ProjectRole, null>) => {
    if (!role) return false;
    return ROLE_LEVELS[role] >= ROLE_LEVELS[minRole];
  };

  return {
    role,
    isManager: role === "manager",
    isContributor: hasAtLeast("contributor"),
    canEdit: hasAtLeast("contributor"),
    canManage: hasAtLeast("manager"),
  };
};
