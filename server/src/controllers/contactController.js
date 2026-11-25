import ContactMessage from "../models/ContactMessage.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import { escapeRegex, parsePagination } from "../utils/helpers.js";
import { logAudit, notifyAdmins } from "../utils/audit.js";

export const submitContact = asyncHandler(async (req, res) => {
  const message = await ContactMessage.create(req.body);

  await notifyAdmins({
    type: "message",
    title: "New contact message",
    message: `${message.name}: ${message.subject}`,
    link: "/admin/messages",
  });

  await logAudit({
    actor: null,
    actorName: message.name,
    action: "contact.received",
    entityType: "contact",
    entityId: message._id,
    description: `New contact message from ${message.name} (${message.subject}).`,
    ip: req.ip,
  });

  res.status(201).json({
    success: true,
    message: "Thank you for reaching out. We will reply to you as soon as possible.",
  });
});

export const listMessages = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { limit: 10 });
  const { status, search } = req.query;
  const query = {};
  if (status && status !== "all") query.status = status;
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [{ name: regex }, { email: regex }, { subject: regex }, { message: regex }];
  }

  const [items, total, statsAgg] = await Promise.all([
    ContactMessage.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ContactMessage.countDocuments(query),
    ContactMessage.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);
  const stats = { new: 0, read: 0, replied: 0, total: 0 };
  statsAgg.forEach((s) => {
    stats[s._id] = s.count;
    stats.total += s.count;
  });

  res.json({
    success: true,
    items,
    stats,
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
});

export const updateMessageStatus = asyncHandler(async (req, res) => {
  const item = await ContactMessage.findById(req.params.id);
  if (!item) throw new ApiError(404, "Message not found.");
  item.status = req.body.status;
  await item.save();
  res.json({ success: true, message: "Message updated.", item });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!message) throw new ApiError(404, "Message not found.");

  await logAudit({
    actor: req.user,
    action: "contact.deleted",
    entityType: "contact",
    entityId: message._id,
    description: `${req.user.firstName} ${req.user.lastName} deleted a contact message from ${message.name}.`,
    ip: req.ip,
  });

  res.json({ success: true, message: "Message deleted." });
});
