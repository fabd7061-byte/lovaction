import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  ListFilter,
  Network,
  RefreshCw,
  SearchX,
  Users,
  XCircle,
} from "lucide-react";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import { EmptyState, Pagination } from "../../components/ui/Feedback.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import { PageLoader, TableSkeleton } from "../../components/ui/Spinner.jsx";
import PageHeader, { CardHeader, SectionCard } from "../../components/PageHeader.jsx";
import MemberTree from "../../components/MemberTree.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import api, { apiError } from "../../services/api.js";
import { formatDate, formatNumber } from "../../utils/format.js";
import usePageMeta from "../../utils/usePageMeta.js";

const STATUSES = ["all", "pending", "approved", "rejected"];
const TABS = [
  { key: "list", icon: ListFilter, label: "admin.referrals.listTab" },
  { key: "tree", icon: Network, label: "admin.referrals.treeTab" },
];

export default function AdminReferrals() {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState("list");
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tree, setTree] = useState(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState("");

  usePageMeta(t("admin.referrals.title"));

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
      const response = await api.get("/referrals", {
        params: { status, search: search || undefined, page, limit: 12 },
      });
      setItems(response.data.items || []);
      setPagination(response.data.pagination || null);
      setStats(response.data.stats || null);
    } catch (err) {
      setError(apiError(err, t("common.errorText")));
    } finally {
      setLoading(false);
    }
  }, [status, search, page, t]);

  const loadTree = useCallback(async () => {
    setTreeLoading(true);
    setTreeError("");
    try {
      const response = await api.get("/referrals/tree");
      setTree(response.data.tree || []);
    } catch (err) {
      setTreeError(apiError(err, t("common.errorText")));
    } finally {
      setTreeLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (tab === "tree" && !tree) loadTree();
  }, [tab, tree, loadTree]);

  const summary = [
    { key: "total", label: t("common.total"), icon: Users, tone: "text-gold-light" },
    { key: "approved", label: t("status.approved"), icon: CheckCircle2, tone: "text-emerald-300" },
    { key: "pending", label: t("status.pending"), icon: Clock, tone: "text-amber-300" },
    { key: "rejected", label: t("status.rejected"), icon: XCircle, tone: "text-red-300" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        dark
        eyebrow={t("admin.nav.community")}
        title={t("admin.referrals.title")}
        text={t("admin.referrals.subtitle")}
        actions={
          <>
            <Button variant="outline-light" size="sm" icon={RefreshCw} onClick={tab === "tree" ? loadTree : load}>
              {t("common.refresh")}
            </Button>
            <Button as={Link} to="/admin/reports" size="sm" icon={FileText}>
              {t("admin.exportReport")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {summary.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setTab("list");
              if (item.key !== "total") setStatus(item.key);
              else setStatus("all");
              setPage(1);
            }}
            className={`group rounded-xl border px-4 py-3.5 text-left transition ${
              (item.key === "total" ? status === "all" : status === item.key) && tab === "list"
                ? "border-gold/40 bg-gold/[0.07]"
                : "border-white/[0.06] bg-white/[0.025] hover:border-white/15"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35">{item.label}</p>
              <item.icon size={14} className={item.tone} />
            </div>
            <p className="mt-2 font-display text-2xl leading-none text-cream/90">
              {formatNumber(stats?.[item.key] || 0)}
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.025] p-1 sm:w-fit">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold transition sm:flex-none ${
              tab === item.key ? "bg-gold text-ink shadow-gold" : "text-white/45 hover:text-cream"
            }`}
          >
            <item.icon size={13} />
            {t(item.label)}
          </button>
        ))}
      </div>

      {tab === "list" ? (
        <SectionCard dark padded={false}>
          <div className="flex flex-col gap-2.5 border-b border-white/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
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
                  {key === "all" ? t("admin.referrals.allStatuses") : t(`status.${key}`)}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="p-4">
              <TableSkeleton rows={7} dark />
            </div>
          ) : error ? (
            <EmptyState
              dark
              icon={Network}
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
                <table className="w-full min-w-[820px]">
                  <thead className="bg-white/[0.02]">
                    <tr>
                      <th className="admin-th">{t("admin.referrals.tableReferrer")}</th>
                      <th className="admin-th">{t("admin.referrals.tableReferred")}</th>
                      <th className="admin-th">{t("common.status")}</th>
                      <th className="admin-th">{t("admin.referrals.tableDate")}</th>
                      <th className="admin-th text-right">{t("admin.referrals.points")}</th>
                      <th className="admin-th text-right">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {items.map((item) => {
                      const person = item.referredMember || item.application || {};
                      const personLink = item.referredMember
                        ? `/admin/members/${item.referredMember._id}`
                        : item.application
                          ? `/admin/applications/${item.application._id}`
                          : null;
                      return (
                        <tr key={item._id} className="transition hover:bg-white/[0.025]">
                          <td className="admin-td">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={item.referrer?.profileImage}
                                firstName={item.referrer?.firstName}
                                lastName={item.referrer?.lastName}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-[12px] font-semibold text-cream/85">
                                  {item.referrer
                                    ? `${item.referrer.firstName} ${item.referrer.lastName}`
                                    : t("common.notAvailable")}
                                </p>
                                <p className="mt-0.5 truncate text-[9.5px] text-white/30">
                                  {item.referrer ? `@${item.referrer.username}` : "—"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="admin-td">
                            <div className="flex items-center gap-2.5">
                              <Avatar
                                src={person.profileImage}
                                firstName={person.firstName}
                                lastName={person.lastName}
                                size="xs"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-[11.5px] text-cream/70">
                                  {person.firstName} {person.lastName}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1.5 truncate text-[9px] text-white/25">
                                  {item.referredMember ? (
                                    <>@{person.username}</>
                                  ) : (
                                    <>
                                      <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.08em]">
                                        {t("admin.referrals.application")}
                                      </span>
                                      {person.email}
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="admin-td">
                            <Badge status={item.status} dark />
                          </td>
                          <td className="admin-td">
                            <p className="text-[10.5px] text-white/45">{formatDate(item.createdAt, lang)}</p>
                            {item.approvedAt && (
                              <p className="mt-0.5 text-[9px] text-emerald-300/50">
                                {t("admin.referrals.approvedOn", { date: formatDate(item.approvedAt, lang) })}
                              </p>
                            )}
                          </td>
                          <td className="admin-td text-right">
                            <span className="text-[11.5px] font-bold text-gold-light">
                              +{item.pointsAwarded || 0}
                            </span>
                          </td>
                          <td className="admin-td text-right">
                            {personLink ? (
                              <Link
                                to={personLink}
                                className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/55 transition hover:border-gold/40 hover:text-gold-light"
                              >
                                {t("common.view")} <ArrowRight size={11} />
                              </Link>
                            ) : (
                              <span className="text-[10px] text-white/20">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
              icon={query || status !== "all" ? SearchX : Network}
              title={t("admin.referrals.empty")}
            />
          )}
        </SectionCard>
      ) : (
        <SectionCard dark>
          <CardHeader
            dark
            title={t("admin.referrals.treeTab")}
            text={t("members.treeNote")}
            action={
              <Button variant="outline-light" size="sm" icon={RefreshCw} onClick={loadTree} loading={treeLoading}>
                {t("common.refresh")}
              </Button>
            }
          />
          {treeLoading && !tree ? (
            <PageLoader label={t("common.loading")} dark />
          ) : treeError ? (
            <EmptyState
              dark
              icon={Network}
              title={t("common.loadFailed")}
              text={treeError}
              action={
                <Button variant="outline-light" size="sm" onClick={loadTree}>
                  {t("common.retry")}
                </Button>
              }
            />
          ) : (
            <MemberTree tree={tree || []} linkTo={(id) => `/admin/members/${id}`} />
          )}
        </SectionCard>
      )}
    </div>
  );
}
