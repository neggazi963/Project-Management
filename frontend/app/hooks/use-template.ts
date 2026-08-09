import { fetchData, postData, deleteData } from "@/lib/fetch-util";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useSaveAsTemplateMutation = () => {
  return useMutation({
    mutationFn: (data: {
      projectId: string;
      title?: string;
      description?: string;
    }) =>
      postData(`/projects/${data.projectId}/save-as-template`, {
        title: data.title,
        description: data.description,
      }),
  });
};

export const useGetWorkspaceTemplatesQuery = (workspaceId: string) => {
  return useQuery({
    queryKey: ["templates", workspaceId],
    queryFn: () => fetchData(`/workspaces/${workspaceId}/templates`),
    enabled: !!workspaceId,
  });
};

export const useDeleteTemplateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { templateId: string; workspaceId: string }) =>
      deleteData(`/templates/${data.templateId}`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["templates", variables.workspaceId],
      });
    },
  });
};

export const useCreateProjectFromTemplateMutation = () => {
  return useMutation({
    mutationFn: (data: {
      workspaceId: string;
      templateId: string;
      title?: string;
      startDate?: string;
      dueDate?: string;
    }) =>
      postData(
        `/workspaces/${data.workspaceId}/templates/${data.templateId}/create-project`,
        {
          title: data.title,
          startDate: data.startDate,
          dueDate: data.dueDate,
        },
      ),
  });
};
