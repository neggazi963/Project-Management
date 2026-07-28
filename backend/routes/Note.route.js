import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  createNote,
  getProjectNotes,
  updateNote,
  deleteNote,
} from "../controllers/note.controller.js";

const router = express.Router();

const noteBodySchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
});

const noteUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
});

router.post(
  "/:projectId",
  authMiddleware,
  validateRequest({
    params: z.object({ projectId: z.string() }),
    body: noteBodySchema,
  }),
  createNote,
);

router.get(
  "/:projectId",
  authMiddleware,
  validateRequest({ params: z.object({ projectId: z.string() }) }),
  getProjectNotes,
);

router.put(
  "/note/:noteId",
  authMiddleware,
  validateRequest({
    params: z.object({ noteId: z.string() }),
    body: noteUpdateSchema,
  }),
  updateNote,
);

router.delete(
  "/note/:noteId",
  authMiddleware,
  validateRequest({ params: z.object({ noteId: z.string() }) }),
  deleteNote,
);

export default router;
