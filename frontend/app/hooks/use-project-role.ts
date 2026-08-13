import { useAuth } from "@/provider/auth-context";
import type { Project } from "@/types";

export type ProjectRole = "manager" | "contributor" | "viewer" | null;

const ROLE_LEVELS: Record<Exclude<ProjectRole, null>, number> = {
  viewer: 0,
  contributor: 1,
  manager: 2,
};

const getUserId = (user: unknown): string | undefined => {
  if (!user) return undefined;
  if (typeof user === "string") return user;
  if (typeof user === "object" && "_id" in (user as any)) {
    return (user as any)._id;
  }
  return undefined;
};

export const useProjectRole = (project: Project | undefined) => {
  const { user } = useAuth();

  const role: ProjectRole =
    project?.members.find((m) => getUserId(m.user) === user?._id)?.role ?? null;

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
