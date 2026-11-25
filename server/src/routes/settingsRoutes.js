import { Router } from "express";
import {
  getAdminSettings,
  getPublicSettings,
  updateSettings,
} from "../controllers/settingsController.js";
import { adminOnly, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { settingsSchema } from "../validators/schemas.js";

const router = Router();

router.get("/", getPublicSettings);
router.get("/admin", protect, adminOnly, getAdminSettings);
router.put("/", protect, adminOnly, validate(settingsSchema), updateSettings);

export default router;
