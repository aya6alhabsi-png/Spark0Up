import mongoose from "mongoose";

const adminCommentSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    comment: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const funderDecisionSchema = new mongoose.Schema(
  {
    funderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    decision: { type: String, enum: ["accepted", "rejected", "pending"], default: "pending" },
    comment: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ideaMessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    senderRole: { type: String, enum: ["admin", "funder", "innovator", "reviewer"], required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ideaSchema = new mongoose.Schema(
  {
    innovatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    ipFormUrl: { type: String, default: "" },

    status: {
      type: String,
      enum: [
        "submitted",
        "admin_changes_requested",
        "with_reviewer",
        "reviewer_changes_requested",
        "reviewer_approved",
        "presented_to_funders",
        "funding_pending",
        "contract_drafted",
        "contract_signed",
        "in_progress",
        "resolved",
        "rejected",
        "under_review",
        "approved",
      ],
      default: "submitted",
    },

    adminComments: { type: [adminCommentSchema], default: [] },
    assignedReviewerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    selectedFunderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    funderDecisions: { type: [funderDecisionSchema], default: [] },
    messages: { type: [ideaMessageSchema], default: [] },

    fundingAgreement: {
      finalBudget: { type: Number, default: 0 },
      deadline: { type: Date, default: null },
      conditions: { type: String, default: "" },
      requiredDocuments: { type: String, default: "" },
      milestones: { type: [String], default: [] },
      lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
      updatedAt: { type: Date, default: null },
    },
    evaluationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Evaluation" }],

    contractId: { type: mongoose.Schema.Types.ObjectId, ref: "Contract", default: null },
    lastUpdatedByFunderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

ideaSchema.statics.allowedStatuses = [
  "submitted",
  "admin_changes_requested",
  "with_reviewer",
  "reviewer_changes_requested",
  "reviewer_approved",
  "presented_to_funders",
  "funding_pending",
  "contract_drafted",
  "contract_signed",
  "in_progress",
  "resolved",
  "rejected",
  "under_review",
  "approved",
];

const Idea = mongoose.model("Idea", ideaSchema);
export default Idea;
