import crypto from "crypto";
import slugifyBase from "../utils/slugifyBase.js";
import User from "../models/User.js";
import Settings from "../models/Settings.js";

export function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizePhone(value = "") {
  return String(value).replace(/[^\d+]/g, "").trim();
}

export function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

export function generateTempPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return `Love-${code}`;
}

export async function generateUsername(firstName, lastName) {
  const base = slugifyBase(`${firstName}.${lastName}`).replace(/-/g, ".") || "member";
  let candidate = base.slice(0, 28);
  let suffix = 1;
  while (await User.exists({ username: candidate })) {
    suffix += 1;
    candidate = `${base.slice(0, 24)}${suffix}`;
  }
  return candidate;
}

export async function generateMemberCode() {
  const settings = (await Settings.findOne({ key: "main" }).lean()) || {};
  const prefix = settings.memberCodePrefix || "LOV";
  const last = await User.findOne({ memberCode: new RegExp(`^${prefix}-`) })
    .sort({ memberCode: -1 })
    .select("memberCode")
    .lean();
  let next = 1;
  if (last?.memberCode) {
    const parsed = Number(last.memberCode.split("-")[1]);
    if (!Number.isNaN(parsed)) next = parsed + 1;
  }
  let code = `${prefix}-${String(next).padStart(4, "0")}`;
  while (await User.exists({ memberCode: code })) {
    next += 1;
    code = `${prefix}-${String(next).padStart(4, "0")}`;
  }
  return code;
}

export async function uniqueSlug(title, Model, currentId = null) {
  const base = slugifyBase(title) || "item";
  let slug = base;
  let suffix = 1;
  while (
    await Model.exists({
      slug,
      ...(currentId ? { _id: { $ne: currentId } } : {}),
    })
  ) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export function parsePagination(query, defaults = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || defaults.limit || 10)
  );
  return { page, limit, skip: (page - 1) * limit };
}

export function dateRange(query = {}, fallbackDays = 7) {
  const now = new Date();
  let to = query.to ? new Date(query.to) : now;
  let from = query.from
    ? new Date(query.from)
    : new Date(to.getTime() - fallbackDays * 24 * 60 * 60 * 1000);

  if (Number.isNaN(from.getTime())) from = new Date(now.getTime() - fallbackDays * 86400000);
  if (Number.isNaN(to.getTime())) to = now;

  to.setHours(23, 59, 59, 999);
  from.setHours(0, 0, 0, 0);
  if (from > to) [from, to] = [to, from];

  return { from, to };
}

export function formatDate(value, options = {}) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  });
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function pick(obj, keys) {
  const out = {};
  for (const key of keys) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}
