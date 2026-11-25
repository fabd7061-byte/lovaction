import AuditLog from "../models/AuditLog.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

export async function logAudit({
  actor = null,
  actorName,
  action,
  entityType = "",
  entityId = "",
  description,
  meta = {},
  ip = "",
}) {
  try {
    const name =
      actorName || (actor ? `${actor.firstName} ${actor.lastName}` : "System");
    await AuditLog.create({
      actor: actor?._id || null,
      actorName: name,
      action,
      entityType,
      entityId: String(entityId || ""),
      description,
      meta,
      ip,
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
}

export async function notifyUser(userId, { type = "system", title, message, link = "" }) {
  if (!userId) return;
  try {
    await Notification.create({ user: userId, type, title, message, link });
  } catch (err) {
    console.error("Notification failed:", err.message);
  }
}

export async function notifyAdmins({ type = "system", title, message, link = "" }) {
  try {
    const admins = await User.find({
      role: { $in: ["admin", "founder"] },
      status: "active",
    }).select("_id");
    if (!admins.length) return;
    await Notification.insertMany(
      admins.map((admin) => ({
        user: admin._id,
        type,
        title,
        message,
        link,
      }))
    );
  } catch (err) {
    console.error("Admin notification failed:", err.message);
  }
}
