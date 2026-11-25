import { Router } from "express";
import { listAuditLogs } from "../controllers/auditController.js";
import { adminOnly, protect } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, adminOnly, listAuditLogs);

export default router;
