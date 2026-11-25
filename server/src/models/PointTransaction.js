import mongoose from "mongoose";

const pointTransactionSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["referral", "admin_adjustment", "bonus", "penalty"],
      required: true,
    },
    points: { type: Number, required: true },
    description: { type: String, required: true, trim: true, maxlength: 400 },
    relatedMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    balanceAfter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

pointTransactionSchema.index({ createdAt: -1 });

export default mongoose.model("PointTransaction", pointTransactionSchema);
