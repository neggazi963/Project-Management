import { fetchData } from "@/lib/fetch-util";
import { useQuery } from "@tanstack/react-query";

export const useGlobalSearchQuery = (query: string) => {
  return useQuery({
    queryKey: ["global-search", query],
    queryFn: () => fetchData(`/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length >= 2,
  });
};