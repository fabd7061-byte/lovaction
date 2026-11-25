import mongoose from "mongoose";

const galleryItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    caption: { type: String, default: "", trim: true, maxlength: 600 },
    imageUrl: { type: String, required: true },
    album: { type: String, default: "Community Activities", trim: true },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

galleryItemSchema.index({ createdAt: -1 });

export default mongoose.model("GalleryItem", galleryItemSchema);
