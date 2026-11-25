import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, required: true, trim: true, index: true },
    reasonForJoining: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
    referralUsername: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    location: { type: String, default: "", trim: true, maxlength: 120 },
    message: { type: String, default: "", trim: true, maxlength: 1200 },
    profileImage: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "", trim: true, maxlength: 800 },
    reviewNote: { type: String, default: "", trim: true, maxlength: 800 },
    createdMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    pointsAwarded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

applicationSchema.index({ createdAt: -1 });

export default mongoose.model("Application", applicationSchema);
