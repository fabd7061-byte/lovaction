import { Router } from "express";
import {
  getMember,
  listMembers,
  memberReferrals,
  memberTree,
  resetMemberPassword,
  updateMember,
  updateRole,
  updateStatus,
} from "../controllers/memberController.js";
import { adminOnly, founderOnly, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  memberUpdateSchema,
  roleSchema,
  statusSchema,
} from "../validators/schemas.js";

const router = Router();

router.use(protect);

router.get("/", adminOnly, listMembers);
router.patch("/:id/status", adminOnly, validate(statusSchema), updateStatus);
router.patch("/:id/role", founderOnly, validate(roleSchema), updateRole);
router.patch("/:id/reset-password", adminOnly, resetMemberPassword);
router.get("/:id/tree", memberTree);
router.get("/:id/referrals", memberReferrals);
router.get("/:id", getMember);
router.put("/:id", validate(memberUpdateSchema), updateMember);

export default router;
