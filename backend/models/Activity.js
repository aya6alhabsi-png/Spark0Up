import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, refPath: "actorModel" },
    actorModel: { type: String, enum: ["User", "Admin"], default: "User" },
    actorName: { type: String, default: "System" },
    actorRole: { type: String, default: "system" },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetModel: { type: String, default: "" },
    audienceRoles: [{ type: String, enum: ["admin", "innovator", "reviewer", "funder"] }],
    audienceUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

activitySchema.index({ createdAt: -1 });
activitySchema.index({ audienceRoles: 1, createdAt: -1 });
activitySchema.index({ audienceUsers: 1, createdAt: -1 });
activitySchema.index({ actorId: 1, createdAt: -1 });

export default mongoose.model("Activity", activitySchema);
