import News from "../models/News.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
import { escapeRegex, parsePagination, uniqueSlug } from "../utils/helpers.js";
import { logAudit } from "../utils/audit.js";

const ADMIN_ROLES = ["admin", "founder"];

function isAdmin(req) {
  return req.user && ADMIN_ROLES.includes(req.user.role);
}

export const listNews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { limit: 9 });
  const { search, category, status, sort = "newest" } = req.query;
  const admin = isAdmin(req) && (req.query.all === "true" || req.query.scope === "admin");

  const query = {};
  if (admin) {
    if (status && status !== "all") query.status = status;
  } else {
    query.status = "published";
  }
  if (category && category !== "all") query.category = category;
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [{ title: regex }, { excerpt: regex }, { content: regex }];
  }

  const sortMap = {
    newest: { publishedAt: -1, createdAt: -1 },
    oldest: { publishedAt: 1, createdAt: 1 },
    views: { views: -1 },
    title: { title: 1 },
  };

  const [items, total, categoriesAll, counts] = await Promise.all([
    News.find(query)
      .select("-content")
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(limit)
      .populate("author", "firstName lastName username profileImage role")
      .lean(),
    News.countDocuments(query),
    News.distinct("category", { status: "published" }),
    News.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    success: true,
    items,
    categories: categoriesAll,
    categoryCounts: counts.map((c) => ({ category: c._id, count: c.count })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

export const getNews = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const news = await News.findOne({ slug })
    .populate("author", "firstName lastName username profileImage role");

  if (!news) throw new ApiError(404, "Article not found.");
  if (news.status !== "published" && !isAdmin(req)) {
    throw new ApiError(404, "Article not found.");
  }

  if (news.status === "published") {
    await News.updateOne({ _id: news._id }, { $inc: { views: 1 } });
    news.views += 1;
  }

  const related = await News.find({
    status: "published",
    category: news.category,
    _id: { $ne: news._id },
  })
    .sort({ publishedAt: -1 })
    .limit(3)
    .select("-content")
    .lean();

  res.json({ success: true, news, related });
});

export const createNews = asyncHandler(async (req, res) => {
  const payload = req.body;
  const slug = await uniqueSlug(payload.title, News);
  const news = await News.create({
    ...payload,
    slug,
    author: req.user._id,
    publishedAt: payload.status === "published" ? new Date() : null,
  });

  await logAudit({
    actor: req.user,
    action:
      payload.status === "published" ? "news.published" : "news.created",
    entityType: "news",
    entityId: news._id,
    description: `${req.user.firstName} ${req.user.lastName} ${payload.status === "published" ? "published" : "created"} the news article “${news.title}”.`,
    ip: req.ip,
  });

  res.status(201).json({ success: true, news, message: "Article created." });
});

export const updateNews = asyncHandler(async (req, res) => {
  const news = await News.findById(req.params.id);
  if (!news) throw new ApiError(404, "Article not found.");

  const wasPublished = news.status === "published";
  Object.assign(news, req.body);
  if (news.title !== req.body.title || !news.slug) {
    news.slug = await uniqueSlug(news.title, News, news._id);
  }
  if (news.status === "published" && !news.publishedAt) news.publishedAt = new Date();
  if (news.status === "draft") news.publishedAt = null;
  await news.save();

  await logAudit({
    actor: req.user,
    action: "news.updated",
    entityType: "news",
    entityId: news._id,
    description: `${req.user.firstName} ${req.user.lastName} updated the article “${news.title}”.`,
    meta: { wasPublished, nowPublished: news.status === "published" },
    ip: req.ip,
  });

  res.json({ success: true, news, message: "Article updated." });
});

export const deleteNews = asyncHandler(async (req, res) => {
  const news = await News.findByIdAndDelete(req.params.id);
  if (!news) throw new ApiError(404, "Article not found.");

  await logAudit({
    actor: req.user,
    action: "news.deleted",
    entityType: "news",
    entityId: news._id,
    description: `${req.user.firstName} ${req.user.lastName} deleted the article “${news.title}”.`,
    ip: req.ip,
  });

  res.json({ success: true, message: "Article deleted." });
});

export const publishNews = asyncHandler(async (req, res) => {
  const news = await News.findById(req.params.id);
  if (!news) throw new ApiError(404, "Article not found.");

  const nextStatus =
    req.body.status === "published" || req.body.status === "draft"
      ? req.body.status
      : news.status === "published"
        ? "draft"
        : "published";

  news.status = nextStatus;
  news.publishedAt = nextStatus === "published" ? news.publishedAt || new Date() : null;
  await news.save();

  await logAudit({
    actor: req.user,
    action: nextStatus === "published" ? "news.published" : "news.unpublished",
    entityType: "news",
    entityId: news._id,
    description: `${req.user.firstName} ${req.user.lastName} ${nextStatus === "published" ? "published" : "unpublished"} the article “${news.title}”.`,
    ip: req.ip,
  });

  res.json({ success: true, news, message: `Article ${nextStatus}.` });
});
