import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 3 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      default: "admin",
      enum: ["admin"],
    },

    phone: { type: String, default: "" },
    birthday: { type: String, default: "" },
    bio: { type: String, default: "" },
    imageUrl: { type: String, default: "" },

    resetCode: { type: String },
    resetCodeExpiry: { type: Date },
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;