import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { validateRequest } from "zod-express-middleware";
import { z } from "zod";
import {
  createTemplateFromProject,
  getWorkspaceTemplates,
  deleteTemplate,
  createProjectFromTemplate,
} from "../controllers/template.controller.js";

const router = express.Router();

router.post(
  "/projects/:projectId/save-as-template",
  authMiddleware,
  validateRequest({
    params: z.object({ projectId: z.string() }),
    body: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
    }),
  }),
  createTemplateFromProject,
);

router.get(
  "/workspaces/:workspaceId/templates",
  authMiddleware,
  validateRequest({ params: z.object({ workspaceId: z.string() }) }),
  getWorkspaceTemplates,
);

router.delete(
  "/templates/:templateId",
  authMiddleware,
  validateRequest({ params: z.object({ templateId: z.string() }) }),
  deleteTemplate,
);

router.post(
  "/workspaces/:workspaceId/templates/:templateId/create-project",
  authMiddleware,
  validateRequest({
    params: z.object({ workspaceId: z.string(), templateId: z.string() }),
    body: z.object({
      title: z.string().optional(),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
    }),
  }),
  createProjectFromTemplate,
);

export default router;
