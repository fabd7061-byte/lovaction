import { Router } from "express";
import rateLimit from "express-rate-limit";
import { uploadImage } from "../middleware/upload.js";
import { uploadSingleImage } from "../controllers/uploadController.js";

const router = Router();

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many uploads. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/image", uploadLimiter, uploadImage.single("image"), uploadSingleImage);

export default router;
