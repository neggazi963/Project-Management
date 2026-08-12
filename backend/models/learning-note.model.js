import mongoose, { Schema } from "mongoose";

const learningNoteSchema = new Schema(
  {
    path: { type: Schema.Types.ObjectId, ref: "LearningPath", required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true }, // Markdown
    order: { type: Number, required: true, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    // Liens extraits automatiquement du contenu (syntaxe [[Titre de la note]]),
    // utilisés pour le futur graphe façon Obsidian (Phase 3)
    linkedNotes: [{ type: Schema.Types.ObjectId, ref: "LearningNote" }],
    relatedNotes: [
      {
        type: Schema.Types.ObjectId,
        ref: "LearningNote",
      },
    ],
    stats: {
      averageRating: { type: Number, default: 0 },
      ratingCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

const LearningNote = mongoose.model("LearningNote", learningNoteSchema);
export default LearningNote;
