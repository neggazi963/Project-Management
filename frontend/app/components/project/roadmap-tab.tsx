import { useRef, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { Loader } from "@/components/loader";
import {
  useGetProjectRoadmapQuery,
  useUpdateProjectRoadmapMutation,
} from "@/hooks/use-project";
import { useRoadmapCollab } from "@/hooks/use-roadmap-collab";
import { toast } from "sonner";

interface RoadmapTabProps {
  projectId: string;
  canEdit?: boolean; 
}

export const RoadmapTab = ({ projectId, canEdit = false }: RoadmapTabProps) => {
  const { data, isLoading } = useGetProjectRoadmapQuery(projectId) as {
    data: { roadmap: any } | undefined;
    isLoading: boolean;
  };
  const { mutate: saveRoadmap } = useUpdateProjectRoadmapMutation();

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

  const room = `project:${projectId}`;
  const { emitPointer, emitSceneUpdate } = useRoadmapCollab(
    room,
    excalidrawAPI,
  );

  const handleChange = (elements: readonly any[], appState: any) => {
    if (!isReady) return;
    if (!canEdit) return;

    emitSceneUpdate(elements);

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
        {canEdit
          ? "Draw freely — shapes, arrows, text. Changes save automatically and sync live with anyone else viewing this roadmap."
          : "View-only mode. You don't have permission to edit this roadmap."}
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
          onPointerUpdate={(payload) => {
            emitPointer(payload.pointer.x, payload.pointer.y);
          }}
          excalidrawAPI={(api) => {
            setExcalidrawAPI(api);
            setIsReady(true);
          }}
          viewModeEnabled={!canEdit} 
        />
      </div>
    </div>
  );
};
