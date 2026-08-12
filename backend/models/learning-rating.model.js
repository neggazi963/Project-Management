import mongoose, { Schema } from "mongoose";

const learningRatingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: {
      type: String,
      enum: ["path", "note"],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },
    stars: { type: Number, min: 1, max: 5, required: true },
  },
  { timestamps: true },
);

// Un utilisateur ne peut noter qu'une seule fois la même cible
learningRatingSchema.index(
  { user: 1, targetType: 1, targetId: 1 },
  { unique: true },
);

const LearningRating = mongoose.model("LearningRating", learningRatingSchema);
export default LearningRating;
