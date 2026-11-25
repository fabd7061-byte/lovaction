import { Router } from "express";
import {
  adminReferrals,
  myReferrals,
  referralTree,
  topReferrers,
} from "../controllers/referralController.js";
import { adminOnly, protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);
router.get("/", adminOnly, adminReferrals);
router.get("/my", myReferrals);
router.get("/top", topReferrers);
router.get("/tree", referralTree);

export default router;
