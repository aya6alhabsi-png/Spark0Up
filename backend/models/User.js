import mongoose from "mongoose";

// CAT A (advanced): unified user model for innovator/funder/reviewer.
// Reviewer accounts are created ONLY through the invitation flow and require admin approval.

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 3 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: ["innovator", "funder", "reviewer"],
      required: true,
    },

    // Used for reviewer approval flow + future funder approval flow.
    status: {
      type: String,
      enum: ["pending", "active", "rejected", "blocked"],
      default: "active",
    },

    phone: { type: String, default: "" },
    birthday: { type: String, default: "" },

    // CAT A M9 report analytics fields
    gender: { type: String, enum: ["female", "male", ""], default: "" },
    fieldOfInterest: { type: String, default: "" },

    // Profile management (CAT A)
    bio: { type: String, default: "" },
    imageUrl: { type: String, default: "" },


    // Reviewer application fields
    specialization: { type: String, default: "" },
    organization: { type: String, default: "" },
    experienceYears: { type: Number, default: 0 },
    linkedin: { type: String, default: "" },

    // Forgot password
    resetCode: { type: String },
    resetCodeExpiry: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
