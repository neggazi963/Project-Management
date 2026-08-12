import LearningRating from "../models/learning-rating.model.js";
import LearningPath from "../models/learning-path.model.js";
import LearningNote from "../models/learning-note.model.js";

export const recalculateRatingStats = async (targetType, targetId) => {
  const ratings = await LearningRating.find({ targetType, targetId });

  const ratingCount = ratings.length;
  const averageRating =
    ratingCount > 0
      ? Math.round(
          (ratings.reduce((sum, r) => sum + r.stars, 0) / ratingCount) * 10,
        ) / 10
      : 0;

  const Model = targetType === "path" ? LearningPath : LearningNote;

  await Model.findByIdAndUpdate(targetId, {
    "stats.averageRating": averageRating,
    "stats.ratingCount": ratingCount,
  });

  return { averageRating, ratingCount };
};
