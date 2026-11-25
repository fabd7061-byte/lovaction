import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CalendarDays,
  Eye,
  RefreshCw,
  ScrollText,
  SearchX,
  ShieldCheck,
  X,
} from "lucide-react";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { EmptyState, Pagination } from "../../components/ui/Feedback.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import { TableSkeleton } from "../../components/ui/Spinner.jsx";
import PageHeader, { SectionCard } from "../../components/PageHeader.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import api, { apiError } from "../../services/api.js";
import { formatDateTime, relativeTime } from "../../utils/format.js";
import usePageMeta from "../../utils/usePageMeta.js";

function actionTone(action = "") {
  if (/delet|reject|suspend|penalt|unauthor/i.test(action)) return "red";
  if (/approv|activat|created|publish|upload/i.test(action)) return "green";
  if (/points|adjust/i.test(action)) return "gold";
  if (/news|gallery|report|settings/i.test(action)) return "blue";
  return "neutral";
}

export default function AdminAudit() {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState([]);
  const [actions, setActions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  usePageMeta(t("admin.audit.title"));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/audit-logs", {
        params: {
          action,
          search: search || undefined,
          from: from || undefined,
          to: to || undefined,
          page,
          limit: 20,
        },
      });
      setItems(response.data.items || []);
      setActions(response.data.actions || []);
      setPagination(response.data.pagination || null);
    } catch (err) {
      setError(apiError(err, t("common.errorText")));
    } finally {
      setLoading(false);
    }
  }, [action, search, from, to, page, t]);

  useEffect(() => {
    load();
  }, [load]);

  const resetFilters = () => {
    setAction("all");
    setFrom("");
    setTo("");
    setQuery("");
    setPage(1);
  };

  const hasFilters = action !== "all" || Boolean(from) || Boolean(to) || Boolean(search);

  return (
    <div className="space-y-5">
      <PageHeader
        dark
        eyebrow={t("admin.nav.content")}
        title={t("admin.audit.title")}
        text={t("admin.audit.subtitle")}
        actions={
          <Button variant="outline-light" size="sm" icon={RefreshCw} onClick={load}>
            {t("common.refresh")}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: t("admin.audit.total", { count: pagination?.total || 0 }), icon: ScrollText, value: pagination?.total || 0, tone: "text-gold-light" },
          { label: t("admin.audit.action"), icon: Activity, value: actions.length, tone: "text-sky-300" },
          { label: t("admin.reports.range"), icon: CalendarDays, value: from || to ? "1" : "—", tone: "text-emerald-300" },
          { label: t("admin.reports.sections"), icon: ShieldCheck, value: new Set(items.map((item) => item.entityType).filter(Boolean)).size, tone: "text-white/50" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35">{item.label}</p>
              <item.icon size={14} className={item.tone} />
            </div>
            <p className="mt-2 font-display text-2xl leading-none text-cream/90">{item.value}</p>
          </div>
        ))}
      </div>

      <SectionCard dark padded={false}>
        <div className="space-y-2.5 border-b border-white/[0.06] p-4">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <SearchInput
              value={query}
              onChange={setQuery}
              dark
              placeholder={t("common.search")}
              className="w-full lg:max-w-xs"
            />
            <select
              value={action}
              onChange={(event) => {
                setAction(event.target.value);
                setPage(1);
              }}
              className="input-dark h-11 w-full py-0 text-[11.5px] lg:w-auto lg:min-w-[200px]"
            >
              <option value="all" className="bg-ink-soft">{t("admin.audit.allActions")}</option>
              {actions.map((value) => (
                <option key={value} value={value} className="bg-ink-soft">
                  {value}
                </option>
              ))}
            </select>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex flex-1 items-center gap-2">
                <span className="shrink-0 text-[9px] uppercase tracking-[0.1em] text-white/25">{t("admin.audit.from")}</span>
                <input
                  type="date"
                  value={from}
                  onChange={(event) => {
                    setFrom(event.target.value);
                    setPage(1);
                  }}
                  className="input-dark h-11 min-w-0 flex-1 py-0 text-[11px]"
                />
              </label>
              <label className="flex flex-1 items-center gap-2">
                <span className="shrink-0 text-[9px] uppercase tracking-[0.1em] text-white/25">{t("admin.audit.to")}</span>
                <input
                  type="date"
                  value={to}
                  onChange={(event) => {
                    setTo(event.target.value);
                    setPage(1);
                  }}
                  className="input-dark h-11 min-w-0 flex-1 py-0 text-[11px]"
                />
              </label>
              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex shrink-0 items-center justify-center gap-1 rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold text-white/40 transition hover:border-gold/40 hover:text-cream"
                >
                  <X size={11} /> {t("common.clear")}
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={8} dark />
          </div>
        ) : error ? (
          <EmptyState
            dark
            icon={ScrollText}
            title={t("common.loadFailed")}
            text={error}
            action={
              <Button variant="outline-light" size="sm" onClick={load}>
                {t("common.retry")}
              </Button>
            }
          />
        ) : items.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead className="bg-white/[0.02]">
                  <tr>
                    <th className="admin-th">{t("admin.audit.actor")}</th>
                    <th className="admin-th">{t("admin.audit.action")}</th>
                    <th className="admin-th">{t("admin.audit.description")}</th>
                    <th className="admin-th">{t("admin.audit.date")}</th>
                    <th className="admin-th text-right">{t("common.details")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {items.map((log) => (
                    <tr key={log._id} className="transition hover:bg-white/[0.025]">
                      <td className="admin-td">
                        <div className="flex items-center gap-2.5">
                          {log.actor ? (
                            <Avatar
                              src={log.actor.profileImage}
                              firstName={log.actor.firstName}
                              lastName={log.actor.lastName}
                              size="xs"
                            />
                          ) : (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[9px] font-bold text-gold-light/60">
                              S
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-semibold text-cream/75">
                              {log.actorName ||
                                (log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : t("admin.audit.actorSystem"))}
                            </p>
                            <p className="mt-0.5 truncate text-[8.5px] text-white/25">
                              {log.actor?.username ? `@${log.actor.username}` : log.ip || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="admin-td">
                        <Badge label={log.action} tone={actionTone(log.action)} dark dot={false} />
                      </td>
                      <td className="admin-td">
                        <p className="max-w-[420px] truncate text-[10.5px] text-white/45" title={log.description}>
                          {log.description}
                        </p>
                      </td>
                      <td className="admin-td">
                        <p className="text-[10px] text-white/40">{formatDateTime(log.createdAt, lang)}</p>
                        <p className="mt-0.5 text-[8.5px] text-white/20">{relativeTime(log.createdAt, lang)}</p>
                      </td>
                      <td className="admin-td text-right">
                        <button
                          type="button"
                          onClick={() => setSelected(log)}
                          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-[9.5px] font-semibold text-white/45 transition hover:border-gold/40 hover:text-gold-light"
                        >
                          <Eye size={11} /> {t("common.view")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4">
              <Pagination
                page={pagination?.page || 1}
                pages={pagination?.pages || 1}
                total={pagination?.total}
                limit={pagination?.limit}
                onChange={setPage}
                dark
              />
            </div>
          </>
        ) : (
          <EmptyState
            dark
            icon={hasFilters ? SearchX : ScrollText}
            title={t("admin.audit.empty")}
            action={
              hasFilters ? (
                <Button variant="outline-light" size="sm" onClick={resetFilters}>
                  {t("common.clear")}
                </Button>
              ) : null
            }
          />
        )}
      </SectionCard>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        theme="dark"
        size="md"
        title={t("admin.audit.action")}
        description={selected ? selected.action : ""}
        footer={
          <Button size="sm" onClick={() => setSelected(null)}>
            {t("common.close")}
          </Button>
        }
      >
        {selected && (
          <div className="space-y-3">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-white/25">
                {t("admin.audit.description")}
              </p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/60">{selected.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: t("admin.audit.actor"), value: selected.actorName || selected.actor?.username || t("admin.audit.actorSystem") },
                { label: t("admin.audit.date"), value: formatDateTime(selected.createdAt, lang) },
                { label: t("common.type"), value: selected.entityType || "—" },
                { label: t("common.details"), value: selected.entityId || "—" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/[0.055] px-3 py-2.5">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-white/25">{item.label}</p>
                  <p className="mt-1 break-words text-[10.5px] text-white/55">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-ink/60 p-3.5">
              <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-white/25">
                {t("admin.reports.jsonPreview")}
              </p>
              <pre className="dark-scroll mt-2 max-h-48 overflow-auto font-mono text-[9.5px] leading-relaxed text-gold-light/60">
                {selected.meta && Object.keys(selected.meta).length
                  ? JSON.stringify(selected.meta, null, 2)
                  : t("common.none")}
              </pre>
            </div>
            {selected.ip && (
              <p className="text-[9px] text-white/20">
                IP · <span className="font-mono text-white/40">{selected.ip}</span>
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
