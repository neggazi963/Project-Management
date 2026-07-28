import type { CreateProjectFormData } from "@/components/project/create-project";
import { fetchData, postData, deleteData, updateData } from "@/lib/fetch-util";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const UseCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      projectData: CreateProjectFormData;
      workspaceId: string;
    }) =>
      postData(
        `/projects/${data.workspaceId}/create-project`,
        data.projectData,
      ),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ["workspace", data.workspace],
      });
    },
  });
};

export const UseProjectQuery = (projectId: string) => {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchData(`/projects/${projectId}/tasks`),
  });
};

export const useDeleteProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { projectId: string }) =>
      deleteData(`/projects/${data.projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
    },
  });
};

export const useGetProjectRoadmapQuery = (projectId: string) => {
  return useQuery({
    queryKey: ["project", projectId, "roadmap"],
    queryFn: () => fetchData(`/projects/${projectId}/roadmap`),
    enabled: !!projectId,
  });
};

export const useUpdateProjectRoadmapMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { projectId: string; roadmap: unknown }) =>
      updateData(`/projects/${data.projectId}/roadmap`, {
        roadmap: data.roadmap,
      }),
    onSuccess: (_data: any, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId, "roadmap"],
      });
    },
  });
};
