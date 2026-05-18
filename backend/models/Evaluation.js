import mongoose from "mongoose";

const evaluationSchema = new mongoose.Schema(
  {
    ideaId: { type: mongoose.Schema.Types.ObjectId, ref: "Idea", required: true },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, min: 0, max: 10, required: true },
    decision: { type: String, enum: ["accepted", "changes_requested", "rejected"], default: "accepted" },
    comments: { type: String, default: "" },
  },
  { timestamps: true }
);

evaluationSchema.index({ ideaId: 1, reviewerId: 1 }, { unique: true });

const Evaluation = mongoose.model("Evaluation", evaluationSchema);
export default Evaluation;
