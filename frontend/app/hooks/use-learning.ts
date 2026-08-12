import { fetchData, postData, updateData, deleteData } from "@/lib/fetch-util";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Domains
export const useGetDomainsQuery = () =>
  useQuery({
    queryKey: ["learning-domains"],
    queryFn: () => fetchData("/learning/domains"),
  });

export const useGetDomainBySlugQuery = (slug: string) =>
  useQuery({
    queryKey: ["learning-domain", slug],
    queryFn: () => fetchData(`/learning/domains/${slug}`),
    enabled: !!slug,
  });

export const useCreateDomainMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; icon?: string }) =>
      postData("/learning/domains", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["learning-domains"] }),
  });
};

// Paths
export const useGetPathQuery = (pathId: string) =>
  useQuery({
    queryKey: ["learning-path", pathId],
    queryFn: () => fetchData(`/learning/paths/${pathId}`),
    enabled: !!pathId,
  });

export const useGetMyPathsQuery = () =>
  useQuery({
    queryKey: ["my-learning-paths"],
    queryFn: () => fetchData("/learning/paths/my-paths"),
  });

export const useCreatePathMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      domainId: string;
      title: string;
      description?: string;
      difficulty: string;
      tags?: string[];
    }) => postData("/learning/paths", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["my-learning-paths"] }),
  });
};

export const useUpdatePathMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { pathId: string; [key: string]: any }) => {
      const { pathId, ...body } = data;
      return updateData(`/learning/paths/${pathId}`, body);
    },
    onSuccess: (_d, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["learning-path", variables.pathId],
      });
      queryClient.invalidateQueries({
        queryKey: ["learning-path-edit", variables.pathId],
      });
    },
  });
};

