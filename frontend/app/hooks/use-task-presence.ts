import { useEffect, useState } from "react";
import { useSocket } from "@/provider/socket-context";

export interface PresenceUser {
  _id: string;
  name: string;
  profilePicture?: string;
}

export const useTaskPresence = (taskId: string) => {
  const { socket } = useSocket();
  const [viewers, setViewers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!socket || !taskId) return;

    // Harmonisation du nom de room avec le backend ("task:xxx")
    const targetRoom = taskId.startsWith("task:") ? taskId : `task:${taskId}`;

    const handlePresenceUpdate = (data: {
      room: string;
      users: PresenceUser[];
    }) => {
      if (data.room === targetRoom) {
        setViewers(data.users);
      }
    };

    socket.on("presence:update", handlePresenceUpdate);

    return () => {
      socket.off("presence:update", handlePresenceUpdate);
    };
  }, [socket, taskId]);

  return viewers;
};
