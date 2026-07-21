import express from "express";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspacesDetails,
  getWorkspacesProjects,
} from "../controllers/workspace.controller.js";
import { validateRequest } from "zod-express-middleware";
import { workspaceSchema } from "../libs/validate-schema.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  validateRequest({ body: workspaceSchema }),
  createWorkspace,
);

router.get("/", authMiddleware, getWorkspaces);

router.get("/:workspaceId", authMiddleware, getWorkspacesDetails);
router.get("/:workspaceId/projects", authMiddleware, getWorkspacesProjects);

export default router;
