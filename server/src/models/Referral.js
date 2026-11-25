import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    referredMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    pointsAwarded: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

referralSchema.index(
  { referredMember: 1 },
  { unique: true, partialFilterExpression: { referredMember: { $type: "objectId" } } }
);
referralSchema.index({ referrer: 1, status: 1 });

export default mongoose.model("Referral", referralSchema);
