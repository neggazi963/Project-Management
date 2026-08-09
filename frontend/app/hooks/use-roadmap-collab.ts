import { useEffect, useRef } from "react";
import { restoreElements } from "@excalidraw/excalidraw";
import { useSocket } from "@/provider/socket-context";
import { useAuth } from "@/provider/auth-context";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

interface CursorPayload {
  socketId: string;
  x: number;
  y: number;
  name: string;
  color: string;
}

interface SceneUpdatePayload {
  socketId: string;
  elements: readonly any[];
}

const POINTER_THROTTLE_MS = 50;
const SCENE_THROTTLE_MS = 300;

const colorFromId = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

export const useRoadmapCollab = (
  room: string | null,
  excalidrawAPI: ExcalidrawImperativeAPI | null,
) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const collaboratorsRef = useRef(new Map<string, any>());
  const lastPointerEmit = useRef(0);
  const lastSceneEmit = useRef(0);
  const applyingRemoteRef = useRef(false);
  const lastEmittedRef = useRef<string>("");

  const color = useRef(user ? colorFromId(user._id) : "#888").current;

  useEffect(() => {
    if (!socket || !room || !excalidrawAPI) return;

    const handleCursor = (payload: CursorPayload) => {
      collaboratorsRef.current.set(payload.socketId, {
        pointer: { x: payload.x, y: payload.y, tool: "pointer" },
        username: payload.name,
        color: { background: payload.color, stroke: payload.color },
      });
      (excalidrawAPI.updateScene as any)({
        collaborators: new Map(collaboratorsRef.current),
      });
    };

    const handleCursorLeave = ({ socketId }: { socketId: string }) => {
      collaboratorsRef.current.delete(socketId);
      (excalidrawAPI.updateScene as any)({
        collaborators: new Map(collaboratorsRef.current),
      });
    };

    const handleSceneUpdate = (payload: SceneUpdatePayload) => {
      applyingRemoteRef.current = true;

      const restored = restoreElements(payload.elements as any, null);
      (excalidrawAPI.updateScene as any)({ elements: restored });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          applyingRemoteRef.current = false;
        });
      });
    };

    socket.on("roadmap:cursor", handleCursor);
    socket.on("roadmap:cursor-leave", handleCursorLeave);
    socket.on("roadmap:scene-update", handleSceneUpdate);

    return () => {
      socket.off("roadmap:cursor", handleCursor);
      socket.off("roadmap:cursor-leave", handleCursorLeave);
      socket.off("roadmap:scene-update", handleSceneUpdate);
      socket.emit("roadmap:leave", { room });
      collaboratorsRef.current.clear();
    };
  }, [socket, room, excalidrawAPI]);

  const emitPointer = (x: number, y: number) => {
    if (!socket || !room || !user) return;
    const now = Date.now();
    if (now - lastPointerEmit.current < POINTER_THROTTLE_MS) return;
    lastPointerEmit.current = now;

    socket.emit("roadmap:cursor", {
      room,
      x,
      y,
      name: user.name,
      color,
    });
  };

  const emitSceneUpdate = (elements: readonly any[]) => {
    if (!socket || !room) return;
    if (applyingRemoteRef.current) return;

    const now = Date.now();
    if (now - lastSceneEmit.current < SCENE_THROTTLE_MS) return;

    const signature = elements
      .map((el: any) => `${el.id}:${el.versionNonce}`)
      .join("|");
    if (signature === lastEmittedRef.current) return;
    lastEmittedRef.current = signature;

    lastSceneEmit.current = now;
    socket.emit("roadmap:scene-update", { room, elements });
  };

  return { emitPointer, emitSceneUpdate };
};
