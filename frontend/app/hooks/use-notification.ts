import { fetchData, updateData } from "@/lib/fetch-util";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetNotificationsQuery = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchData("/notifications"),
    refetchInterval: 60000, // fallback polling in case a socket event was missed
  });
};

export const useMarkNotificationAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { notificationId: string }) =>
      updateData(`/notifications/${data.notificationId}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkAllNotificationsAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => updateData("/notifications/read-all", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
