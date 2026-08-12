import mongoose, { Schema } from "mongoose";

const domainSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    icon: { type: String }, // nom d'icône lucide, ex: "Code", "Stethoscope"
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

const Domain = mongoose.model("Domain", domainSchema);
export default Domain;