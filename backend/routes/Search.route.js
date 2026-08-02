import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { globalSearch } from "../controllers/search.controller.js";

const router = express.Router();

router.get("/", authMiddleware, globalSearch);

export default router;