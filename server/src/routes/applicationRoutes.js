import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  applicationStats,
  approveApplication,
  getApplication,
  listApplications,
  markUnderReview,
  rejectApplication,
  submitApplication,
} from "../controllers/applicationController.js";
import { adminOnly, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  applicationSchema,
  rejectSchema,
  reviewSchema,
} from "../validators/schemas.js";

const router = Router();

const applyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many applications from this address. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", applyLimiter, validate(applicationSchema), submitApplication);

router.use(protect, adminOnly);
router.get("/", listApplications);
router.get("/stats", applicationStats);
router.get("/:id", getApplication);
router.patch("/:id/review", validate(reviewSchema), markUnderReview);
router.patch("/:id/approve", approveApplication);
router.patch("/:id/reject", validate(rejectSchema), rejectApplication);

export default router;
