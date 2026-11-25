import User from "../models/User.js";
import Application from "../models/Application.js";
import Referral from "../models/Referral.js";
import News from "../models/News.js";
import GalleryItem from "../models/GalleryItem.js";
import ContactMessage from "../models/ContactMessage.js";
import AuditLog from "../models/AuditLog.js";
import Notification from "../models/Notification.js";
import PointTransaction from "../models/PointTransaction.js";
import { asyncHandler } from "../utils/ApiError.js";
import { buildLeaderboard, getMemberRank } from "../services/leaderboardService.js";
import { getAncestorPath } from "../services/treeService.js";
import { getSettings } from "../services/settingsService.js";

const DAY = 86400000;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function lastMonths(count) {
  const out = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: monthKey(d),
      label: d.toLocaleDateString("en-GB", { month: "short" }),
      year: d.getFullYear(),
      members: 0,
    });
  }
  return out;
}

function lastDays(count) {
  const out = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * DAY);
    out.push({
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      submitted: 0,
      approved: 0,
      rejected: 0,
    });
  }
  return out;
}

export const adminDashboard = asyncHandler(async (req, res) => {
  const today = startOfToday();
  const weekAgo = new Date(today.getTime() - 6 * DAY);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  const fourteenDaysAgo = new Date(today.getTime() - 13 * DAY);

  const [
    totalMembers,
    activeMembers,
    suspendedMembers,
    pendingApplications,
    underReview,
    rejectedApplications,
    newToday,
    newThisWeek,
    newThisMonth,
    totalReferrals,
    pointsAgg,
    publishedNews,
    galleryItems,
    newMessages,
    adminCount,
    statusAgg,
    roleAgg,
    recentApplications,
    recentActivity,
    recentMessages,
    growthUsers,
    trendApplications,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ status: "active" }),
    User.countDocuments({ status: "suspended" }),
    Application.countDocuments({ status: "pending" }),
    Application.countDocuments({ status: "under_review" }),
    Application.countDocuments({ status: "rejected" }),
    User.countDocuments({ joinedAt: { $gte: today } }),
    User.countDocuments({ joinedAt: { $gte: weekAgo } }),
    User.countDocuments({ joinedAt: { $gte: monthStart } }),
    Referral.countDocuments({ status: "approved" }),
    User.aggregate([{ $group: { _id: null, total: { $sum: "$points" } } }]),
    News.countDocuments({ status: "published" }),
    GalleryItem.countDocuments({}),
    ContactMessage.countDocuments({ status: "new" }),
    User.countDocuments({ role: "admin", status: "active" }),
    User.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Application.find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .select("firstName lastName email profileImage status referralUsername createdAt")
      .lean(),
    AuditLog.find({}).sort({ createdAt: -1 }).limit(10).lean(),
    ContactMessage.find({}).sort({ createdAt: -1 }).limit(4).lean(),
    User.find({ joinedAt: { $gte: twelveMonthsAgo } })
      .select("joinedAt")
      .lean(),
    Application.find({ createdAt: { $gte: fourteenDaysAgo } })
      .select("createdAt reviewedAt status approvedAt")
      .lean(),
  ]);

  const leaderboard = await buildLeaderboard(5);
  const totalPoints = pointsAgg[0]?.total || 0;

  const months = lastMonths(12);
  const monthMap = new Map(months.map((m) => [m.key, m]));
  growthUsers.forEach((u) => {
    const m = monthMap.get(monthKey(new Date(u.joinedAt)));
    if (m) m.members += 1;
  });

  const days = lastDays(14);
  const dayMap = new Map(days.map((d) => [d.key, d]));
  trendApplications.forEach((app) => {
    const submitted = dayMap.get(new Date(app.createdAt).toISOString().slice(0, 10));
    if (submitted) submitted.submitted += 1;
    if (app.reviewedAt) {
      const decision = dayMap.get(
        new Date(app.reviewedAt).toISOString().slice(0, 10)
      );
      if (decision && app.status === "approved") decision.approved += 1;
      if (decision && app.status === "rejected") decision.rejected += 1;
    }
  });

  res.json({
    success: true,
    generatedAt: new Date(),
    stats: {
      totalMembers,
      activeMembers,
      suspendedMembers,
      pendingApplications,
      underReview,
      rejectedApplications,
      newToday,
      newThisWeek,
      newThisMonth,
      totalReferrals,
      totalPoints,
      publishedNews,
      galleryItems,
      newMessages,
      adminCount,
      approvalRate:
        totalReferrals + pendingApplications > 0
          ? Math.round(
              (totalReferrals /
                (totalReferrals + pendingApplications)) *
                100
            )
          : 0,
    },
    charts: {
      memberGrowth: months,
      applicationTrend: days,
      status: statusAgg.map((s) => ({ name: s._id, value: s.count })),
      roles: roleAgg.map((r) => ({ name: r._id, value: r.count })),
    },
    topReferrers: leaderboard.rows,
    rankingMetric: leaderboard.metric,
    recentApplications,
    recentActivity,
    recentMessages,
  });
});

export const memberDashboard = asyncHandler(async (req, res) => {
  const [refStats, recentReferrals, recentPoints, notifications, ancestors, rankInfo, settings] =
    await Promise.all([
      Referral.aggregate([
        { $match: { referrer: req.user._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Referral.find({ referrer: req.user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("referredMember", "firstName lastName username profileImage joinedAt")
        .populate("application", "firstName lastName profileImage createdAt")
        .lean(),
      PointTransaction.find({ memberId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      getAncestorPath(req.user._id),
      getMemberRank(req.user._id),
      getSettings(),
    ]);

  const stats = { approved: 0, pending: 0, rejected: 0, total: 0 };
  refStats.forEach((s) => {
    stats[s._id] = s.count;
    stats.total += s.count;
  });

  const leaderboard = await buildLeaderboard(0, true);
  const idx = leaderboard.all.findIndex(
    (r) => String(r.id) === String(req.user._id)
  );
  const above = idx > 0 ? leaderboard.all[idx - 1] : null;
  const me = idx >= 0 ? leaderboard.all[idx] : null;
  const nextRank = above
    ? {
        fullName: above.fullName,
        username: above.username,
        difference:
          leaderboard.metric === "points"
            ? Math.max(0, above.points - (me?.points || 0))
            : Math.max(0, above.approvedReferrals - (me?.approvedReferrals || 0)),
        metric: leaderboard.metric,
      }
    : null;

  res.json({
    success: true,
    user: {
      ...req.user.toObject(),
      fullName: `${req.user.firstName} ${req.user.lastName}`,
    },
    stats,
    rankInfo,
    nextRank,
    pointsPerReferral: settings.pointsPerReferral,
    recentReferrals,
    recentPoints,
    notifications,
    ancestors,
    referralLink: `${settings.referralBaseUrl || ""}`.trim()
      ? `${settings.referralBaseUrl}/join?ref=${req.user.username}`
      : `/join?ref=${req.user.username}`,
  });
});

export const founderDashboard = adminDashboard;
