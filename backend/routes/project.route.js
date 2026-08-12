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
  updateProjectMemberRole,
  removeProjectMember,
  addProjectMember,
  updateProjectObjective,
} from "../controllers/project.controller.js";
import {
  exportProjectCSV,
  exportProjectPDF,
} from "../controllers/export.controller.js";
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

router.post(
  "/:projectId/members",
  authMiddleware,
  validateRequest({
    params: z.object({ projectId: z.string() }),
    body: z.object({ userId: z.string(), role: z.string() }),
  }),
  addProjectMember,
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
  "/:projectId/members/:memberId/role",
  authMiddleware,
  validateRequest({
    params: z.object({ projectId: z.string(), memberId: z.string() }),
    body: z.object({ role: z.string() }),
  }),
  updateProjectMemberRole,
);
router.delete(
  "/:projectId/members/:memberId",
  authMiddleware,
  validateRequest({
    params: z.object({ projectId: z.string(), memberId: z.string() }),
  }),
  removeProjectMember,
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

router.get(
  "/:projectId/export/csv",
  authMiddleware,
  validateRequest({ params: z.object({ projectId: z.string() }) }),
  exportProjectCSV,
);

router.get(
  "/:projectId/export/pdf",
  authMiddleware,
  validateRequest({ params: z.object({ projectId: z.string() }) }),
  exportProjectPDF,
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

router.put(
  "/:projectId/objective",
  authMiddleware,
  validateRequest({
    params: z.object({ projectId: z.string() }),
    body: z.object({
      specific: z.string().optional(),
      measurable: z.string().optional(),
      achievable: z.string().optional(),
      relevant: z.string().optional(),
    }),
  }),
  updateProjectObjective,
);

export default router;
