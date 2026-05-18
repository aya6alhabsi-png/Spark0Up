import mongoose from "mongoose";

const fundingProgramSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    budget: { type: Number, default: 0 },
    deadline: { type: Date, default: null },
    criteria: { type: String, default: "" },
    createdByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const FundingProgram = mongoose.model("FundingProgram", fundingProgramSchema);
export default FundingProgram;
