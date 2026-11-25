import { Router } from "express";
import { generateReport } from "../controllers/reportController.js";
import { adminOnly, protect } from "../middleware/auth.js";

const router = Router();

router.get("/:type", protect, adminOnly, generateReport);

export default router;
