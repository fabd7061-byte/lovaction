import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "main" },
    orgName: { type: String, default: "Lovaction Ministries" },
    motto: { type: String, default: "Love in Action, Hope for All" },
    email: { type: String, default: "hello@lovactionministries.org" },
    phone: { type: String, default: "+250 788 000 000" },
    address: { type: String, default: "Kigali, Rwanda" },
    socials: {
      facebook: { type: String, default: "https://facebook.com" },
      instagram: { type: String, default: "https://instagram.com" },
      twitter: { type: String, default: "https://x.com" },
      youtube: { type: String, default: "https://youtube.com" },
    },
    pointsPerReferral: { type: Number, default: 10, min: 0, max: 1000 },
    rankingMetric: {
      type: String,
      enum: ["referrals", "points"],
      default: "referrals",
    },
    allowPublicLeaderboard: { type: Boolean, default: true },
    allowPublicMembers: { type: Boolean, default: true },
    joinEnabled: { type: Boolean, default: true },
    foundedYear: { type: Number, default: 2019 },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);
