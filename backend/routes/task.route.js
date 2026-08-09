import express from "express";

import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { taskSchema } from "../libs/validate-schema.js";
import {
  achievedTask,
  addComment,
  addSubTask,
  createTask,
  getActivityByResourceId,
  getCommentsByTaskId,
  getMyTasks,
  getTaskById,
  updateSubTask,
  updateTaskAssignees,
  updateTaskDescription,
  updateTaskPriority,
  updateTaskStatus,
  updateTaskTitle,
  watchTask,
  deleteTask,
  addAttachment,
  deleteAttachment,
  startTimer,
  stopTimer,
  addManualTimeEntry,
  deleteTimeEntry,
  updateTaskSchedule,
  updateTaskDependencies,
} from "../controllers/task.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.post(
  "/:projectId/create-task",
  authMiddleware,
  validateRequest({
    params: z.object({
      projectId: z.string(),
    }),
    body: taskSchema,
  }),
  createTask,
);

router.post(
  "/:taskId/add-subtask",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({ title: z.string() }),
  }),
  addSubTask,
);

router.post(
  "/:taskId/add-comment",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({ text: z.string() }),
  }),
  addComment,
);

router.post(
  "/:taskId/watch",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
  }),
  watchTask,
);

router.post(
  "/:taskId/achieved",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
  }),
  achievedTask,
);

router.post(
  "/:taskId/attachments",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
  }),
  upload.single("file"),
  addAttachment,
);

router.delete(
  "/:taskId/attachments/:attachmentId",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string(), attachmentId: z.string() }),
  }),
  deleteAttachment,
);

router.post(
  "/:taskId/timer/start",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
  }),
  startTimer,
);

router.post(
  "/:taskId/timer/stop",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
  }),
  stopTimer,
);

router.post(
  "/:taskId/time-entries",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({
      startTime: z.string(),
      endTime: z.string(),
    }),
  }),
  addManualTimeEntry,
);

router.delete(
  "/:taskId/time-entries/:entryId",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string(), entryId: z.string() }),
  }),
  deleteTimeEntry,
);

router.put(
  "/:taskId/update-subtask/:subTaskId",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string(), subTaskId: z.string() }),
    body: z.object({ completed: z.boolean() }),
  }),
  updateSubTask,
);

router.put(
  "/:taskId/title",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({ title: z.string() }),
  }),
  updateTaskTitle,
);

router.put(
  "/:taskId/description",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({ description: z.string() }),
  }),
  updateTaskDescription,
);

router.put(
  "/:taskId/status",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({ status: z.string() }),
  }),
  updateTaskStatus,
);

router.put(
  "/:taskId/assignees",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({ assignees: z.array(z.string()) }),
  }),
  updateTaskAssignees,
);

router.get("/my-tasks", authMiddleware, getMyTasks);

router.put(
  "/:taskId/priority",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({ priority: z.string() }),
  }),
  updateTaskPriority,
);

router.get(
  "/:taskId",
  authMiddleware,
  validateRequest({
    params: z.object({
      taskId: z.string(),
    }),
  }),
  getTaskById,
);

router.get(
  "/:resourceId/activity",
  authMiddleware,
  validateRequest({
    params: z.object({ resourceId: z.string() }),
  }),
  getActivityByResourceId,
);

router.get(
  "/:taskId/comments",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
  }),
  getCommentsByTaskId,
);

router.post(
  "/:taskId/comments", 
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({
      text: z.string(),
      mentions: z
        .array(
          z.object({
            user: z.string(),
            offset: z.number(),
            length: z.number(),
          }),
        )
        .optional(),
    }),
  }),
  addComment,
);

router.delete(
  "/:taskId",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
  }),
  deleteTask,
);
router.put(
  "/:taskId/schedule",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
    }),
  }),
  updateTaskSchedule,
);

router.put(
  "/:taskId/dependencies",
  authMiddleware,
  validateRequest({
    params: z.object({ taskId: z.string() }),
    body: z.object({ dependencies: z.array(z.string()) }),
  }),
  updateTaskDependencies,
);
export default router;
