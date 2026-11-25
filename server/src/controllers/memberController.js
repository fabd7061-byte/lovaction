import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Referral from "../models/Referral.js";
import PointTransaction from "../models/PointTransaction.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import {
  escapeRegex,
  generateTempPassword,
  normalizeEmail,
  normalizePhone,
  parsePagination,
} from "../utils/helpers.js";
import { logAudit, notifyUser } from "../utils/audit.js";
import { buildSubtree, getAncestorPath } from "../services/treeService.js";

const PUBLIC_FIELDS =
  "firstName lastName username memberCode role profileImage joinedAt parentMemberId points status email phone location bio createdAt lastLoginAt mustChangePassword";

async function assertCanManage(actor, target) {
  if (actor.role === "founder") return;
  if (target.role !== "member") {
    throw new ApiError(403, "Only the Founder can manage administrators.");
  }
}

async function assertNotDescendant(memberId, newParentId) {
  let cursor = await User.findById(newParentId).select("parentMemberId username");
  const seen = new Set();
  while (cursor) {
    if (String(cursor._id) === String(memberId)) {
      throw new ApiError(
        400,
        "This change would create a loop in the member tree. Choose a different upline."
      );
    }
    if (!cursor.parentMemberId || seen.has(String(cursor._id))) break;
    seen.add(String(cursor._id));
    cursor = await User.findById(cursor.parentMemberId).select("parentMemberId");
  }
}

