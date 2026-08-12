import mongoose, { Schema } from "mongoose";

const learningReportSchema = new Schema(
  {
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: {
      type: String,
      enum: ["path", "note", "domain"],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: {
      type: String,
      enum: ["inaccurate", "spam", "inappropriate", "duplicate", "other"],
      required: true,
    },
    details: { type: String, trim: true },
    status: {
      type: String,
      enum: ["open", "reviewed", "dismissed"],
      default: "open",
    },
  },
  { timestamps: true },
);

learningReportSchema.index({ targetType: 1, targetId: 1 });

const LearningReport = mongoose.model("LearningReport", learningReportSchema);
export default LearningReport;
