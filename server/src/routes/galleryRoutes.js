import { Router } from "express";
import {
  createGalleryItem,
  deleteGalleryItem,
  listGallery,
  updateGalleryItem,
} from "../controllers/galleryController.js";
import { adminOnly, optionalAuth, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { gallerySchema } from "../validators/schemas.js";

const router = Router();

router.get("/", optionalAuth, listGallery);
router.post("/", protect, adminOnly, validate(gallerySchema), createGalleryItem);
router.put("/:id", protect, adminOnly, validate(gallerySchema), updateGalleryItem);
router.delete("/:id", protect, adminOnly, deleteGalleryItem);

export default router;
