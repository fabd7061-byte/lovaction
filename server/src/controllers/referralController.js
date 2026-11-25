import Referral from "../models/Referral.js";
import { asyncHandler } from "../utils/ApiError.js";
import { buildMemberTree, getAncestorPath } from "../services/treeService.js";
import { buildLeaderboard, getMemberRank } from "../services/leaderboardService.js";
import { escapeRegex, parsePagination } from "../utils/helpers.js";

export const myReferrals = asyncHandler(async (req, res) => {
  const referrals = await Referral.find({ referrer: req.user._id })
    .sort({ createdAt: -1 })
    .populate("referredMember", "firstName lastName username profileImage role joinedAt status")
    .populate("application", "firstName lastName profileImage status createdAt")
    .lean();

  const stats = { total: referrals.length, approved: 0, pending: 0, rejected: 0 };
  referrals.forEach((r) => {
    stats[r.status] = (stats[r.status] || 0) + 1;
  });

  const { rank, totalRanked } = await getMemberRank(req.user._id);

  res.json({
    success: true,
    referrals,
    stats,
    points: req.user.points,
    rank,
    totalRanked,
  });
});

export const topReferrers = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Number.parseInt(req.query.limit, 10) || 10);
  const leaderboard = await buildLeaderboard(limit);
  res.json({ success: true, ...leaderboard });
});

export const referralTree = asyncHandler(async (req, res) => {
  const [tree, ancestors] = await Promise.all([
    buildMemberTree(),
    getAncestorPath(req.user._id),
  ]);
  res.json({
    success: true,
    tree,
    ancestors,
    currentUserId: String(req.user._id),
  });
});

export const adminReferrals = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { limit: 15 });
  const { status, search } = req.query;

  const pipeline = [
    {
      $lookup: {
        from: "users",
        localField: "referrer",
        foreignField: "_id",
        as: "referrerDoc",
      },
    },
    { $unwind: { path: "$referrerDoc", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "referredMember",
        foreignField: "_id",
        as: "referredDoc",
      },
    },
    { $unwind: { path: "$referredDoc", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "applications",
        localField: "application",
        foreignField: "_id",
        as: "applicationDoc",
      },
    },
    { $unwind: { path: "$applicationDoc", preserveNullAndEmptyArrays: true } },
  ];

  const match = {};
  if (status && status !== "all") match.status = status;
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    match.$or = [
      { "referrerDoc.firstName": regex },
      { "referrerDoc.lastName": regex },
      { "referrerDoc.username": regex },
      { "referredDoc.firstName": regex },
      { "referredDoc.lastName": regex },
      { "applicationDoc.firstName": regex },
      { "applicationDoc.lastName": regex },
    ];
  }
  if (Object.keys(match).length) pipeline.push({ $match: match });

  const [items, totalResult, statsAgg] = await Promise.all([
    Referral.aggregate([
      ...pipeline,
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          status: 1,
          pointsAwarded: 1,
          createdAt: 1,
          approvedAt: 1,
          referrer: {
            _id: "$referrerDoc._id",
            firstName: "$referrerDoc.firstName",
            lastName: "$referrerDoc.lastName",
            username: "$referrerDoc.username",
            profileImage: "$referrerDoc.profileImage",
            role: "$referrerDoc.role",
          },
          referredMember: {
            _id: "$referredDoc._id",
            firstName: "$referredDoc.firstName",
            lastName: "$referredDoc.lastName",
            username: "$referredDoc.username",
            profileImage: "$referredDoc.profileImage",
            joinedAt: "$referredDoc.joinedAt",
          },
          application: {
            _id: "$applicationDoc._id",
            firstName: "$applicationDoc.firstName",
            lastName: "$applicationDoc.lastName",
            email: "$applicationDoc.email",
            status: "$applicationDoc.status",
            createdAt: "$applicationDoc.createdAt",
          },
        },
      },
    ]),
    Referral.aggregate([...pipeline, { $count: "total" }]),
    Referral.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const stats = { approved: 0, pending: 0, rejected: 0, total: 0 };
  statsAgg.forEach((s) => {
    stats[s._id] = s.count;
    stats.total += s.count;
  });

  res.json({
    success: true,
    items,
    stats,
    pagination: {
      page,
      limit,
      total: totalResult[0]?.total || 0,
      pages: Math.max(1, Math.ceil((totalResult[0]?.total || 0) / limit)),
    },
  });
});

export const publicTree = asyncHandler(async (_req, res) => {
  const tree = await buildMemberTree();
  res.json({ success: true, tree });
});

export const publicLeaderboard = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Number.parseInt(req.query.limit, 10) || 10);
  const leaderboard = await buildLeaderboard(limit);
  res.json({ success: true, ...leaderboard });
});
