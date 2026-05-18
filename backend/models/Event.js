import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    registeredAt: { type: Date, default: Date.now },
    attendanceStatus: {
      type: String,
      enum: ["registered", "checked_in", "completed", "absent"],
      default: "registered",
    },
    checkedInAt: { type: Date, default: null },
    checkedOutAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    certificateIssued: { type: Boolean, default: false },
    reminder24hSent: { type: Boolean, default: false },
    reminder1hSent: { type: Boolean, default: false },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String, default: "" },
    organizationName: { type: String, default: "SparkUp" },
    imageUrl: { type: String, default: "" },
    capacity: { type: Number, default: 0 },
    qrCheckInToken: { type: String, default: "" },
    qrCheckOutToken: { type: String, default: "" },
    status: { type: String, enum: ["active", "disabled", "archived", "draft"], default: "active" },
    createdByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    registrations: { type: [registrationSchema], default: [] },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;
