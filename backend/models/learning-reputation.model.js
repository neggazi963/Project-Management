import mongoose, { Schema } from "mongoose";

const learningReputationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    breakdown: {
      qualityScore: { type: Number, default: 0 }, // dérivé des ratings
      impactScore: { type: Number, default: 0 }, // dérivé des complétions
    },
    badges: [
      {
        key: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

const LearningReputation = mongoose.model(
  "LearningReputation",
  learningReputationSchema,
);
export default LearningReputation;
