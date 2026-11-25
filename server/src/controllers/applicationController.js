import bcrypt from "bcryptjs";
import Application from "../models/Application.js";
import Referral from "../models/Referral.js";
import User from "../models/User.js";
import PointTransaction from "../models/PointTransaction.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import {
  generateMemberCode,
  generateTempPassword,
  generateUsername,
  normalizeEmail,
  normalizePhone,
  parsePagination,
  escapeRegex,
} from "../utils/helpers.js";
import { logAudit, notifyAdmins, notifyUser } from "../utils/audit.js";
import { getSettings } from "../services/settingsService.js";
import { awardReferralPoints } from "../services/pointsService.js";

async function findReferrer(referralUsername) {
  const value = String(referralUsername || "").trim();
  if (!value) return null;
  return User.findOne({
    $or: [{ username: value.toLowerCase() }, { memberCode: value.toUpperCase() }],
  });
}

export const submitApplication = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  if (!settings.joinEnabled) {
    throw new ApiError(403, "Membership applications are currently closed.");
  }

  const data = req.body;
  const email = normalizeEmail(data.email);
  const phone = normalizePhone(data.phone);

  const referrer = await findReferrer(data.referralUsername);
  if (!referrer) {
    throw new ApiError(
      400,
      "We could not find that referral username. Please check it with the member who invited you."
    );
  }
  if (referrer.status !== "active") {
    throw new ApiError(403, "The inviting member is not currently active. Please contact us for help.");
  }
  if (
    referrer.email === email ||
    normalizePhone(referrer.phone) === phone
  ) {
    throw new ApiError(403, "You cannot refer yourself.");
  }

  const [existingUser, duplicateApplication] = await Promise.all([
    User.findOne({ $or: [{ email }, { phone }] }),
    Application.findOne({
      status: { $in: ["pending", "under_review", "approved"] },
      $or: [{ email }, { phone }],
    }),
  ]);
  if (existingUser) {
    throw new ApiError(
      409,
      "A member account already exists with this email or phone number. Please sign in instead."
    );
  }
  if (duplicateApplication) {
    throw new ApiError(
      409,
      "An application with this email or phone number is already being processed."
    );
  }

  const application = await Application.create({
    ...data,
    email,
    phone,
    referralUsername: referrer.username,
    status: "pending",
  });

  await Referral.create({
    referrer: referrer._id,
    application: application._id,
    status: "pending",
  });

  await logAudit({
    actor: null,
    actorName: `${data.firstName} ${data.lastName}`,
    action: "application.submitted",
    entityType: "application",
    entityId: application._id,
    description: `New membership application submitted by ${data.firstName} ${data.lastName}, invited by ${referrer.username}.`,
    ip: req.ip,
  });

  await notifyAdmins({
    type: "application",
    title: "New membership application",
    message: `${data.firstName} ${data.lastName} applied to join Lovaction Ministries.`,
    link: `/admin/applications/${application._id}`,
  });

  res.status(201).json({
    success: true,
    message:
      "Your application has been received. Our team will review it and contact you soon.",
    application: {
      id: application._id,
      reference: `APP-${String(application._id).slice(-6).toUpperCase()}`,
      status: application.status,
      submittedAt: application.createdAt,
    },
  });
});

export const listApplications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { limit: 10 });
  const { status, search, sort = "newest" } = req.query;

  const query = {};
  if (status && status !== "all") query.status = status;
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { phone: regex },
      { referralUsername: regex },
    ];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name: { firstName: 1 },
  };

  const [items, total, stats] = await Promise.all([
    Application.find(query)
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(limit)
      .populate("reviewedBy", "firstName lastName role")
      .populate("createdMemberId", "firstName lastName username profileImage")
      .lean(),
    Application.countDocuments(query),
    Application.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const statsMap = { pending: 0, under_review: 0, approved: 0, rejected: 0 };
  stats.forEach((s) => {
    statsMap[s._id] = s.count;
  });

  const withReferrer = await Promise.all(
    items.map(async (item) => {
      const referrer = await User.findOne({
        $or: [
          { username: String(item.referralUsername).toLowerCase() },
          { memberCode: String(item.referralUsername).toUpperCase() },
        ],
      })
        .select("firstName lastName username profileImage role status points")
        .lean();
      return { ...item, referrer };
    })
  );

  res.json({
    success: true,
    items: withReferrer,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
    stats: { ...statsMap, total: Object.values(statsMap).reduce((a, b) => a + b, 0) },
  });
});

export const getApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate("reviewedBy", "firstName lastName role profileImage")
    .populate("createdMemberId", "firstName lastName username memberCode profileImage");
  if (!application) throw new ApiError(404, "Application not found.");

  const referrer = await findReferrer(application.referralUsername);
  if (referrer) {
    await referrer.populate("parentMemberId", "firstName lastName username");
  }
  const referral = await Referral.findOne({ application: application._id })
    .populate("referredMember", "firstName lastName username profileImage")
    .lean();

  res.json({
    success: true,
    application,
    referrer: referrer
      ? {
          id: referrer._id,
          firstName: referrer.firstName,
          lastName: referrer.lastName,
          fullName: `${referrer.firstName} ${referrer.lastName}`,
          username: referrer.username,
          memberCode: referrer.memberCode,
          profileImage: referrer.profileImage,
          role: referrer.role,
          status: referrer.status,
          points: referrer.points,
          parent: referrer.parentMemberId,
        }
      : null,
    referral,
  });
});

