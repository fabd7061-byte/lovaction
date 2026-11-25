import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

function extractToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return null;
}

export async function protect(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw new ApiError(401, "Authentication required.");

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      throw new ApiError(401, "Your session is invalid or has expired.");
    }

    const user = await User.findById(payload.sub);
    if (!user) throw new ApiError(401, "Account no longer exists.");
    if (user.status === "suspended") {
      throw new ApiError(403, "This account is suspended. Please contact an administrator.");
    }
    if (user.status === "inactive") {
      throw new ApiError(403, "This account is inactive. Please contact an administrator.");
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) return next();
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub);
    if (user && user.status === "active") req.user = user;
  } catch {
    // Public request with an invalid token — continue as guest.
  }
  next();
}

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, "Authentication required."));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action."));
    }
    next();
  };
}

export const adminOnly = authorize("admin", "founder");
export const founderOnly = authorize("founder");
