import mongoose from "mongoose";

// CAT A (advanced): store HASH only, with expiry and status.
// Invite link contains raw token; DB stores sha256(token).

const reviewerInviteSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
    },
    invitedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
  },
  { timestamps: true }
);

// Auto-delete invite docs after expiry
reviewerInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("ReviewerInvite", reviewerInviteSchema);
