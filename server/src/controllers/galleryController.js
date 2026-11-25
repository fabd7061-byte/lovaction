import GalleryItem from "../models/GalleryItem.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import { parsePagination } from "../utils/helpers.js";
import { logAudit } from "../utils/audit.js";

const ADMIN_ROLES = ["admin", "founder"];
const isAdmin = (req) => req.user && ADMIN_ROLES.includes(req.user.role);

export const listGallery = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { limit: 24 });
  const admin = isAdmin(req) && (req.query.all === "true" || req.query.scope === "admin");
  const { album, status } = req.query;

  const query = {};
  if (admin) {
    if (status && status !== "all") query.status = status;
  } else {
    query.status = "published";
  }
  if (album && album !== "all") query.album = album;

  const [items, total, albumAgg, albums] = await Promise.all([
    GalleryItem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("uploadedBy", "firstName lastName role")
      .lean(),
    GalleryItem.countDocuments(query),
    GalleryItem.aggregate([
      { $match: admin ? {} : { status: "published" } },
      { $group: { _id: "$album", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    GalleryItem.distinct("album", admin ? {} : { status: "published" }),
  ]);

  res.json({
    success: true,
    items,
    albums,
    albumCounts: albumAgg.map((a) => ({ album: a._id, count: a.count })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

export const createGalleryItem = asyncHandler(async (req, res) => {
  const item = await GalleryItem.create({ ...req.body, uploadedBy: req.user._id });

  await logAudit({
    actor: req.user,
    action: "gallery.uploaded",
    entityType: "gallery",
    entityId: item._id,
    description: `${req.user.firstName} ${req.user.lastName} added “${item.title}” to the ${item.album} album.`,
    ip: req.ip,
  });

  res.status(201).json({ success: true, item, message: "Gallery item added." });
});

export const updateGalleryItem = asyncHandler(async (req, res) => {
  const item = await GalleryItem.findById(req.params.id);
  if (!item) throw new ApiError(404, "Gallery item not found.");

  Object.assign(item, req.body);
  await item.save();

  await logAudit({
    actor: req.user,
    action: "gallery.updated",
    entityType: "gallery",
    entityId: item._id,
    description: `${req.user.firstName} ${req.user.lastName} updated the gallery item “${item.title}”.`,
    ip: req.ip,
  });

  res.json({ success: true, item, message: "Gallery item updated." });
});

export const deleteGalleryItem = asyncHandler(async (req, res) => {
  const item = await GalleryItem.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, "Gallery item not found.");

  await logAudit({
    actor: req.user,
    action: "gallery.deleted",
    entityType: "gallery",
    entityId: item._id,
    description: `${req.user.firstName} ${req.user.lastName} removed “${item.title}” from the gallery.`,
    ip: req.ip,
  });

  res.json({ success: true, message: "Gallery item deleted." });
});