export const listMembers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { limit: 10 });
  const { search, role, status, sort = "newest" } = req.query;

  const query = {};
  if (role && role !== "all") query.role = role;
  if (status && status !== "all") query.status = status;
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [
      { firstName: regex },
      { lastName: regex },
      { username: regex },
      { memberCode: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  const sortMap = {
    newest: { joinedAt: -1 },
    oldest: { joinedAt: 1 },
    name: { firstName: 1, lastName: 1 },
    points: { points: -1 },
  };

  const [items, total, stats] = await Promise.all([
    User.find(query)
      .select(PUBLIC_FIELDS)
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(limit)
      .populate("parentMemberId", "firstName lastName username profileImage")
      .lean(),
    User.countDocuments(query),
    User.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const ids = items.map((m) => m._id);
  const counts = await Referral.aggregate([
    { $match: { referrer: { $in: ids }, status: "approved" } },
    { $group: { _id: "$referrer", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  const st = { active: 0, suspended: 0, inactive: 0 };
  stats.forEach((s) => {
    st[s._id] = s.count;
  });

  res.json({
    success: true,
    items: items.map((m) => ({
      ...m,
      id: String(m._id),
      fullName: `${m.firstName} ${m.lastName}`,
      referralsCount: countMap.get(String(m._id)) || 0,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
    stats: { ...st, total: Object.values(st).reduce((a, b) => a + b, 0) },
  });
});

export const getMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isAdmin = ["admin", "founder"].includes(req.user.role);
  if (!isAdmin && String(req.user._id) !== String(id)) {
    throw new ApiError(403, "You can only view your own profile.");
  }

  const member = await User.findById(id)
    .select(PUBLIC_FIELDS)
    .populate("parentMemberId", "firstName lastName username profileImage role memberCode");
  if (!member) throw new ApiError(404, "Member not found.");

  const [referrals, counts, recentPoints, childrenCount] = await Promise.all([
    Referral.find({ referrer: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("referredMember", "firstName lastName username profileImage role joinedAt")
      .populate("application", "firstName lastName status createdAt profileImage")
      .lean(),
    Referral.aggregate([
      { $match: { referrer: member._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    PointTransaction.find({ memberId: id }).sort({ createdAt: -1 }).limit(5).lean(),
    User.countDocuments({ parentMemberId: id }),
  ]);

  const referralStats = { approved: 0, pending: 0, rejected: 0, total: 0 };
  counts.forEach((c) => {
    referralStats[c._id] = c.count;
    referralStats.total += c.count;
  });

  res.json({
    success: true,
    member: {
      ...member.toObject(),
      id: String(member._id),
      fullName: `${member.firstName} ${member.lastName}`,
    },
    referralStats,
    referrals,
    recentPoints,
    childrenCount,
  });
});

export const updateMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isAdmin = ["admin", "founder"].includes(req.user.role);
  if (!isAdmin && String(req.user._id) !== String(id)) {
    throw new ApiError(403, "You can only edit your own profile.");
  }

  const member = await User.findById(id);
  if (!member) throw new ApiError(404, "Member not found.");

  const payload = { ...req.body };
  const allowedSelf = ["firstName", "lastName", "phone", "location", "bio", "profileImage"];
  const adminOnly = ["email", "parentMemberId"];

  if (!isAdmin) {
    for (const key of adminOnly) {
      if (payload[key] !== undefined) {
        if (key === "email" && normalizeEmail(payload.email) === member.email) {
          delete payload.email;
          continue;
        }
        throw new ApiError(403, `You are not allowed to change your ${key}.`);
      }
    }
    for (const key of Object.keys(payload)) {
      if (!allowedSelf.includes(key)) delete payload[key];
    }
  }

  if (payload.email) payload.email = normalizeEmail(payload.email);
  if (payload.phone) payload.phone = normalizePhone(payload.phone);

  if (payload.email || payload.phone) {
    const or = [];
    if (payload.email) or.push({ email: payload.email });
    if (payload.phone) or.push({ phone: payload.phone });
    const duplicate = await User.findOne({ _id: { $ne: member._id }, $or: or });
    if (duplicate) {
      throw new ApiError(409, "Another member already uses this email or phone number.");
    }
  }

  if (payload.parentMemberId !== undefined) {
    if (payload.parentMemberId) {
      if (String(payload.parentMemberId) === String(member._id)) {
        throw new ApiError(400, "A member cannot be their own upline.");
      }
      const parent = await User.findById(payload.parentMemberId);
      if (!parent || parent.status !== "active") {
        throw new ApiError(400, "The selected upline member is not active.");
      }
      await assertNotDescendant(member._id, payload.parentMemberId);
      payload.parentMemberId = parent._id;
    } else {
      payload.parentMemberId = null;
    }
  }

  const changed = [];
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    const old = key === "parentMemberId" ? member[key] : member[key];
    if (String(old ?? "") !== String(value ?? "")) {
      changed.push(key);
      member[key] = value;
    }
  }
  await member.save();

  if (payload.parentMemberId !== undefined) {
    await Referral.updateMany(
      { referredMember: member._id, status: "approved" },
      { referrer: payload.parentMemberId }
    );
  }

  await logAudit({
    actor: req.user,
    action: "member.updated",
    entityType: "member",
    entityId: member._id,
    description: `${req.user.firstName} ${req.user.lastName} updated ${member.firstName} ${member.lastName}'s profile (${changed.join(", ") || "no field changes"}).`,
    meta: { fields: changed },
    ip: req.ip,
  });

  if (isAdmin && String(req.user._id) !== String(member._id)) {
    await notifyUser(member._id, {
      type: "member",
      title: "Profile updated",
      message: "An administrator updated your member profile.",
      link: "/dashboard/profile",
    });
  }

  res.json({
    success: true,
    message: "Profile updated successfully.",
    member: {
      ...member.toObject(),
      id: String(member._id),
      fullName: `${member.firstName} ${member.lastName}`,
    },
  });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const member = await User.findById(id);
  if (!member) throw new ApiError(404, "Member not found.");

  if (member.role === "founder") {
    throw new ApiError(400, "The Founder account cannot be suspended or deactivated.");
  }
  if (String(member._id) === String(req.user._id)) {
    throw new ApiError(400, "You cannot change your own account status.");
  }
  await assertCanManage(req.user, member);

  if (member.status === status) {
    return res.json({ success: true, message: `Account is already ${status}.`, member });
  }

  member.status = status;
  await member.save({ validateBeforeSave: false });

  await logAudit({
    actor: req.user,
    action: `member.${status === "active" ? "activated" : status}`,
    entityType: "member",
    entityId: member._id,
    description: `${req.user.firstName} ${req.user.lastName} set ${member.firstName} ${member.lastName}'s status to ${status}.${reason ? ` Reason: ${reason}` : ""}`,
    meta: { status, reason },
    ip: req.ip,
  });

  await notifyUser(member._id, {
    type: "member",
    title:
      status === "active"
        ? "Your account is active"
        : status === "suspended"
          ? "Your account has been suspended"
          : "Your account is now inactive",
    message:
      status === "active"
        ? "Welcome back. You can now sign in and invite new members."
        : `Your account status changed to ${status}.${reason ? ` Reason: ${reason}` : " Please contact the administration."}`,
    link: "/dashboard",
  });

  res.json({ success: true, message: `Member status updated to ${status}.`, member });
});

export const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const member = await User.findById(id);
  if (!member) throw new ApiError(404, "Member not found.");
  if (member.role === "founder") {
    throw new ApiError(400, "The Founder's role cannot be changed.");
  }
  if (String(member._id) === String(req.user._id)) {
    throw new ApiError(400, "You cannot change your own role.");
  }
  if (member.role === role) {
    return res.json({ success: true, message: "Role is already set.", member });
  }

  const previous = member.role;
  member.role = role;
  await member.save({ validateBeforeSave: false });

  await logAudit({
    actor: req.user,
    action: "member.role_changed",
    entityType: "member",
    entityId: member._id,
    description: `${req.user.firstName} ${req.user.lastName} changed ${member.firstName} ${member.lastName}'s role from ${previous} to ${role}.`,
    meta: { previous, role },
    ip: req.ip,
  });

  await notifyUser(member._id, {
    type: "member",
    title: "Your role changed",
    message:
      role === "admin"
        ? "You have been appointed as an administrator. You now have access to the admin dashboard."
        : "Your role changed to member. Please contact the Founder if you have questions.",
    link: "/dashboard",
  });

  res.json({ success: true, message: `Member role updated to ${role}.`, member });
});

export const resetMemberPassword = asyncHandler(async (req, res) => {
  const member = await User.findById(req.params.id);
  if (!member) throw new ApiError(404, "Member not found.");
  if (["admin", "founder"].includes(member.role) && req.user.role !== "founder") {
    throw new ApiError(403, "Only the Founder can reset an administrator's password.");
  }

  const tempPassword = generateTempPassword();
  member.password = await bcrypt.hash(tempPassword, 12);
  member.mustChangePassword = true;
  await member.save({ validateBeforeSave: false });

  await logAudit({
    actor: req.user,
    action: "member.password_reset",
    entityType: "member",
    entityId: member._id,
    description: `${req.user.firstName} ${req.user.lastName} reset ${member.firstName} ${member.lastName}'s password.`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: "A temporary password has been generated. Share it privately with the member.",
    credentials: { username: member.username, tempPassword },
  });
});

export const memberTree = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isAdmin = ["admin", "founder"].includes(req.user.role);
  if (!isAdmin && String(req.user._id) !== String(id)) {
    throw new ApiError(403, "You can only view your own position in the tree.");
  }

  const [subtree, ancestors] = await Promise.all([
    buildSubtree(id),
    getAncestorPath(id),
  ]);
  if (!subtree) throw new ApiError(404, "Member tree not found.");

  res.json({ success: true, subtree, ancestors });
});

export const memberReferrals = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isAdmin = ["admin", "founder"].includes(req.user.role);
  if (!isAdmin && String(req.user._id) !== String(id)) {
    throw new ApiError(403, "You can only view your own referrals.");
  }

  const referrals = await Referral.find({ referrer: id })
    .sort({ createdAt: -1 })
    .populate("referredMember", "firstName lastName username profileImage role joinedAt status")
    .populate("application", "firstName lastName profileImage status createdAt")
    .lean();

  const stats = { total: referrals.length, approved: 0, pending: 0, rejected: 0 };
  referrals.forEach((r) => {
    stats[r.status] = (stats[r.status] || 0) + 1;
  });

  res.json({ success: true, referrals, stats });
});
