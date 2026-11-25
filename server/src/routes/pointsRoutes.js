import { Router } from "express";
import {
  adjust,
  allTransactions,
  leaderboard,
  memberPoints,
  myPoints,
} from "../controllers/pointsController.js";
import { adminOnly, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { pointAdjustSchema } from "../validators/schemas.js";

const router = Router();

router.use(protect);
router.get("/my", myPoints);
router.get("/leaderboard", leaderboard);
router.get("/", adminOnly, allTransactions);
router.post("/adjust", adminOnly, validate(pointAdjustSchema), adjust);
router.get("/:memberId", memberPoints);

export default router;
