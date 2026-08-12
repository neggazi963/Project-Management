import { useEffect } from "react";
import { useSocket } from "@/provider/socket-context";

export const useRoom = (room: string | null | undefined) => {
  const { socket, joinRoom, leaveRoom } = useSocket();

  useEffect(() => {
    if (!room || !socket) return;

    // Fonction pour rejoindre la room
    const handleJoin = () => {
      
      joinRoom(room);
    };

    // 1. Si la socket est DEJA connectée, on rejoint immédiatement
    if (socket.connected) {
      handleJoin();
    }

    // 2. Si la socket se connecte ou SE RECONNECTE après coup, on rejoint à nouveau
    socket.on("connect", handleJoin);

    // Nettoyage au démontage
    return () => {
      socket.off("connect", handleJoin);
      if (socket.connected) {
        
        leaveRoom(room);
      }
    };
  }, [room, socket, joinRoom, leaveRoom]);
};
