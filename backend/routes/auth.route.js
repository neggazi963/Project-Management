import express from "express";

import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
} from "../libs/validate-schema.js";

import {
  registerUser,
  loginUser,
  verifyEmail,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post(
  "/register",
  validateRequest({
    body: registerSchema,
  }),
  registerUser,
);
router.post(
  "/login",
  validateRequest({
    body: loginSchema,
  }),
  loginUser,
);

router.post(
  "/verify-email",
  validateRequest({
    body: verifyEmailSchema,
  }),
  verifyEmail,
);

export default router;
