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
} from "../controllers/project.controller.js";
import { z } from "zod";

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

export default router;
