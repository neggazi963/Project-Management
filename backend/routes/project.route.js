import authMiddleware from "../middleware/auth.middleware.js";
import { validateRequest } from "zod-express-middleware";
import { projectSchema } from "../libs/validate-schema.js";
import {
  createProject,
  getProjectDetails,
  getProjectTasks,
  deleteProject,
  getProjectRoadmap,
  updateProjectRoadmap,
  uploadProjectCover,
  setProjectCoverUrl,
  removeProjectCover,
  updateProjectCoverPosition,
  updateProject,
} from "../controllers/project.controller.js";
import { z } from "zod";
import upload from "../middleware/upload.middleware.js";

import express from "express";

const router = express.Router();

router.post(
  "/:workspaceId/create-project",
  authMiddleware,
  validateRequest({
    params: z.object({ workspaceId: z.string() }),
    body: projectSchema,
  }),
  createProject,
);

router.get(
  "/:projectId",
  authMiddleware,
  validateRequest({ params: z.object({ projectId: z.string() }) }),
  getProjectDetails,
);

router.get(
  "/:projectId/tasks",
  authMiddleware,
  validateRequest({ params: z.object({ projectId: z.string() }) }),
  getProjectTasks,
);

router.delete(
  "/:projectId",
  authMiddleware,
  validateRequest({ params: z.object({ projectId: z.string() }) }),
  deleteProject,
);

router.get(
  "/:projectId/roadmap",
  authMiddleware,
  validateRequest({ params: z.object({ projectId: z.string() }) }),
  getProjectRoadmap,
);

router.put(
  "/:projectId/roadmap",
  authMiddleware,
  validateRequest({
    params: z.object({ projectId: z.string() }),
    body: z.object({ roadmap: z.any() }),
  }),
  updateProjectRoadmap,
);

router.post(
  "/:projectId/cover/upload",
  authMiddleware,
  validateRequest({ params: z.object({ projectId: z.string() }) }),
  upload.single("file"),
  uploadProjectCover,
);

router.put(
  "/:projectId/cover",
  authMiddleware,
  validateRequest({
    params: z.object({ projectId: z.string() }),
    body: z.object({ coverImage: z.string() }),
  }),
  setProjectCoverUrl,
);

router.delete(
  "/:projectId/cover",
  authMiddleware,
  validateRequest({ params: z.object({ projectId: z.string() }) }),
  removeProjectCover,
);

router.put(
  "/:projectId/cover/position",
  authMiddleware,
  validateRequest({
    params: z.object({ projectId: z.string() }),
    body: z.object({ position: z.number() }),
  }),
  updateProjectCoverPosition,
);

router.put(
  "/:projectId",
  authMiddleware,
  validateRequest({
    params: z.object({ projectId: z.string() }),
    body: projectSchema,
  }),
  updateProject,
);

export default router;
