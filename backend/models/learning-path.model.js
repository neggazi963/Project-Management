import mongoose, { Schema } from "mongoose";

const learningPathSchema = new Schema(
  {
    domain: {
      type: Schema.Types.ObjectId,
      ref: "LearningDomain",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    // Ordre pédagogique explicite des notes dans ce path
    noteOrder: [{ type: Schema.Types.ObjectId, ref: "LearningNote" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: String }],
    prerequisites: [
      {
        type: Schema.Types.ObjectId,
        ref: "LearningPath",
      },
    ],
    // Stats dénormalisées pour éviter des agrégations coûteuses à chaque affichage
    stats: {
      averageRating: { type: Number, default: 0 },
      ratingCount: { type: Number, default: 0 },
      completionCount: { type: Number, default: 0 },
      enrolledCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

const LearningPath = mongoose.model("LearningPath", learningPathSchema);
export default LearningPath;
