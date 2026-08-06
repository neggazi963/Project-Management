import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getMyNotifications);

router.put(
  "/:notificationId/read",
  authMiddleware,
  validateRequest({ params: z.object({ notificationId: z.string() }) }),
  markNotificationAsRead,
);

router.put("/read-all", authMiddleware, markAllNotificationsAsRead);

export default router;
