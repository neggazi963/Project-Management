import express from "express";
import authRoutes from "./auth.route.js";
import workspaceRoutes from "./workspace.route.js";
import projectRoutes from "./project.route.js";
import taskRoutes from "./task.route.js";
import userRoutes from "./user.route.js";
import noteRoutes from "./Note.route.js";
import searchRoutes from "./search.route.js";
import notificationRoutes from "./Notification.route.js";
import templateRoutes from "./template.route.js";
import learningRoutes from "./learning.route.js";
const router = express.Router();

router.use("/auth", authRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/users", userRoutes);
router.use("/notes", noteRoutes);
router.use("/search", searchRoutes);
router.use("/notifications", notificationRoutes);
router.use("/", templateRoutes);
router.use("/learning", learningRoutes);

export default router;