export const useDeletePathMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pathId: string) => deleteData(`/learning/paths/${pathId}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["my-learning-paths"] }),
  });
};

// Notes
export const useGetNoteQuery = (noteId: string) =>
  useQuery({
    queryKey: ["learning-note", noteId],
    queryFn: () => fetchData(`/learning/notes/${noteId}`),
    enabled: !!noteId,
  });

export const useCreateNoteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      pathId: string;
      title: string;
      content: string;
      relatedNotes?: string[];
    }) =>
      postData(`/learning/paths/${data.pathId}/notes`, {
        title: data.title,
        content: data.content,
        relatedNotes: data.relatedNotes,
      }),
    onSuccess: (_d, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["learning-path", variables.pathId],
      });
      queryClient.invalidateQueries({
        queryKey: ["learning-path-edit", variables.pathId],
      });
    },
  });
};

export const useUpdateNoteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      noteId: string;
      pathId: string;
      [key: string]: any;
    }) => {
      const { noteId, pathId, ...body } = data;
      return updateData(`/learning/notes/${noteId}`, body);
    },
    onSuccess: (_d, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["learning-note", variables.noteId],
      });
      queryClient.invalidateQueries({
        queryKey: ["learning-path", variables.pathId],
      });
      queryClient.invalidateQueries({
        queryKey: ["learning-path-edit", variables.pathId],
      });
    },
  });
};

// Progression
export const useEnrollMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pathId: string) =>
      postData(`/learning/paths/${pathId}/enroll`, {}),
    onSuccess: (_d, pathId) =>
      queryClient.invalidateQueries({ queryKey: ["learning-path", pathId] }),
  });
};

export const useMarkNoteCompleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { pathId: string; noteId: string }) =>
      postData(
        `/learning/paths/${data.pathId}/notes/${data.noteId}/complete`,
        {},
      ),
    onSuccess: (_d, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["learning-path", variables.pathId],
      }),
  });
};

export const useGetMyProgressQuery = () =>
  useQuery({
    queryKey: ["my-learning-progress"],
    queryFn: () => fetchData("/learning/my-progress"),
  });

// Rating
export const useRateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      targetType: "path" | "note";
      targetId: string;
      stars: number;
    }) =>
      postData(`/learning/rate/${data.targetType}/${data.targetId}`, {
        stars: data.stars,
      }),
    onSuccess: (_d, variables) => {
      if (variables.targetType === "path") {
        queryClient.invalidateQueries({
          queryKey: ["learning-path", variables.targetId],
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: ["learning-note", variables.targetId],
        });
      }
    },
  });
};

export const useGetMyRatingQuery = (
  targetType: "path" | "note",
  targetId: string,
) =>
  useQuery({
    queryKey: ["my-rating", targetType, targetId],
    queryFn: () => fetchData(`/learning/rate/${targetType}/${targetId}/mine`),
    enabled: !!targetId,
  });

// Découverte
export const useDiscoverPathsQuery = (params: {
  sort?: string;
  domain?: string;
  difficulty?: string;
  search?: string;
}) =>
  useQuery({
    queryKey: ["discover-paths", params],
    queryFn: () => {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
      );
      const qs = new URLSearchParams(cleanParams).toString();
      return fetchData(`/learning/discover?${qs}`);
    },
  });

export const useGetPathForEditingQuery = (pathId: string) =>
  useQuery({
    queryKey: ["learning-path-edit", pathId],
    queryFn: () => fetchData(`/learning/paths/${pathId}/edit`),
    enabled: !!pathId && pathId !== "new",
  });

export const useDeleteNoteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { noteId: string; pathId: string }) =>
      deleteData(`/learning/notes/${data.noteId}`),
    onSuccess: (_d, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["learning-path-edit", variables.pathId],
      }),
  });
};

export const useReorderNotesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { pathId: string; noteIds: string[] }) =>
      updateData(`/learning/paths/${data.pathId}/reorder-notes`, {
        noteIds: data.noteIds,
      }),
    onSuccess: (_d, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["learning-path-edit", variables.pathId],
      }),
  });
};

export const useCheckSimilarDomainsQuery = (name: string) =>
  useQuery({
    queryKey: ["similar-domains", name],
    queryFn: () =>
      fetchData(
        `/learning/domains/check-similar?name=${encodeURIComponent(name)}`,
      ),
    enabled: name.trim().length >= 2,
  });

export const useReportContentMutation = () =>
  useMutation({
    mutationFn: (data: {
      targetType: "path" | "note" | "domain";
      targetId: string;
      reason: string;
      details?: string;
    }) =>
      postData(`/learning/report/${data.targetType}/${data.targetId}`, {
        reason: data.reason,
        details: data.details,
      }),
  });

// Reputation
export const useGetReputationQuery = (userId: string) =>
  useQuery({
    queryKey: ["learning-reputation", userId],
    queryFn: () => fetchData(`/learning/reputation/${userId}`),
    enabled: !!userId,
  });

export const useGetLeaderboardQuery = () =>
  useQuery({
    queryKey: ["learning-leaderboard"],
    queryFn: () => fetchData("/learning/leaderboard"),
  });

// Graph
export const useGetPathGraphQuery = (pathId: string) =>
  useQuery({
    queryKey: ["learning-path-graph", pathId],
    queryFn: () => fetchData(`/learning/paths/${pathId}/graph`),
    enabled: !!pathId,
  });

export const useGetDomainGraphQuery = (slug: string) =>
  useQuery({
    queryKey: ["learning-domain-graph", slug],
    queryFn: () => fetchData(`/learning/domains/${slug}/graph`),
    enabled: !!slug,
  });

export const useGetDomainRoadmapQuery = (slug: string) =>
  useQuery({
    queryKey: ["learning-domain-roadmap", slug],
    queryFn: () => fetchData(`/learning/domains/${slug}/roadmap`),
    enabled: !!slug,
  });

export const useGetSuggestedNextPathsQuery = (
  pathId: string,
  enabled: boolean,
) =>
  useQuery({
    queryKey: ["learning-next-paths", pathId],
    queryFn: () => fetchData(`/learning/paths/${pathId}/next`),
    enabled: !!pathId && enabled,
  });

export const useGetDomainNotesForLinkingQuery = (domainId: string) =>
  useQuery({
    queryKey: ["domain-notes-for-linking", domainId],
    queryFn: () => fetchData(`/learning/domains/${domainId}/notes-for-linking`),
    enabled: !!domainId,
  });

// Moderation
export const useGetReportsQuery = (status: string = "open") =>
  useQuery({
    queryKey: ["moderation-reports", status],
    queryFn: () => fetchData(`/learning/moderation/reports?status=${status}`),
  });

export const useUpdateReportStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { reportId: string; status: string }) =>
      updateData(`/learning/moderation/reports/${data.reportId}`, {
        status: data.status,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["moderation-reports"] }),
  });
};

export const useModerateUnpublishMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { targetType: "path" | "note"; targetId: string }) =>
      updateData(
        `/learning/moderation/unpublish/${data.targetType}/${data.targetId}`,
        {},
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["moderation-reports"] }),
  });
};

export const useModerateDeleteDomainMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (domainId: string) =>
      deleteData(`/learning/moderation/domains/${domainId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation-reports"] });
      queryClient.invalidateQueries({ queryKey: ["learning-domains"] });
    },
  });
};
export const useModerateDeleteContentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { targetType: "path" | "note"; targetId: string }) =>
      deleteData(
        `/learning/moderation/content/${data.targetType}/${data.targetId}`,
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["moderation-reports"] }),
  });
};
export const useModerateBanUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      updateData(`/learning/moderation/ban/${userId}`, {}),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["moderation-reports"] }),
  });
};

export const useModerateUnbanUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      updateData(`/learning/moderation/unban/${userId}`, {}),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["moderation-reports"] }),
  });
};
export const useGetDomainsQueryForSelect = useGetDomainsQuery; // alias explicite, même hook
