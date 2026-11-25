import User from "../models/User.js";
import Referral from "../models/Referral.js";
import News from "../models/News.js";
import GalleryItem from "../models/GalleryItem.js";
import { asyncHandler, ApiError } from "../utils/ApiError.js";
import { getSettings } from "../services/settingsService.js";
import { buildMemberTree } from "../services/treeService.js";
import { buildLeaderboard } from "../services/leaderboardService.js";

export const publicStats = asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  const [
    activeMembers,
    approvedReferrals,
    publishedNews,
    galleryItems,
    albums,
    pointsAgg,
  ] = await Promise.all([
    User.countDocuments({ status: "active" }),
    Referral.countDocuments({ status: "approved" }),
    News.countDocuments({ status: "published" }),
    GalleryItem.countDocuments({ status: "published" }),
    GalleryItem.distinct("album", { status: "published" }),
    User.aggregate([{ $group: { _id: null, total: { $sum: "$points" } } }]),
  ]);

  const years = Math.max(1, new Date().getFullYear() - settings.foundedYear);

  res.json({
    success: true,
    stats: {
      members: activeMembers,
      referrals: approvedReferrals,
      news: publishedNews,
      gallery: galleryItems,
      albums: albums.length,
      yearsOfService: years,
      pointsEarned: pointsAgg[0]?.total || 0,
      foundedYear: settings.foundedYear,
    },
  });
});

export const publicMembersTree = asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  if (!settings.allowPublicMembers) {
    throw new ApiError(403, "The public member tree is currently disabled.");
  }
  const tree = await buildMemberTree();
  res.json({ success: true, tree });
});

export const publicTopMembers = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  if (!settings.allowPublicLeaderboard) {
    throw new ApiError(403, "The public leaderboard is currently disabled.");
  }
  const limit = Math.min(50, Number.parseInt(req.query.limit, 10) || 10);
  const leaderboard = await buildLeaderboard(limit);
  res.json({ success: true, ...leaderboard });
});
