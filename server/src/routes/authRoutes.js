import { Router } from "express";
import {
  login,
  logout,
  me,
  register,
  changePassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { changePasswordSchema, loginSchema } from "../validators/schemas.js";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.post("/register", register);
router.get("/me", protect, me);
router.post("/logout", protect, logout);
router.patch("/password", protect, validate(changePasswordSchema), changePassword);

export default router;
