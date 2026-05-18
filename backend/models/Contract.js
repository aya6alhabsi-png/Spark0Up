import mongoose from "mongoose";

const contractSchema = new mongoose.Schema(
  {
    ideaId: { type: mongoose.Schema.Types.ObjectId, ref: "Idea", required: true },
    funderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: "FundingProgram", default: null },
    issuedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    contractUrl: { type: String, default: "" },
    finalBudget: { type: Number, default: 0 },
    deadline: { type: Date, default: null },
    conditions: { type: String, default: "" },
    milestones: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["Drafted", "Signed", "In Implementation", "Completed"],
      default: "Drafted",
    },
  },
  { timestamps: true }
);

contractSchema.statics.allowedStatuses = ["Drafted", "Signed", "In Implementation", "Completed"];

const Contract = mongoose.model("Contract", contractSchema);
export default Contract;