export const markUnderReview = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found.");
  if (!["pending", "under_review"].includes(application.status)) {
    throw new ApiError(400, "This application has already been processed.");
  }
  application.status = "under_review";
  application.reviewNote = req.body.note || application.reviewNote;
  await application.save();

  await logAudit({
    actor: req.user,
    action: "application.under_review",
    entityType: "application",
    entityId: application._id,
    description: `${req.user.firstName} ${req.user.lastName} started reviewing ${application.firstName} ${application.lastName}'s application.`,
    ip: req.ip,
  });

  res.json({ success: true, application });
});

export const approveApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found.");
  if (!["pending", "under_review"].includes(application.status)) {
    throw new ApiError(400, "This application has already been processed.");
  }

  const referrer = await findReferrer(application.referralUsername);
  if (!referrer) {
    throw new ApiError(400, "The referring member could not be found. Update the referral first.");
  }
  if (referrer.status !== "active") {
    throw new ApiError(400, "The referring member is suspended or inactive. Reassign the referral before approval.");
  }

  const email = normalizeEmail(application.email);
  const phone = normalizePhone(application.phone);
  const duplicate = await User.findOne({ $or: [{ email }, { phone }] });
  if (duplicate) {
    throw new ApiError(409, "An account with this email or phone number already exists.");
  }

  const settings = await getSettings();
  const username = await generateUsername(application.firstName, application.lastName);
  const memberCode = await generateMemberCode();
  const tempPassword = generateTempPassword();
  const password = await bcrypt.hash(tempPassword, 12);

  const member = await User.create({
    firstName: application.firstName,
    lastName: application.lastName,
    username,
    memberCode,
    email,
    phone,
    password,
    role: "member",
    status: "active",
    profileImage: application.profileImage || "",
    location: application.location || "",
    bio: application.message || "",
    parentMemberId: referrer._id,
    points: 0,
    joinedAt: new Date(),
    mustChangePassword: true,
  });

  application.status = "approved";
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  application.createdMemberId = member._id;
  application.reviewNote = req.body.note || application.reviewNote;
  await application.save();

  let referral = await Referral.findOne({ application: application._id });
  if (!referral) {
    referral = new Referral({ referrer: referrer._id, application: application._id });
  }
  referral.referredMember = member._id;
  referral.status = "approved";
  referral.approvedAt = new Date();

  const awarded = await awardReferralPoints({
    referrerId: referrer._id,
    referredUser: member,
    points: settings.pointsPerReferral,
    actorId: req.user._id,
  });
  referral.pointsAwarded = awarded;
  await referral.save();

  application.pointsAwarded = awarded;
  await application.save();

  await logAudit({
    actor: req.user,
    action: "application.approved",
    entityType: "application",
    entityId: application._id,
    description: `${req.user.firstName} ${req.user.lastName} approved ${member.firstName} ${member.lastName}'s application. ${awarded} points awarded to ${referrer.username}.`,
    meta: { memberId: member._id, referrerId: referrer._id, points: awarded },
    ip: req.ip,
  });

  await notifyAdmins({
    type: "application",
    title: "Application approved",
    message: `${member.firstName} ${member.lastName} was approved and added to the community.`,
    link: "/admin/applications",
  });

  res.json({
    success: true,
    message: `${member.firstName} ${member.lastName} is now an active member.`,
    member: {
      id: member._id,
      firstName: member.firstName,
      lastName: member.lastName,
      username: member.username,
      memberCode: member.memberCode,
      email: member.email,
    },
    credentials: {
      email: member.email,
      username: member.username,
      memberCode: member.memberCode,
      tempPassword,
    },
    pointsAwarded: awarded,
  });
});

export const rejectApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found.");
  if (!["pending", "under_review"].includes(application.status)) {
    throw new ApiError(400, "This application has already been processed.");
  }

  application.status = "rejected";
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  application.rejectionReason = req.body.reason;
  await application.save();

  await Referral.updateOne(
    { application: application._id },
    { status: "rejected" }
  );

  await logAudit({
    actor: req.user,
    action: "application.rejected",
    entityType: "application",
    entityId: application._id,
    description: `${req.user.firstName} ${req.user.lastName} rejected ${application.firstName} ${application.lastName}'s application. Reason: ${req.body.reason}`,
    ip: req.ip,
  });

  res.json({ success: true, message: "Application rejected.", application });
});

export const applicationStats = asyncHandler(async (_req, res) => {
  const agg = await Application.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const stats = { pending: 0, under_review: 0, approved: 0, rejected: 0 };
  agg.forEach((row) => {
    stats[row._id] = row.count;
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  stats.today = await Application.countDocuments({ createdAt: { $gte: today } });
  stats.total = Object.entries(stats)
    .filter(([key]) => key !== "today" && key !== "total")
    .reduce((sum, [, value]) => sum + value, 0);
  res.json({ success: true, stats });
});

// Used only by seed data to create historical approved applications.
export async function seedApprovedApplication({ userId, referrerId, pointsAwarded }) {
  const user = await User.findById(userId);
  if (!user) return null;
  const application = await Application.create({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    reasonForJoining:
      "I want to join Lovaction Ministries to serve children and families in my community.",
    referralUsername: referrerId ? (await User.findById(referrerId))?.username : "founder.lovaction",
    profileImage: user.profileImage,
    status: "approved",
    reviewedAt: user.joinedAt,
    pointsAwarded,
    createdMemberId: user._id,
  });
  return application;
}

export { PointTransaction };
