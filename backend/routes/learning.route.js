import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import adminMiddleware from "../middleware/admin.middleware.js";
import {
  createDomain,
  getDomains,
  getDomainBySlug,
  createPath,
  getPathById,
  updatePath,
  deletePath,
  getMyPaths,
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
  reorderNotes,
  enrollInPath,
  markNoteComplete,
  getMyProgress,
  rateTarget,
  getMyRating,
  discoverPaths,
  getPathNotesForEditing,
  checkSimilarDomains,
  reportContent,
  getReputation,
  getLeaderboard,
  getPathGraph,
  getDomainGraph,
  getDomainRoadmap,
  getSuggestedNextPaths,
  getDomainNotesForLinking,
  getReports,
  updateReportStatus,
  moderateDeleteContent,
  moderateDeleteDomain,
  moderateBanUser,
  moderateUnbanUser,
} from "../controllers/learning.controller.js";

const router = express.Router();

// Domains
router.get("/domains/check-similar", authMiddleware, checkSimilarDomains);
router.post("/domains", authMiddleware, createDomain);
router.get("/domains", authMiddleware, getDomains);
router.get("/domains/:slug", authMiddleware, getDomainBySlug);
router.get("/domains/:slug/graph", authMiddleware, getDomainGraph);
router.post("/report/:targetType/:targetId", authMiddleware, reportContent);
router.get("/domains/:slug/roadmap", authMiddleware, getDomainRoadmap);
router.get("/paths/:pathId/next", authMiddleware, getSuggestedNextPaths);
// Paths
router.post("/paths", authMiddleware, createPath);
router.get("/paths/my-paths", authMiddleware, getMyPaths);
router.get("/paths/:pathId", authMiddleware, getPathById);
router.put("/paths/:pathId", authMiddleware, updatePath);
router.delete("/paths/:pathId", authMiddleware, deletePath);
router.put("/paths/:pathId/reorder-notes", authMiddleware, reorderNotes);
router.post("/paths/:pathId/enroll", authMiddleware, enrollInPath);
router.post(
  "/paths/:pathId/notes/:noteId/complete",
  authMiddleware,
  markNoteComplete,
);

// Notes
router.post("/paths/:pathId/notes", authMiddleware, createNote);
router.get("/notes/:noteId", authMiddleware, getNoteById);
router.put("/notes/:noteId", authMiddleware, updateNote);
router.delete("/notes/:noteId", authMiddleware, deleteNote);
router.get(
  "/domains/:domainId/notes-for-linking",
  authMiddleware,
  getDomainNotesForLinking,
);

// Progression
router.get("/my-progress", authMiddleware, getMyProgress);

// Rating
router.post("/rate/:targetType/:targetId", authMiddleware, rateTarget);
router.get("/rate/:targetType/:targetId/mine", authMiddleware, getMyRating);

router.get("/leaderboard", authMiddleware, getLeaderboard);
router.get("/reputation/:userId", authMiddleware, getReputation);

// Découverte
router.get("/discover", authMiddleware, discoverPaths);
router.get("/paths/:pathId/edit", authMiddleware, getPathNotesForEditing);
router.get("/paths/:pathId/graph", authMiddleware, getPathGraph);

// Modération (admin uniquement)
router.get("/moderation/reports", authMiddleware, adminMiddleware, getReports);
router.put(
  "/moderation/reports/:reportId",
  authMiddleware,
  adminMiddleware,
  updateReportStatus,
);
router.delete(
  "/moderation/content/:targetType/:targetId",
  authMiddleware,
  adminMiddleware,
  moderateDeleteContent,
);
router.delete(
  "/moderation/domains/:domainId",
  authMiddleware,
  adminMiddleware,
  moderateDeleteDomain,
);
router.put(
  "/moderation/ban/:userId",
  authMiddleware,
  adminMiddleware,
  moderateBanUser,
);
router.put(
  "/moderation/unban/:userId",
  authMiddleware,
  adminMiddleware,
  moderateUnbanUser,
);

export default router;
