import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { isAllowedOrigin } from "./cors-origins.js";

let io;

// Présence en temps réel : room -> Map<socketId, { _id, name, profilePicture }>
// Volontairement en mémoire, jamais persisté — c'est un état éphémère de "qui est là maintenant".
const roomPresence = new Map();

const getPresenceList = (room) => {
  const presenceMap = roomPresence.get(room);
  if (!presenceMap) return [];

  // Dédoublonne par userId (si le même utilisateur a 2 onglets ouverts, il n'apparaît qu'une fois)
  const seen = new Map();
  for (const userInfo of presenceMap.values()) {
    seen.set(userInfo._id, userInfo);
  }
  return Array.from(seen.values());
};

const broadcastPresence = (room) => {
  if (!io) return;
  io.to(room).emit("presence:update", {
    room,
    users: getPresenceList(room),
  });
};

const addPresence = (socket, room) => {
  if (!roomPresence.has(room)) {
    roomPresence.set(room, new Map());
  }
  roomPresence.get(room).set(socket.id, socket.userInfo);
  broadcastPresence(room);
};

const removePresence = (socket, room) => {
  const presenceMap = roomPresence.get(room);
  if (!presenceMap) return;
  presenceMap.delete(socket.id);
  if (presenceMap.size === 0) {
    roomPresence.delete(room);
  }
  broadcastPresence(room);
};

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
      socket.userInfo = {
        _id: user._id.toString(),
        name: user.name,
        profilePicture: user.profilePicture,
      };
      next();
    } catch (error) {
      next(new Error("Unauthorized: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(socket.userId);

    // Rooms suivies en présence pour CE socket (pour un nettoyage propre à la déconnexion)
    const presenceRooms = new Set();

    socket.on("join-room", (room) => {
      if (typeof room !== "string" || room.length >= 200) return;
      socket.join(room);

      // La présence n'a de sens que pour les rooms de type "task:xxx" pour l'instant
      if (room.startsWith("task:")) {
        presenceRooms.add(room);
        addPresence(socket, room);
      }
    });

    socket.on("leave-room", (room) => {
      if (typeof room !== "string") return;
      socket.leave(room);

      if (presenceRooms.has(room)) {
        presenceRooms.delete(room);
        removePresence(socket, room);
      }
    });

    // --- Collaboration temps réel sur la roadmap Excalidraw ---

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

    socket.on("roadmap:scene-update", ({ room, elements }) => {
      if (typeof room !== "string") return;
      socket.to(room).emit("roadmap:scene-update", {
        socketId: socket.id,
        elements,
      });
    });

    socket.on("roadmap:leave", ({ room }) => {
      if (typeof room !== "string") return;
      socket.to(room).emit("roadmap:cursor-leave", { socketId: socket.id });
    });

    socket.on("disconnecting", () => {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit("roadmap:cursor-leave", { socketId: socket.id });
        }
      }
      // Nettoyage de la présence sur toutes les rooms suivies par ce socket
      for (const room of presenceRooms) {
        removePresence(socket, room);
      }
    });
  });
  return io;
};

export const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(userId.toString()).emit(event, payload);
};

export const emitInvalidate = (rooms, queryKey) => {
  if (!io) return;
  const roomList = Array.isArray(rooms) ? rooms : [rooms];

  for (const room of roomList) {
    io.to(room).emit("invalidate", { queryKey });
  }
};
