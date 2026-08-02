import { useRef, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { Loader } from "@/components/loader";
import {
  useGetProjectRoadmapQuery,
  useUpdateProjectRoadmapMutation,
} from "@/hooks/use-project";
import { toast } from "sonner";

interface RoadmapTabProps {
  projectId: string;
}

export const RoadmapTab = ({ projectId }: RoadmapTabProps) => {
  const { data, isLoading } = useGetProjectRoadmapQuery(projectId) as {
    data: { roadmap: any } | undefined;
    isLoading: boolean;
  };
  const { mutate: saveRoadmap } = useUpdateProjectRoadmapMutation();

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isReady, setIsReady] = useState(false);

  const handleChange = (elements: readonly any[], appState: any) => {
    // Ignore the very first onChange fired when Excalidraw mounts with
    // the initial data, so we don't immediately re-save what we just loaded.
    if (!isReady) return;

    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(() => {
      saveRoadmap(
        {
          projectId,
          roadmap: {
            elements,
            appState: {
              viewBackgroundColor: appState.viewBackgroundColor,
            },
          },
        },
        {
          onError: () => {
            toast.error("Failed to save roadmap");
          },
        },
      );
    }, 1500);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Draw freely — shapes, arrows, text. Changes save automatically.
      </p>
      <div className="h-[70vh] w-full border rounded-lg overflow-hidden">
        <Excalidraw
          initialData={{
            elements: data?.roadmap?.elements || [],
            appState: {
              viewBackgroundColor:
                data?.roadmap?.appState?.viewBackgroundColor || "#ffffff",
            },
          }}
          onChange={handleChange}
          excalidrawAPI={() => setIsReady(true)}
        />
      </div>
    </div>
  );
};
