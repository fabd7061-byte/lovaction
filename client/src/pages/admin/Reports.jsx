import { useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
  Network,
  RefreshCw,
  ScrollText,
  Sparkles,
  Users,
} from "lucide-react";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import { EmptyState } from "../../components/ui/Feedback.jsx";
import { PageLoader } from "../../components/ui/Spinner.jsx";
import PageHeader, { CardHeader, SectionCard } from "../../components/PageHeader.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import api, { apiError } from "../../services/api.js";
import { formatDateTime } from "../../utils/format.js";
import usePageMeta from "../../utils/usePageMeta.js";

const REPORTS = [
  { key: "daily", icon: CalendarDays, tone: "text-gold-light" },
  { key: "weekly", icon: CalendarRange, tone: "text-sky-300" },
  { key: "monthly", icon: CalendarClock, tone: "text-emerald-300" },
  { key: "membership", icon: Users, tone: "text-gold-light" },
  { key: "referrals", icon: Network, tone: "text-sky-300" },
  { key: "points", icon: Sparkles, tone: "text-amber-300" },
  { key: "applications", icon: ClipboardList, tone: "text-red-300" },
  { key: "activity", icon: ScrollText, tone: "text-white/60" },
];

export default function AdminReports() {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [type, setType] = useState("daily");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [downloading, setDownloading] = useState("");

  usePageMeta(t("admin.reports.title"));

  const selectType = (key) => {
    setType(key);
    setReport(null);
    setPreviewError("");
  };

  const checkRange = () => {
    if (from && to && new Date(from) > new Date(to)) {
      toast.error(t("admin.reports.invalidRange"));
      return false;
    }
    return true;
  };

  const preview = async () => {
    if (!checkRange()) return;
    setPreviewLoading(true);
    setPreviewError("");
    try {
      const response = await api.get(`/reports/${type}`, {
        params: { format: "json", from: from || undefined, to: to || undefined },
      });
      setReport(response.data.report || null);
    } catch (err) {
      setPreviewError(apiError(err, t("admin.reports.downloadError")));
    } finally {
      setPreviewLoading(false);
    }
  };

  const download = async (format) => {
    if (!checkRange()) return;
    setDownloading(format);
    try {
      const response = await api.get(`/reports/${type}`, {
        params: { format, from: from || undefined, to: to || undefined },
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type:
          response.headers?.["content-type"] ||
          (format === "pdf" ? "application/pdf" : "text/csv;charset=utf-8"),
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lovaction-${type}-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(t("admin.reports.generated"));
    } catch (err) {
      toast.error(apiError(err, t("admin.reports.downloadError")));
    } finally {
      setDownloading("");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        dark
        eyebrow={t("admin.nav.content")}
        title={t("admin.reports.title")}
        text={t("admin.reports.subtitle")}
        actions={
          <>
            <Button
              variant="outline-light"
              size="sm"
              icon={FileSpreadsheet}
              loading={downloading === "csv"}
              onClick={() => download("csv")}
            >
              {t("admin.reports.csv")}
            </Button>
            <Button size="sm" icon={FileText} loading={downloading === "pdf"} onClick={() => download("pdf")}>
              {t("admin.reports.pdf")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {REPORTS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => selectType(item.key)}
            className={`group flex flex-col rounded-xl border px-3.5 py-3.5 text-left transition ${
              type === item.key
                ? "border-gold/45 bg-gold/[0.08]"
                : "border-white/[0.06] bg-white/[0.025] hover:border-white/15"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                type === item.key ? "bg-gold/15" : "bg-white/[0.04]"
              } ${item.tone}`}
            >
              <item.icon size={15} />
            </span>
            <span className="mt-2.5 block text-[11px] font-semibold leading-tight text-cream/80">
              {t(`admin.reports.${item.key}`)}
            </span>
            <span className="mt-1 line-clamp-2 text-[8.5px] leading-relaxed text-white/25">
              {t(`admin.reports.${item.key}Text`)}
            </span>
          </button>
        ))}
      </div>

      <SectionCard dark>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-white/30">
              {t("admin.reports.range")}
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="block">
                <span className="mb-1 block text-[9px] text-white/30">{t("admin.reports.from")}</span>
                <input
                  type="date"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  className="input-dark h-10 py-0 text-[11.5px]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[9px] text-white/30">{t("admin.reports.to")}</span>
                <input
                  type="date"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  className="input-dark h-10 py-0 text-[11.5px]"
                />
              </label>
              <div className="flex items-center gap-2 pb-0.5">
                <Button size="sm" icon={RefreshCw} loading={previewLoading} onClick={preview}>
                  {t("admin.reports.preview")}
                </Button>
                <Button
                  variant="soft-dark"
                  size="sm"
                  icon={Download}
                  loading={downloading === "pdf"}
                  onClick={() => download("pdf")}
                >
                  PDF
                </Button>
                <Button
                  variant="soft-dark"
                  size="sm"
                  icon={FileSpreadsheet}
                  loading={downloading === "csv"}
                  onClick={() => download("csv")}
                >
                  CSV
                </Button>
              </div>
            </div>
            <p className="mt-2 text-[9.5px] text-white/25">{t("admin.reports.periodHint")}</p>
          </div>

          <div className="rounded-xl border border-gold/20 bg-gold/[0.05] px-3.5 py-2.5 xl:max-w-xs">
            <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-gold-light/70">
              <FileText size={11} /> {t(`admin.reports.${type}`)}
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-white/35">{t(`admin.reports.${type}Text`)}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard dark padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] p-4 sm:px-5">
          <CardHeader
            dark
            title={t("admin.reports.previewTitle")}
            text={report?.periodLabel || t("admin.reports.emptyPreview")}
            className="!mb-0"
          />
          {report && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge label={t(`admin.reports.${report.key}`)} tone="gold" dark dot={false} />
              <span className="text-[9px] text-white/25">
                {t("admin.reports.generatedAt", { date: formatDateTime(report.generatedAt, lang) })}
              </span>
            </div>
          )}
        </div>

        {previewLoading ? (
          <PageLoader label={t("admin.reports.generating")} dark />
        ) : previewError ? (
          <EmptyState
            dark
            icon={FileText}
            title={t("admin.reports.downloadError")}
            text={previewError}
            action={
              <Button size="sm" onClick={preview}>
                {t("common.retry")}
              </Button>
            }
          />
        ) : report ? (
          <div className="space-y-4 p-4 sm:p-5">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-4 sm:px-5">
              <h2 className="font-display text-2xl tracking-[-0.025em] text-cream">{report.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9.5px] text-white/30">
                <span>{report.periodLabel}</span>
                <span className="h-1 w-1 rounded-full bg-gold/50" />
                <span>{t("admin.reports.generatedAt", { date: formatDateTime(report.generatedAt, lang) })}</span>
                <span className="h-1 w-1 rounded-full bg-gold/50" />
                <span>{report.generatedBy}</span>
              </div>
            </div>

            {report.sections?.length ? (
              report.sections.map((section, index) => (
                <div key={`${section.title}-${index}`} className="rounded-2xl border border-white/[0.06]">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.055] px-4 py-3 sm:px-5">
                    <h3 className="font-display text-[1rem] tracking-[-0.015em] text-cream/85">{section.title}</h3>
                    {section.type === "table" && (
                      <span className="text-[9px] text-white/25">
                        {t("admin.reports.rows", { count: section.rows?.length || 0 })}
                      </span>
                    )}
                  </div>

                  {section.type === "stats" ? (
                    <div className="grid gap-2 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3">
                      {section.stats.map((stat) => (
                        <div
                          key={stat.label}
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.055] bg-white/[0.018] px-3.5 py-2.5"
                        >
                          <span className="text-[10px] text-white/40">{stat.label}</span>
                          <span className="font-display text-[1.05rem] leading-none text-gold-light">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : section.rows?.length ? (
                    <div className="max-h-[440px] overflow-auto">
                      <table className="w-full min-w-[680px]">
                        <thead className="sticky top-0 z-10 bg-ink-card">
                          <tr>
                            {section.columns.map((column) => (
                              <th key={column} className="admin-th border-b border-white/[0.06]">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.045]">
                          {section.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="transition hover:bg-white/[0.02]">
                              {row.map((cell, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className={`admin-td whitespace-nowrap text-[10.5px] ${
                                    cellIndex === 0 ? "text-cream/70" : "text-white/40"
                                  }`}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="px-4 py-6 text-center text-[10.5px] text-white/25">{t("admin.reports.noData")}</p>
                  )}
                </div>
              ))
            ) : (
              <EmptyState dark icon={FileText} title={t("admin.reports.noData")} />
            )}
          </div>
        ) : (
          <EmptyState
            dark
            icon={FileText}
            title={t("admin.reports.emptyPreview")}
            text={t("admin.reports.periodHint")}
            action={
              <Button size="sm" icon={RefreshCw} onClick={preview}>
                {t("admin.reports.preview")}
              </Button>
            }
          />
        )}
      </SectionCard>
    </div>
  );
}
