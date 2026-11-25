import mongoose from "mongoose";

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    excerpt: { type: String, required: true, trim: true, maxlength: 400 },
    content: { type: String, required: true },
    coverImage: { type: String, default: "" },
    category: {
      type: String,
      enum: [
        "Education",
        "Community",
        "Faith",
        "Events",
        "Impact",
        "Announcements",
      ],
      default: "Community",
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    views: { type: Number, default: 0 },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

newsSchema.index({ createdAt: -1 });

export default mongoose.model("News", newsSchema);
