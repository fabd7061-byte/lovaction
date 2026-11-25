import api from "../services/api.js";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export async function uploadImageFile(file) {
  if (!file) throw new Error("Please choose an image.");
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Only JPG, PNG, WEBP, GIF or AVIF images are allowed.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image is too large. Maximum size is 5 MB.");
  }
  const form = new FormData();
  form.append("image", file);
  const { data } = await api.post("/uploads/image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.url;
}
