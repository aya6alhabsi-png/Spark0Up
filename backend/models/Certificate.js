import mongoose from "mongoose";
import crypto from "crypto";

function generateCode() {
  return crypto.randomBytes(8).toString("hex").toUpperCase();
}

const certificateSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["EVENT_PARTICIPATION", "IDEA_COMPLETION"], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null },
    ideaId: { type: mongoose.Schema.Types.ObjectId, ref: "Idea", default: null },
    code: { type: String, default: generateCode },
    platformName: { type: String, default: "SparkUp Platform" },
    userName: { type: String, default: "" },
    eventName: { type: String, default: "" },
    organizationName: { type: String, default: "SparkUp" },
    eventDate: { type: Date, default: null },
    thankYouMessage: {
      type: String,
      default: "Thank you for being part of SparkUp and contributing to innovation, creativity, and future ideas.",
    },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Certificate = mongoose.model("Certificate", certificateSchema);
export default Certificate;
