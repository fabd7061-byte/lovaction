import Referral from "../models/Referral.js";
import User from "../models/User.js";
import { getSettings } from "./settingsService.js";

const SAFE =
  "firstName lastName username memberCode role profileImage points joinedAt";

/**
 * Builds a leaderboard from approved referrals (primary) or points.
 * Only active accounts are included.
 */
export async function buildLeaderboard(limit = 10, includeZero = false) {
  const settings = await getSettings();
  const users = await User.find({ status: "active" }).select(SAFE).lean();
  const counts = await Referral.aggregate([
    { $match: { status: "approved" } },
    { $group: { _id: "$referrer", approvedReferrals: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.approvedReferrals]));

  const rows = users
    .map((user) => ({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      username: user.username,
      memberCode: user.memberCode,
      role: user.role,
      profileImage: user.profileImage,
      points: user.points || 0,
      joinedAt: user.joinedAt,
      approvedReferrals: countMap.get(String(user._id)) || 0,
    }))
    .filter((u) => includeZero || u.approvedReferrals > 0 || u.points > 0);

  rows.sort((a, b) => {
    if (settings.rankingMetric === "points") {
      return b.points - a.points || b.approvedReferrals - a.approvedReferrals;
    }
    return (
      b.approvedReferrals - a.approvedReferrals ||
      b.points - a.points ||
      new Date(a.joinedAt) - new Date(b.joinedAt)
    );
  });

  rows.forEach((row, index) => {
    row.rank = index + 1;
  });

  return {
    metric: settings.rankingMetric,
    updatedAt: new Date(),
    rows: limit ? rows.slice(0, limit) : rows,
    all: rows,
  };
}

export async function getMemberRank(memberId) {
  const { all } = await buildLeaderboard(0, true);
  const index = all.findIndex((row) => String(row.id) === String(memberId));
  return {
    rank: index >= 0 ? index + 1 : null,
    totalRanked: all.length,
  };
}
