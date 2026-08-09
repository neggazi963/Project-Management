import { useEffect } from "react";
import { useSocket } from "@/provider/socket-context";

/**
 * Rejoint une room socket tant que le composant est monté, la quitte au démontage.
 * Utilise-le dans les pages/composants qui affichent un projet ou une tâche.
 */
export const useRoom = (room: string | null | undefined) => {
  const { socket, joinRoom, leaveRoom } = useSocket();

  useEffect(() => {
    if (!room || !socket) return;
    console.log("🟡 joining room:", room);

    joinRoom(room);
    return () => {
      leaveRoom(room);
    };
  }, [room, socket]);
};
