import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface NotificationPayload {
  _id: string;
  type: string;
  message: string;
  link?: string;
  sender?: { name: string; profilePicture?: string };
  createdAt: string;
}

interface InvalidatePayload {
  queryKey: unknown[];
}

interface SocketContextValue {
  socket: Socket | null;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  joinRoom: () => {},
  leaveRoom: () => {},
});

const SOCKET_URL = (
  import.meta.env.VITE_BASE_URL || "http://localhost:5000/api-v1"
).replace(/\/api-v1\/?$/, "");

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!user || !token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
    });

    // 👇 ajoute ces 2 blocs ici
    socket.on("connect", () => {
      console.log("🟢 socket connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.log("🔴 socket connect error:", err.message);
    });

    socket.on("notification", (payload: NotificationPayload) => {
      toast(payload.message, {
        description: payload.sender?.name
          ? `From ${payload.sender.name}`
          : undefined,
      });

      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    // Écoute générique : n'importe quel controller backend peut déclencher
    // une invalidation de cache en émettant emitInvalidate(room, queryKey)
    socket.on("invalidate", (payload: InvalidatePayload) => {
      console.log("🔵 invalidate received:", payload);
      if (Array.isArray(payload?.queryKey)) {
        queryClient.invalidateQueries({ queryKey: payload.queryKey });
      }
    });

    socketRef.current = socket;
    forceRender((n) => n + 1);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id]);

  const joinRoom = (room: string) => {
    socketRef.current?.emit("join-room", room);
  };

  const leaveRoom = (room: string) => {
    socketRef.current?.emit("leave-room", room);
  };

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, joinRoom, leaveRoom }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
