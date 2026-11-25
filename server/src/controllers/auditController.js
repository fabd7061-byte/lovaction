import AuditLog from "../models/AuditLog.js";
import { asyncHandler } from "../utils/ApiError.js";
import { escapeRegex, parsePagination } from "../utils/helpers.js";

export const listAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { limit: 20 });
  const { search, action, from, to } = req.query;
  const query = {};

  if (action && action !== "all") query.action = new RegExp(`^${escapeRegex(action)}`);
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [
      { description: regex },
      { actorName: regex },
      { action: regex },
      { entityType: regex },
    ];
  }
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const [items, total, actions] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actor", "firstName lastName username role profileImage")
      .lean(),
    AuditLog.countDocuments(query),
    AuditLog.distinct("action"),
  ]);

  res.json({
    success: true,
    items,
    actions: actions.sort(),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
});
