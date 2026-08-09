import mongoose, { Schema } from "mongoose";

const projectTemplateSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: String }],
    taskTemplates: [
      {
        title: { type: String, required: true },
        description: { type: String },
        status: {
          type: String,
          enum: ["To Do", "In Progress", "Done"],
          default: "To Do",
        },
        priority: {
          type: String,
          enum: ["Low", "Medium", "High"],
          default: "Medium",
        },
      },
    ],
  },
  { timestamps: true },
);

const ProjectTemplate = mongoose.model(
  "ProjectTemplate",
  projectTemplateSchema,
);

export default ProjectTemplate;
