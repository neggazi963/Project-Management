import type { CreateProjectFormData } from "@/components/project/create-project";
import {
  fetchData,
  postData,
  deleteData,
  updateData,
  postFormData,
} from "@/lib/fetch-util";
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

export const useUploadProjectCoverMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { projectId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", data.file);
      return postFormData(`/projects/${data.projectId}/cover/upload`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project"] });
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
    },
  });
};

export const useSetProjectCoverUrlMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { projectId: string; coverImage: string }) =>
      updateData(`/projects/${data.projectId}/cover`, {
        coverImage: data.coverImage,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project"] });
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
    },
  });
};

export const useRemoveProjectCoverMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { projectId: string }) =>
      deleteData(`/projects/${data.projectId}/cover`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project"] });
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
    },
  });
};

export const useUpdateProjectCoverPositionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      position,
    }: {
      projectId: string;
      position: number;
    }) =>
      updateData(`/projects/${projectId}/cover/position`, {
        position,
      }),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });

      queryClient.invalidateQueries({
        queryKey: ["workspace"],
      });
    },
  });
};

export const useUpdateProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      projectId: string;
      projectData: Partial<CreateProjectFormData>;
    }) => updateData(`/projects/${data.projectId}`, data.projectData),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
    },
  });
};

export const useUpdateProjectMemberRoleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      projectId: string;
      memberId: string;
      role: "manager" | "contributor" | "viewer";
    }) =>
      updateData(`/projects/${data.projectId}/members/${data.memberId}/role`, {
        role: data.role,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
    },
  });
};

export const useRemoveProjectMemberMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { projectId: string; memberId: string }) =>
      deleteData(`/projects/${data.projectId}/members/${data.memberId}`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
    },
  });
};

export const useAddProjectMemberMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      projectId: string;
      userId: string;
      role: "manager" | "contributor" | "viewer";
    }) =>
      postData(`/projects/${data.projectId}/members`, {
        userId: data.userId,
        role: data.role,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
    },
  });
};
