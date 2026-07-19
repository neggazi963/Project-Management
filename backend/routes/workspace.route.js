import express from "express";
import {
  createWorkspace,
  getWorkspaces,
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

export default router;
