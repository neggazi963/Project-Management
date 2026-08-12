import { fetchData, postData, updateData, deleteData } from "@/lib/fetch-util";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetProjectNotesQuery = (projectId: string) => {
  return useQuery({
    queryKey: ["notes", projectId],
    queryFn: () => fetchData(`/notes/${projectId}`),
    enabled: !!projectId,
  });
};

export const useCreateNoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { projectId: string; title: string; content: string }) =>
      postData(`/notes/${data.projectId}`, {
        title: data.title,
        content: data.content,
      }),
    onSuccess: (_data: any, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["notes", variables.projectId],
      });
      // 🔄 Invalide le cache de la recherche globale
      queryClient.invalidateQueries({ queryKey: ["global-search"] });
    },
  });
};

export const useUpdateNoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      noteId: string;
      projectId: string;
      title?: string;
      content?: string;
    }) =>
      updateData(`/notes/note/${data.noteId}`, {
        title: data.title,
        content: data.content,
      }),
    onSuccess: (_data: any, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["notes", variables.projectId],
      });
      // 🔄 Invalide le cache de la recherche globale
      queryClient.invalidateQueries({ queryKey: ["global-search"] });
    },
  });
};

export const useDeleteNoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { noteId: string; projectId: string }) =>
      deleteData(`/notes/note/${data.noteId}`),
    onSuccess: (_data: any, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["notes", variables.projectId],
      });
      // 🔄 Invalide le cache de la recherche globale
      queryClient.invalidateQueries({ queryKey: ["global-search"] });
    },
  });
};

export const useGetMyNotesQuery = () => {
  return useQuery({
    queryKey: ["my-notes", "user"],
    queryFn: () => fetchData("/notes/my-notes"),
  });
};
