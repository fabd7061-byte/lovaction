import { Router } from "express";
import {
  adminDashboard,
  founderDashboard,
  memberDashboard,
} from "../controllers/dashboardController.js";
import { adminOnly, founderOnly, protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);
router.get("/admin", adminOnly, adminDashboard);
router.get("/founder", founderOnly, founderDashboard);
router.get("/member", memberDashboard);

export default router;
