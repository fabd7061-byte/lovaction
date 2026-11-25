import User from "../models/User.js";
import PointTransaction from "../models/PointTransaction.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import { logAudit } from "../utils/audit.js";
import { adjustPoints, getPointsSummary } from "../services/pointsService.js";
import { buildLeaderboard, getMemberRank } from "../services/leaderboardService.js";
import { escapeRegex, parsePagination } from "../utils/helpers.js";

export const myPoints = asyncHandler(async (req, res) => {
  const [summary, rankInfo] = await Promise.all([
    getPointsSummary(req.user._id),
    getMemberRank(req.user._id),
  ]);
  res.json({ success: true, ...summary, ...rankInfo });
});

export const memberPoints = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  const isAdmin = ["admin", "founder"].includes(req.user.role);
  if (!isAdmin && String(req.user._id) !== String(memberId)) {
    throw new ApiError(403, "You can only view your own points.");
  }
  const member = await User.findById(memberId).select(
    "firstName lastName username memberCode profileImage points role"
  );
  if (!member) throw new ApiError(404, "Member not found.");
  const summary = await getPointsSummary(memberId);
  res.json({ success: true, member, ...summary });
});

export const adjust = asyncHandler(async (req, res) => {
  const { memberId, points, type, description } = req.body;
  const member = await User.findById(memberId).select("firstName lastName username");
  if (!member) throw new ApiError(404, "Member not found.");

  const result = await adjustPoints({
    memberId,
    points,
    type,
    description,
    actor: req.user,
  });

  await logAudit({
    actor: req.user,
    action: "points.adjusted",
    entityType: "member",
    entityId: memberId,
    description: `${req.user.firstName} ${req.user.lastName} adjusted ${member.firstName} ${member.lastName}'s points by ${points > 0 ? "+" : ""}${points}. Reason: ${description}`,
    meta: { points, type, description, balanceAfter: result.member.points },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: `Points adjusted successfully. New balance: ${result.member.points}.`,
    transaction: result.transaction,
    balance: result.member.points,
  });
});

export const leaderboard = asyncHandler(async (req, res) => {
  const limit = Math.min(100, Number.parseInt(req.query.limit, 10) || 20);
  const data = await buildLeaderboard(limit);
  res.json({ success: true, ...data });
});

/** Admin-wide points ledger with filters. */
export const allTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { limit: 15 });
  const { type, search } = req.query;

  const pipeline = [
    {
      $lookup: {
        from: "users",
        localField: "memberId",
        foreignField: "_id",
        as: "memberDoc",
      },
    },
    { $unwind: { path: "$memberDoc", preserveNullAndEmptyArrays: true } },
  ];
  const match = {};
  if (type && type !== "all") match.type = type;
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    match.$or = [
      { description: regex },
      { "memberDoc.firstName": regex },
      { "memberDoc.lastName": regex },
      { "memberDoc.username": regex },
    ];
  }
  if (Object.keys(match).length) pipeline.push({ $match: match });

  const [items, totalResult, statsAgg] = await Promise.all([
    PointTransaction.aggregate([
      ...pipeline,
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          type: 1,
          points: 1,
          description: 1,
          balanceAfter: 1,
          createdAt: 1,
          member: {
            _id: "$memberDoc._id",
            firstName: "$memberDoc.firstName",
            lastName: "$memberDoc.lastName",
            username: "$memberDoc.username",
            profileImage: "$memberDoc.profileImage",
            role: "$memberDoc.role",
          },
        },
      },
    ]),
    PointTransaction.aggregate([...pipeline, { $count: "total" }]),
    PointTransaction.aggregate([
      {
        $group: {
          _id: null,
          awarded: {
            $sum: { $cond: [{ $gt: ["$points", 0] }, "$points", 0] },
          },
          deducted: {
            $sum: {
              $cond: [{ $lt: ["$points", 0] }, { $abs: "$points" }, 0],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  res.json({
    success: true,
    items,
    stats: {
      awarded: statsAgg[0]?.awarded || 0,
      deducted: statsAgg[0]?.deducted || 0,
      count: statsAgg[0]?.count || 0,
    },
    pagination: {
      page,
      limit,
      total: totalResult[0]?.total || 0,
      pages: Math.max(1, Math.ceil((totalResult[0]?.total || 0) / limit)),
    },
  });
});
