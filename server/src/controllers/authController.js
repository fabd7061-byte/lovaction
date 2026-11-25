import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import { logAudit } from "../utils/audit.js";
import { getSettings, publicSettings } from "../services/settingsService.js";

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function safeUser(user) {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  return {
    ...obj,
    id: String(obj._id),
    fullName: `${obj.firstName} ${obj.lastName}`,
  };
}

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const cleaned = identifier.trim();

  const user = await User.findOne({
    $or: [
      { email: cleaned.toLowerCase() },
      { username: cleaned.toLowerCase() },
      { memberCode: cleaned.toUpperCase() },
    ],
  }).select("+password");

  if (!user) throw new ApiError(401, "Incorrect credentials. Please try again.");

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) throw new ApiError(401, "Incorrect credentials. Please try again.");

  if (user.status === "suspended") {
    throw new ApiError(
      403,
      "This account is suspended. Please contact the Lovaction administration."
    );
  }
  if (user.status === "inactive") {
    throw new ApiError(403, "This account is inactive. Please contact an administrator.");
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  await logAudit({
    actor: user,
    action: "auth.login",
    entityType: "user",
    entityId: user._id,
    description: `${user.firstName} ${user.lastName} signed in.`,
    ip: req.ip,
  });

  const populated = await User.findById(user._id).populate(
    "parentMemberId",
    "firstName lastName username profileImage role"
  );

  res.json({
    success: true,
    token: signToken(user),
    user: safeUser(populated),
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "parentMemberId",
    "firstName lastName username profileImage role"
  );
  const settings = await getSettings();
  res.json({ success: true, user: safeUser(user), settings: publicSettings(settings) });
});

export const logout = asyncHandler(async (req, res) => {
  await logAudit({
    actor: req.user,
    action: "auth.logout",
    entityType: "user",
    entityId: req.user._id,
    description: `${req.user.firstName} ${req.user.lastName} signed out.`,
    ip: req.ip,
  });
  res.json({ success: true, message: "Signed out." });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");
  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) throw new ApiError(400, "Your current password is incorrect.");
  if (currentPassword === newPassword) {
    throw new ApiError(400, "Please choose a password different from your current one.");
  }

  user.password = await bcrypt.hash(newPassword, 12);
  user.mustChangePassword = false;
  await user.save({ validateBeforeSave: false });

  await logAudit({
    actor: user,
    action: "auth.password_changed",
    entityType: "user",
    entityId: user._id,
    description: `${user.firstName} ${user.lastName} changed their password.`,
    ip: req.ip,
  });

  res.json({ success: true, message: "Password updated successfully." });
});

export const register = asyncHandler(async (_req, _res) => {
  throw new ApiError(
    403,
    "Accounts are created after an application is approved. Please use the Join form to apply."
  );
});
