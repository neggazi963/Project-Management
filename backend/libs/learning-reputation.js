import LearningPath from "../models/learning-path.model.js";
import LearningNote from "../models/learning-note.model.js";
import LearningReputation from "../models/learning-reputation.model.js";

// Poids : le path est l'unité principale, la note pèse moins (sous-unité)
const QUALITY_PATH_WEIGHT = 2;
const QUALITY_NOTE_WEIGHT = 0.5;
const COMPLETION_WEIGHT = 5;
const ENROLLED_WEIGHT = 1;

export const BADGE_CATALOG = [
  {
    key: "five_paths_published",
    label: "5 Paths Published",
    description: "Published 5 or more learning paths",
    check: (stats) => stats.publishedPathsCount >= 5,
  },
  {
    key: "high_rated_creator",
    label: "Highly Rated",
    description: "Average rating above 4.5 across published paths",
    check: (stats) => stats.ratedPathsCount >= 1 && stats.avgRating >= 4.5,
  },
  {
    key: "hundred_learners",
    label: "100 Learners Reached",
    description: "100+ learners completed your paths",
    check: (stats) => stats.totalCompletions >= 100,
  },
];

export const recalculateReputation = async (userId) => {
  const paths = await LearningPath.find({
    createdBy: userId,
    status: "published",
  });
  const notes = await LearningNote.find({
    createdBy: userId,
    status: "published",
  });

  // Quality : pondérée par le nombre de votants, pas juste la moyenne brute
  // (évite qu'une seule note à 5 étoiles pèse autant qu'un path noté 50 fois)
  const pathQuality = paths.reduce(
    (sum, p) => sum + p.stats.averageRating * p.stats.ratingCount,
    0,
  );
  const noteQuality = notes.reduce(
    (sum, n) => sum + n.stats.averageRating * n.stats.ratingCount,
    0,
  );
  const qualityScore =
    pathQuality * QUALITY_PATH_WEIGHT + noteQuality * QUALITY_NOTE_WEIGHT;

  const totalCompletions = paths.reduce(
    (sum, p) => sum + p.stats.completionCount,
    0,
  );
  const totalEnrolled = paths.reduce(
    (sum, p) => sum + p.stats.enrolledCount,
    0,
  );
  const impactScore =
    totalCompletions * COMPLETION_WEIGHT + totalEnrolled * ENROLLED_WEIGHT;

  const score = Math.round(qualityScore + impactScore);

  const ratedPaths = paths.filter((p) => p.stats.ratingCount > 0);
  const totalRatingCount = ratedPaths.reduce(
    (sum, p) => sum + p.stats.ratingCount,
    0,
  );
  const avgRating =
    totalRatingCount > 0 ? pathQuality / totalRatingCount : 0;

  const statsForBadges = {
    publishedPathsCount: paths.length,
    totalCompletions,
    avgRating,
    ratedPathsCount: ratedPaths.length,
  };

  let reputation = await LearningReputation.findOne({ user: userId });
  if (!reputation) {
    reputation = new LearningReputation({ user: userId, badges: [] });
  }

  const existingKeys = new Set(reputation.badges.map((b) => b.key));
  const newlyUnlocked = [];

  for (const badge of BADGE_CATALOG) {
    if (!existingKeys.has(badge.key) && badge.check(statsForBadges)) {
      reputation.badges.push({ key: badge.key, unlockedAt: new Date() });
      newlyUnlocked.push(badge.key);
    }
  }

  reputation.score = score;
  reputation.breakdown = { qualityScore, impactScore };
  await reputation.save();

  return { reputation, newlyUnlocked };
};