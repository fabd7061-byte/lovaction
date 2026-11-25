import { asyncHandler, ApiError } from "../utils/ApiError.js";
import { buildReport } from "../services/reportService.js";
import { reportToCsv } from "../utils/csv.js";
import { streamReportPdf } from "../utils/pdf.js";
import { logAudit } from "../utils/audit.js";

function resolvePeriod(type, query) {
  if (query.from || query.to) {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - 6 * 86400000);
    to.setHours(23, 59, 59, 999);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }

  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date();
  from.setHours(0, 0, 0, 0);

  if (type === "weekly") from.setDate(from.getDate() - 6);
  else if (type === "monthly") from.setDate(1);
  else if (type !== "daily") from.setDate(from.getDate() - 29);

  return { from, to };
}

const VALID_TYPES = [
  "daily",
  "weekly",
  "monthly",
  "membership",
  "referrals",
  "points",
  "applications",
  "activity",
];

export const generateReport = asyncHandler(async (req, res) => {
  const { type } = req.params;
  if (!VALID_TYPES.includes(type)) {
    throw new ApiError(400, "Unknown report type.");
  }

  const format = String(req.query.format || "json").toLowerCase();
  const { from, to } = resolvePeriod(type, req.query);
  const report = await buildReport(type, from, to, req.user);
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    return res.json({ success: true, report });
  }

  await logAudit({
    actor: req.user,
    action: "report.generated",
    entityType: "report",
    entityId: type,
    description: `${req.user.firstName} ${req.user.lastName} generated the ${report.title} (${format.toUpperCase()}).`,
    ip: req.ip,
  });

  if (format === "csv") {
    const csv = reportToCsv(report);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="lovaction-${type}-${stamp}.csv"`
    );
    return res.send(csv);
  }

  if (format === "pdf") {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="lovaction-${type}-${stamp}.pdf"`
    );
    return streamReportPdf(report, res);
  }

  throw new ApiError(400, "Unsupported format. Use pdf, csv or json.");
});
