import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true },
    message: { type: String, required: true },
    rating: { type: Number, default: null },
    category: {
      type: String,
      enum: ["GENERAL", "EVENT_EVALUATION"],
      default: "GENERAL",
    },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null },
    gender: { type: String, enum: ["female", "male", ""], default: "" },
    ageRange: { type: String, enum: ["under18", "18-24", "25-34", "35plus", ""], default: "" },
  },
  { timestamps: true }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
