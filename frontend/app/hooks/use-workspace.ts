import type { WorkspaceForm } from "@/components/workspace/create-workspace";
import type { Workspace } from "@/types";
import { fetchData, postData, deleteData, updateData } from "@/lib/fetch-util";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/store/use-workspace-store";

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: WorkspaceForm) => postData("/workspaces", data),
    onSuccess: () => {
      // Annule et re-fetch la liste des workspaces immédiatement
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
};

// 1. Typer useQuery avec Workspace[]
export const useGetWorkspacesQuery = () => {
  return useQuery<Workspace[]>({
    queryKey: ["workspaces"],
    queryFn: async () => fetchData("/workspaces"),
  });
};

// 2. Hook personnalisé typé qui gère la sélection et la persistance
export const useCurrentWorkspace = () => {
  const { data: workspaces, isLoading, isError } = useGetWorkspacesQuery();
  const { selectedWorkspaceId, setSelectedWorkspaceId } = useWorkspaceStore();

  const currentWorkspace: Workspace | null =
    workspaces?.find((w) => w._id === selectedWorkspaceId) ||
    workspaces?.[0] ||
    null;

  return {
    currentWorkspace,
    selectedWorkspaceId: currentWorkspace?._id || null,
    setSelectedWorkspace: (workspaceId: string) =>
      setSelectedWorkspaceId(workspaceId),
    workspaces,
    isLoading,
    isError,
  };
};

export const useGetWorkspaceQuery = (workspaceId: string) => {
  return useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => fetchData(`/workspaces/${workspaceId}/projects`),
    enabled: !!workspaceId,
  });
};

export const useGetWorkspaceStatsQuery = (workspaceId: string) => {
  return useQuery({
    queryKey: ["workspace", workspaceId, "stats"],
    queryFn: async () => fetchData(`/workspaces/${workspaceId}/stats`),
    enabled: !!workspaceId,
  });
};

export const useGetWorkspaceDetailsQuery = (workspaceId: string) => {
  return useQuery({
    queryKey: ["workspace", workspaceId, "details"],
    queryFn: async () => fetchData(`/workspaces/${workspaceId}`),
    enabled: !!workspaceId,
  });
};

export const useInviteMemberMutation = () => {
  return useMutation({
    mutationFn: (data: { email: string; role: string; workspaceId: string }) =>
      postData(`/workspaces/${data.workspaceId}/invite-member`, data),
  });
};

export const useAcceptInviteByTokenMutation = () => {
  return useMutation({
    mutationFn: (token: string) =>
      postData(`/workspaces/accept-invite-token`, {
        token,
      }),
  });
};

export const useAcceptGenerateInviteMutation = () => {
  return useMutation({
    mutationFn: (data: { workspaceId: string; role?: string }) =>
      postData(
        `/workspaces/${data.workspaceId}/accept-generate-invite${
          data.role ? `?role=${data.role}` : ""
        }`,
        {},
      ),
  });
};

export const useDeleteWorkspaceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { workspaceId: string }) =>
      deleteData(`/workspaces/${data.workspaceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
};

export const useUpdateWorkspaceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      workspaceId: string;
      workspaceData: Partial<WorkspaceForm>;
    }) => updateData(`/workspaces/${data.workspaceId}`, data.workspaceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
};
