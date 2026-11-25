import Notification from "../models/Notification.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import { parsePagination } from "../utils/helpers.js";

export const myNotifications = asyncHandler(async (req, res) => {
  const { limit } = parsePagination(req.query, { limit: 20 });
  const [items, unread] = await Promise.all([
    Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ success: true, items, unread });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, "Notification not found.");
  res.json({ success: true, notification });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true, message: "All notifications marked as read." });
});
