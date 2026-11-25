import { Router } from "express";
import {
  publicMembersTree,
  publicStats,
  publicTopMembers,
} from "../controllers/publicController.js";

const router = Router();

router.get("/stats", publicStats);
router.get("/tree", publicMembersTree);
router.get("/leaderboard", publicTopMembers);

export default router;
