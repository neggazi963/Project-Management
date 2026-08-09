import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { isAllowedOrigin } from "./cors-origins.js";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Unauthorized: no token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error("Unauthorized: user not found"));
      }

      socket.userId = user._id.toString();
      next();
    } catch (error) {
      next(new Error("Unauthorized: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(socket.userId);

    socket.on("join-room", (room) => {
      if (typeof room === "string" && room.length < 200) {
        socket.join(room);
      }
    });

    socket.on("leave-room", (room) => {
      if (typeof room === "string") {
        socket.leave(room);
      }
    });

    // --- Collaboration temps réel sur la roadmap Excalidraw ---

    // Position du curseur : relayé brut, jamais stocké en DB
    socket.on("roadmap:cursor", ({ room, x, y, name, color }) => {
      if (typeof room !== "string") return;
      socket.to(room).emit("roadmap:cursor", {
        socketId: socket.id,
        x,
        y,
        name,
        color,
      });
    });

    // Mise à jour du dessin : relayée aux autres clients de la room
    socket.on("roadmap:scene-update", ({ room, elements }) => {
      if (typeof room !== "string") return;
      socket.to(room).emit("roadmap:scene-update", {
        socketId: socket.id,
        elements,
      });
    });

    // Prévient les autres qu'un utilisateur quitte la page roadmap
    socket.on("roadmap:leave", ({ room }) => {
      if (typeof room !== "string") return;
      socket.to(room).emit("roadmap:cursor-leave", { socketId: socket.id });
    });

    // Nettoyage automatique si l'utilisateur ferme l'onglet / perd la connexion
    socket.on("disconnecting", () => {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit("roadmap:cursor-leave", { socketId: socket.id });
        }
      }
    });
  });
  return io;
};

export const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(userId.toString()).emit(event, payload);
};

// Diffuse une invalidation de cache React Query à toutes les rooms données.
// `rooms` peut être une string ou un tableau de strings.
// `queryKey` doit correspondre exactement à la queryKey React Query côté client.
export const emitInvalidate = (rooms, queryKey) => {
  if (!io) return;
  const roomList = Array.isArray(rooms) ? rooms : [rooms];

  for (const room of roomList) {
    io.to(room).emit("invalidate", { queryKey });
  }
};
