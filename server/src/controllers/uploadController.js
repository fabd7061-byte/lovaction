import { asyncHandler, ApiError } from "../utils/ApiError.js";

export const uploadSingleImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Please choose an image to upload.");
  res.status(201).json({
    success: true,
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
    size: req.file.size,
  });
});
