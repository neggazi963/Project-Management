import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { globalSearch } from "../controllers/Search.controller.js";

const router = express.Router();

router.get("/", authMiddleware, globalSearch);

export default router;