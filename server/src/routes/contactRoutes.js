import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  deleteMessage,
  listMessages,
  submitContact,
  updateMessageStatus,
} from "../controllers/contactController.js";
import { adminOnly, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { contactSchema, contactStatusSchema } from "../validators/schemas.js";

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  message: {
    success: false,
    message: "Too many messages from this address. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", contactLimiter, validate(contactSchema), submitContact);

router.use(protect, adminOnly);
router.get("/", listMessages);
router.patch("/:id/status", validate(contactStatusSchema), updateMessageStatus);
router.delete("/:id", deleteMessage);

export default router;
