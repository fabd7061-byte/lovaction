import { Router } from "express";
import {
  createNews,
  deleteNews,
  getNews,
  listNews,
  publishNews,
  updateNews,
} from "../controllers/newsController.js";
import { adminOnly, optionalAuth, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { newsSchema } from "../validators/schemas.js";

const router = Router();

router.get("/", optionalAuth, listNews);
router.get("/:slug", optionalAuth, getNews);

router.post("/", protect, adminOnly, validate(newsSchema), createNews);
router.put("/:id", protect, adminOnly, validate(newsSchema), updateNews);
router.delete("/:id", protect, adminOnly, deleteNews);
router.patch("/:id/publish", protect, adminOnly, publishNews);

export default router;
