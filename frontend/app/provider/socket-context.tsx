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

interface SocketContextValue {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null });

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

    socket.on("notification", (payload: NotificationPayload) => {
      toast(payload.message, {
        description: payload.sender?.name
          ? `From ${payload.sender.name}`
          : undefined,
      });

      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    socketRef.current = socket;
    forceRender((n) => n + 1);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
