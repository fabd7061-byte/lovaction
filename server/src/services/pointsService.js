import PointTransaction from "../models/PointTransaction.js";
import User from "../models/User.js";
import { notifyUser } from "../utils/audit.js";
import { getSettings } from "./settingsService.js";

export async function awardReferralPoints({
  referrerId,
  referredUser,
  points,
  actorId = null,
  description,
}) {
  const settings = await getSettings();
  const amount = Number.isFinite(points) ? points : settings.pointsPerReferral;
  if (amount <= 0) return 0;

  const updated = await User.findByIdAndUpdate(
    referrerId,
    { $inc: { points: amount } },
    { new: true }
  );
  if (!updated) return 0;

  await PointTransaction.create({
    memberId: referrerId,
    type: "referral",
    points: amount,
    description:
      description ||
      `New member approved: ${referredUser.firstName} ${referredUser.lastName}`,
    relatedMemberId: referredUser._id,
    createdBy: actorId,
    balanceAfter: updated.points,
  });

  await notifyUser(referrerId, {
    type: "points",
    title: "Referral approved",
    message: `${referredUser.firstName} ${referredUser.lastName} joined through your invitation. +${amount} points awarded.`,
    link: "/dashboard/referrals",
  });

  return amount;
}

export async function adjustPoints({
  memberId,
  points,
  type,
  description,
  actor,
}) {
  const member = await User.findById(memberId);
  if (!member) return null;
  if (member.points + points < 0) {
    const err = new Error("Adjustment would make the member's points negative.");
    err.statusCode = 400;
    throw err;
  }

  member.points += points;
  await member.save();

  const tx = await PointTransaction.create({
    memberId,
    type,
    points,
    description,
    createdBy: actor?._id || null,
    balanceAfter: member.points,
  });

  await notifyUser(memberId, {
    type: "points",
    title: points >= 0 ? "Points added" : "Points adjusted",
    message: `${points >= 0 ? "+" : ""}${points} points — ${description}`,
    link: "/dashboard/points",
  });

  return { transaction: tx, member };
}

export async function getPointsSummary(memberId) {
  const [member, transactions] = await Promise.all([
    User.findById(memberId).select("points firstName lastName").lean(),
    PointTransaction.find({ memberId })
      .sort({ createdAt: -1 })
      .populate("relatedMemberId", "firstName lastName username profileImage")
      .populate("createdBy", "firstName lastName role")
      .lean(),
  ]);
  const earned = transactions
    .filter((t) => t.points > 0)
    .reduce((sum, t) => sum + t.points, 0);
  const deducted = transactions
    .filter((t) => t.points < 0)
    .reduce((sum, t) => sum + Math.abs(t.points), 0);

  return {
    balance: member?.points || 0,
    earned,
    deducted,
    transactions,
  };
}
