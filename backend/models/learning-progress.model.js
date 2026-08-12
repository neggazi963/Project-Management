import mongoose, { Schema } from "mongoose";

const learningProgressSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    path: { type: Schema.Types.ObjectId, ref: "LearningPath", required: true },
    completedNotes: [{ type: Schema.Types.ObjectId, ref: "LearningNote" }],
    currentNote: { type: Schema.Types.ObjectId, ref: "LearningNote" },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

learningProgressSchema.index({ user: 1, path: 1 }, { unique: true });

const LearningProgress = mongoose.model(
  "LearningProgress",
  learningProgressSchema,
);
export default LearningProgress;
