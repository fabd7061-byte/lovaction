import User from "../models/User.js";
import Application from "../models/Application.js";
import Referral from "../models/Referral.js";
import PointTransaction from "../models/PointTransaction.js";
import News from "../models/News.js";
import GalleryItem from "../models/GalleryItem.js";
import AuditLog from "../models/AuditLog.js";
import { formatDate, formatDateTime } from "../utils/helpers.js";
import { getSettings } from "../services/settingsService.js";

const MAX_ROWS = 500;

function stats(title, entries) {
  return { type: "stats", title, stats: entries };
}

function table(title, columns, rows, weights) {
  return { type: "table", title, columns, weights, rows: rows.slice(0, MAX_ROWS) };
}

function rangeLabel(from, to) {
  const f = formatDate(from);
  const t = formatDate(to);
  return f === t ? f : `${f} — ${t}`;
}

async function buildActivityReport(type, from, to, actor) {
  const [
    newApplications,
    approvedApplications,
    rejectedApplications,
    pendingApplications,
    newMembers,
    newReferrals,
    pointsAwardedAgg,
    topRefsAgg,
    newsPublished,
    galleryUploads,
    suspended,
    activated,
    recentAdmin,
  ] = await Promise.all([
    Application.countDocuments({ createdAt: { $gte: from, $lte: to } }),
    Application.countDocuments({
      status: "approved",
      reviewedAt: { $gte: from, $lte: to },
    }),
    Application.countDocuments({
      status: "rejected",
      reviewedAt: { $gte: from, $lte: to },
    }),
    Application.countDocuments({ status: { $in: ["pending", "under_review"] } }),
    User.countDocuments({ joinedAt: { $gte: from, $lte: to }, role: { $ne: "founder" } }),
    Referral.countDocuments({ createdAt: { $gte: from, $lte: to } }),
    PointTransaction.aggregate([
      {
        $match: {
          points: { $gt: 0 },
          createdAt: { $gte: from, $lte: to },
          type: { $in: ["referral", "bonus"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$points" } } },
    ]),
    Referral.aggregate([
      { $match: { status: "approved", approvedAt: { $gte: from, $lte: to } } },
      { $group: { _id: "$referrer", count: { $sum: 1 }, points: { $sum: "$pointsAwarded" } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    ]),
    News.countDocuments({ status: "published", publishedAt: { $gte: from, $lte: to } }),
    GalleryItem.countDocuments({ createdAt: { $gte: from, $lte: to } }),
    AuditLog.countDocuments({
      action: "member.suspended",
      createdAt: { $gte: from, $lte: to },
    }),
    AuditLog.countDocuments({
      action: { $in: ["member.activated", "member.active"] },
      createdAt: { $gte: from, $lte: to },
    }),
    AuditLog.find({ createdAt: { $gte: from, $lte: to } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  const pointsAwarded = pointsAwardedAgg[0]?.total || 0;
  const labels = {
    daily: "Daily Activity Report",
    weekly: "Weekly Activity Report",
    monthly: "Monthly Activity Report",
  };

  return {
    key: type,
    title: labels[type] || "Activity Report",
    periodLabel: rangeLabel(from, to),
    generatedAt: new Date(),
    generatedBy: actor ? `${actor.firstName} ${actor.lastName}` : "Lovaction Admin",
    sections: [
      stats("Membership", [
        { label: "New Applications", value: newApplications },
        { label: "Approved", value: approvedApplications },
        { label: "Rejected", value: rejectedApplications },
        { label: "Pending (current)", value: pendingApplications },
        { label: "New Active Members", value: newMembers },
      ]),
      stats("Referral Activity", [
        { label: "New Referrals", value: newReferrals },
        { label: "Points Awarded", value: pointsAwarded.toLocaleString() },
      ]),
      table(
        "Top Referrers",
        ["#", "Member", "Username", "Approved Referrals", "Points"],
        topRefsAgg.map((r, i) => [
          `${i + 1}`,
          r.user ? `${r.user.firstName} ${r.user.lastName}` : "Unknown member",
          r.user?.username || "—",
          `${r.count}`,
          `${r.points || 0}`,
        ]),
        [0.5, 2.2, 1.6, 1.3, 1]
      ),
      stats("Content", [
        { label: "News Published", value: newsPublished },
        { label: "Gallery Uploads", value: galleryUploads },
      ]),
      stats("Administration", [
        { label: "Members Suspended", value: suspended },
        { label: "Members Activated", value: activated },
      ]),
      table(
        "Recent Administrative Actions",
        ["Date", "Action", "Description"],
        recentAdmin.map((a) => [
          formatDateTime(a.createdAt),
          a.action,
          a.description,
        ]),
        [1.2, 1.3, 4]
      ),
    ],
  };
}

async function buildMembershipReport(from, to, actor) {
  const users = await User.find({ joinedAt: { $gte: from, $lte: to } })
    .sort({ joinedAt: -1 })
    .select("firstName lastName username memberCode email phone role status points joinedAt parentMemberId")
    .populate("parentMemberId", "firstName lastName username")
    .lean();
  const counts = await Referral.aggregate([
    { $match: { status: "approved" } },
    { $group: { _id: "$referrer", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  const active = users.filter((u) => u.status === "active").length;

  return {
    key: "membership",
    title: "Membership Report",
    periodLabel: rangeLabel(from, to),
    generatedAt: new Date(),
    generatedBy: actor ? `${actor.firstName} ${actor.lastName}` : "Lovaction Admin",
    sections: [
      stats("Overview", [
        { label: "Members in Period", value: users.length },
        { label: "Active", value: active },
        { label: "Suspended", value: users.filter((u) => u.status === "suspended").length },
        { label: "Total Points Held", value: users.reduce((s, u) => s + (u.points || 0), 0).toLocaleString() },
      ]),
      table(
        "Member Directory",
        ["Member", "Username", "Code", "Role", "Status", "Invited By", "Referrals", "Points", "Joined"],
        users.map((u) => [
          `${u.firstName} ${u.lastName}`,
          u.username,
          u.memberCode,
          u.role,
          u.status,
          u.parentMemberId
            ? `${u.parentMemberId.firstName} ${u.parentMemberId.lastName}`
            : "—",
          `${countMap.get(String(u._id)) || 0}`,
          `${u.points || 0}`,
          formatDate(u.joinedAt),
        ]),
        [1.8, 1.4, 0.9, 0.7, 0.8, 1.4, 0.7, 0.6, 0.9]
      ),
    ],
  };
}

async function buildReferralReport(from, to, actor) {
  const referrals = await Referral.find({ createdAt: { $gte: from, $lte: to } })
    .sort({ createdAt: -1 })
    .populate("referrer", "firstName lastName username")
    .populate("referredMember", "firstName lastName username")
    .populate("application", "firstName lastName status")
    .lean();

  const approved = referrals.filter((r) => r.status === "approved").length;
  const awarded = referrals.reduce((s, r) => s + (r.pointsAwarded || 0), 0);

  return {
    key: "referrals",
    title: "Referral Report",
    periodLabel: rangeLabel(from, to),
    generatedAt: new Date(),
    generatedBy: actor ? `${actor.firstName} ${actor.lastName}` : "Lovaction Admin",
    sections: [
      stats("Referral Overview", [
        { label: "Referrals Submitted", value: referrals.length },
        { label: "Approved", value: approved },
        { label: "Pending", value: referrals.filter((r) => r.status === "pending").length },
        { label: "Rejected", value: referrals.filter((r) => r.status === "rejected").length },
        { label: "Points Awarded", value: awarded.toLocaleString() },
      ]),
      table(
        "Referral Records",
        ["Date", "Referrer", "Referred Person", "Status", "Points"],
        referrals.map((r) => [
          formatDate(r.createdAt),
          r.referrer ? `${r.referrer.firstName} ${r.referrer.lastName} (${r.referrer.username})` : "—",
          r.referredMember
            ? `${r.referredMember.firstName} ${r.referredMember.lastName}`
            : r.application
              ? `${r.application.firstName} ${r.application.lastName} (applicant)`
              : "—",
          r.status,
          `${r.pointsAwarded || 0}`,
        ]),
        [1, 2.4, 2.2, 1, 0.8]
      ),
    ],
  };
}

async function buildPointsReport(from, to, actor) {
  const transactions = await PointTransaction.find({
    createdAt: { $gte: from, $lte: to },
  })
    .sort({ createdAt: -1 })
    .populate("memberId", "firstName lastName username")
    .populate("createdBy", "firstName lastName")
    .lean();

  const awarded = transactions.filter((t) => t.points > 0).reduce((s, t) => s + t.points, 0);
  const deducted = transactions.filter((t) => t.points < 0).reduce((s, t) => s + Math.abs(t.points), 0);

  return {
    key: "points",
    title: "Points Report",
    periodLabel: rangeLabel(from, to),
    generatedAt: new Date(),
    generatedBy: actor ? `${actor.firstName} ${actor.lastName}` : "Lovaction Admin",
    sections: [
      stats("Points Overview", [
        { label: "Transactions", value: transactions.length },
        { label: "Points Awarded", value: awarded.toLocaleString() },
        { label: "Points Deducted", value: deducted.toLocaleString() },
        { label: "Net Movement", value: (awarded - deducted).toLocaleString() },
      ]),
      table(
        "Points Ledger",
        ["Date", "Member", "Type", "Points", "Balance", "Description"],
        transactions.map((t) => [
          formatDate(t.createdAt),
          t.memberId ? `${t.memberId.firstName} ${t.memberId.lastName}` : "—",
          t.type,
          `${t.points > 0 ? "+" : ""}${t.points}`,
          `${t.balanceAfter || 0}`,
          t.description,
        ]),
        [0.9, 1.6, 1.1, 0.6, 0.7, 3]
      ),
    ],
  };
}

async function buildApplicationReport(from, to, actor) {
  const applications = await Application.find({
    createdAt: { $gte: from, $lte: to },
  })
    .sort({ createdAt: -1 })
    .lean();

  return {
    key: "applications",
    title: "Membership Application Report",
    periodLabel: rangeLabel(from, to),
    generatedAt: new Date(),
    generatedBy: actor ? `${actor.firstName} ${actor.lastName}` : "Lovaction Admin",
    sections: [
      stats("Application Overview", [
        { label: "Applications", value: applications.length },
        { label: "Approved", value: applications.filter((a) => a.status === "approved").length },
        { label: "Rejected", value: applications.filter((a) => a.status === "rejected").length },
        {
          label: "Pending / In Review",
          value: applications.filter((a) => ["pending", "under_review"].includes(a.status)).length,
        },
      ]),
      table(
        "Applications",
        ["Date", "Applicant", "Email", "Phone", "Referrer", "Status"],
        applications.map((a) => [
          formatDate(a.createdAt),
          `${a.firstName} ${a.lastName}`,
          a.email,
          a.phone,
          a.referralUsername,
          a.status,
        ]),
        [0.9, 1.6, 2, 1.2, 1.5, 1]
      ),
    ],
  };
}

async function buildActivityLogReport(from, to, actor) {
  const logs = await AuditLog.find({ createdAt: { $gte: from, $lte: to } })
    .sort({ createdAt: -1 })
    .limit(MAX_ROWS)
    .lean();

  return {
    key: "activity",
    title: "Member Activity & Audit Report",
    periodLabel: rangeLabel(from, to),
    generatedAt: new Date(),
    generatedBy: actor ? `${actor.firstName} ${actor.lastName}` : "Lovaction Admin",
    sections: [
      stats("Activity Overview", [
        { label: "Recorded Actions", value: logs.length },
        { label: "Distinct Actors", value: new Set(logs.map((l) => l.actorName)).size },
        { label: "Distinct Activity Types", value: new Set(logs.map((l) => l.action)).size },
      ]),
      table(
        "Audit Trail",
        ["Date", "Actor", "Action", "Description"],
        logs.map((l) => [formatDateTime(l.createdAt), l.actorName || "System", l.action, l.description]),
        [1.2, 1.4, 1.4, 4]
      ),
    ],
  };
}

export async function buildReport(type, from, to, actor) {
  switch (type) {
    case "daily":
    case "weekly":
    case "monthly":
      return buildActivityReport(type, from, to, actor);
    case "membership":
      return buildMembershipReport(from, to, actor);
    case "referrals":
      return buildReferralReport(from, to, actor);
    case "points":
      return buildPointsReport(from, to, actor);
    case "applications":
      return buildApplicationReport(from, to, actor);
    case "activity":
      return buildActivityLogReport(from, to, actor);
    default:
      throw Object.assign(new Error("Unknown report type."), { statusCode: 400 });
  }
}

export { rangeLabel };
