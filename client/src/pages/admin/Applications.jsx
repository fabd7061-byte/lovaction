import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  SearchX,
  XCircle,
} from "lucide-react";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import { EmptyState, Pagination } from "../../components/ui/Feedback.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import { TableSkeleton } from "../../components/ui/Spinner.jsx";
import PageHeader, { SectionCard } from "../../components/PageHeader.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import api, { apiError } from "../../services/api.js";
import { formatDate } from "../../utils/format.js";
import usePageMeta from "../../utils/usePageMeta.js";

const STATUSES = ["all", "pending", "under_review", "approved", "rejected"];

export default function Applications() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  usePageMeta(t("admin.applications.title"));

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
      const response = await api.get("/applications", {
        params: { status, sort, search: search || undefined, page, limit: 10 },
      });
      setItems(response.data.items || []);
      setPagination(response.data.pagination || null);
      setStats(response.data.stats || null);
    } catch (err) {
      setError(apiError(err, t("common.errorText")));
    } finally {
      setLoading(false);
    }
  }, [status, sort, search, page, t]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = [
    { key: "pending", icon: Clock, tone: "text-amber-300" },
    { key: "under_review", icon: ClipboardList, tone: "text-sky-300" },
    { key: "approved", icon: CheckCircle2, tone: "text-emerald-300" },
    { key: "rejected", icon: XCircle, tone: "text-red-300" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        dark
        eyebrow={t("admin.nav.management")}
        title={t("admin.applications.title")}
        text={t("admin.applications.subtitle")}
        actions={
          <Button as={Link} to="/admin/reports" variant="outline-light" size="sm" icon={FileText}>
            {t("admin.exportReport")}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {summary.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setStatus(item.key);
              setPage(1);
            }}
            className={`group rounded-xl border px-4 py-3.5 text-left transition ${
              status === item.key
                ? "border-gold/40 bg-gold/[0.07]"
                : "border-white/[0.06] bg-white/[0.025] hover:border-white/15"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35">
                {t(`status.${item.key}`)}
              </p>
              <item.icon size={14} className={item.tone} />
            </div>
            <p className="mt-2 font-display text-2xl leading-none text-cream/90">{stats?.[item.key] || 0}</p>
            <p className="mt-1 text-[9px] text-white/20">
              {t("common.total")}: {stats?.total || 0}
            </p>
          </button>
        ))}
      </div>

      <SectionCard dark padded={false}>
        <div className="flex flex-col gap-2.5 border-b border-white/[0.06] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
            <SearchInput
              value={query}
              onChange={setQuery}
              dark
              placeholder={t("common.search")}
              className="w-full sm:max-w-xs"
            />
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="input-dark h-11 w-full py-0 text-[11.5px] sm:w-auto"
            >
              {STATUSES.map((key) => (
                <option key={key} value={key} className="bg-ink-soft">
                  {key === "all" ? t("admin.applications.all") : t(`status.${key}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9.5px] uppercase tracking-[0.12em] text-white/25">{t("admin.members.sort")}</span>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              className="input-dark h-11 w-full py-0 text-[11.5px] sm:w-auto"
            >
              <option value="newest" className="bg-ink-soft">{t("admin.members.newest")}</option>
              <option value="oldest" className="bg-ink-soft">{t("admin.members.oldest")}</option>
              <option value="name" className="bg-ink-soft">{t("common.name")}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={6} dark />
          </div>
        ) : error ? (
          <EmptyState
            dark
            icon={ClipboardList}
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
              <table className="w-full min-w-[800px]">
                <thead className="bg-white/[0.02]">
                  <tr>
                    <th className="admin-th">{t("admin.applications.applicant")}</th>
                    <th className="admin-th">{t("admin.applications.referrer")}</th>
                    <th className="admin-th">{t("common.status")}</th>
                    <th className="admin-th">{t("admin.applications.submitted")}</th>
                    <th className="admin-th text-right">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {items.map((application) => (
                    <tr
                      key={application._id}
                      className="cursor-pointer transition hover:bg-white/[0.025]"
                      onClick={() => navigate(`/admin/applications/${application._id}`)}
                    >
                      <td className="admin-td">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={application.profileImage}
                            firstName={application.firstName}
                            lastName={application.lastName}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-semibold text-cream/85">
                              {application.firstName} {application.lastName}
                            </p>
                            <p className="mt-0.5 truncate text-[9.5px] text-white/30">{application.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="admin-td">
                        <p className="text-[11px] text-white/50">@{application.referralUsername}</p>
                        {application.referrer && (
                          <p className="mt-0.5 truncate text-[9px] text-white/25">
                            {application.referrer.firstName} {application.referrer.lastName}
                          </p>
                        )}
                      </td>
                      <td className="admin-td">
                        <Badge status={application.status} dark />
                      </td>
                      <td className="admin-td">
                        <p className="text-[10.5px] text-white/45">{formatDate(application.createdAt, lang)}</p>
                      </td>
                      <td className="admin-td text-right">
                        <Link
                          to={`/admin/applications/${application._id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/55 transition hover:border-gold/40 hover:text-gold-light"
                        >
                          {t("admin.applications.view")} <ArrowRight size={11} />
                        </Link>
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
          <EmptyState dark icon={query || status !== "all" ? SearchX : ClipboardList} title={t("common.noResults")} />
        )}
      </SectionCard>
    </div>
  );
}
