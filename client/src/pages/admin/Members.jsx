import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, FileText, SearchX, UserCheck, UserX, Users } from "lucide-react";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import { EmptyState, Pagination } from "../../components/ui/Feedback.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import { TableSkeleton } from "../../components/ui/Spinner.jsx";
import PageHeader, { SectionCard } from "../../components/PageHeader.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import api, { apiError } from "../../services/api.js";
import { formatDate, formatNumber } from "../../utils/format.js";
import usePageMeta from "../../utils/usePageMeta.js";

const ROLES = ["all", "founder", "admin", "member"];
const STATUSES = ["all", "active", "suspended", "inactive"];

export default function Members() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  usePageMeta(t("admin.members.title"));

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
      const response = await api.get("/members", {
        params: { role, status, sort, search: search || undefined, page, limit: 12 },
      });
      setItems(response.data.items || []);
      setPagination(response.data.pagination || null);
      setStats(response.data.stats || null);
    } catch (err) {
      setError(apiError(err, t("common.errorText")));
    } finally {
      setLoading(false);
    }
  }, [role, status, sort, search, page, t]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <PageHeader
        dark
        eyebrow={t("admin.nav.management")}
        title={t("admin.members.title")}
        text={t("admin.members.subtitle")}
        actions={
          <Button as={Link} to="/admin/reports" variant="outline-light" size="sm" icon={FileText}>
            {t("admin.exportReport")}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { key: "total", label: t("admin.stats.totalMembers"), icon: Users, tone: "text-gold-light", value: stats?.total || 0 },
          { key: "active", label: t("status.active"), icon: UserCheck, tone: "text-emerald-300", value: stats?.active || 0 },
          { key: "suspended", label: t("status.suspended"), icon: UserX, tone: "text-red-300", value: stats?.suspended || 0 },
          { key: "inactive", label: t("status.inactive"), icon: UserX, tone: "text-white/40", value: stats?.inactive || 0 },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              if (item.key !== "total") {
                setStatus(item.key);
                setPage(1);
              }
            }}
            className={`group rounded-xl border px-4 py-3.5 text-left transition ${
              status === item.key
                ? "border-gold/40 bg-gold/[0.07]"
                : "border-white/[0.06] bg-white/[0.025] hover:border-white/15"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35">{item.label}</p>
              <item.icon size={14} className={item.tone} />
            </div>
            <p className="mt-2 font-display text-2xl leading-none text-cream/90">{formatNumber(item.value)}</p>
          </button>
        ))}
      </div>

      <SectionCard dark padded={false}>
        <div className="flex flex-col gap-2.5 border-b border-white/[0.06] p-4 xl:flex-row xl:items-center xl:justify-between">
          <SearchInput
            value={query}
            onChange={setQuery}
            dark
            placeholder={t("common.search")}
            className="w-full xl:max-w-xs"
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setPage(1);
              }}
              className="input-dark h-11 py-0 text-[11.5px]"
            >
              <option value="all" className="bg-ink-soft">{t("admin.members.allRoles")}</option>
              {ROLES.filter((value) => value !== "all").map((value) => (
                <option key={value} value={value} className="bg-ink-soft">{t(`status.${value}`)}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="input-dark h-11 py-0 text-[11.5px]"
            >
              <option value="all" className="bg-ink-soft">{t("admin.members.allStatuses")}</option>
              {STATUSES.filter((value) => value !== "all").map((value) => (
                <option key={value} value={value} className="bg-ink-soft">{t(`status.${value}`)}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              className="input-dark h-11 py-0 text-[11.5px]"
            >
              <option value="newest" className="bg-ink-soft">{t("admin.members.newest")}</option>
              <option value="oldest" className="bg-ink-soft">{t("admin.members.oldest")}</option>
              <option value="name" className="bg-ink-soft">{t("common.name")}</option>
              <option value="points" className="bg-ink-soft">{t("admin.members.mostPoints")}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={8} dark />
          </div>
        ) : error ? (
          <EmptyState
            dark
            icon={Users}
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
              <table className="w-full min-w-[900px]">
                <thead className="bg-white/[0.02]">
                  <tr>
                    <th className="admin-th">{t("admin.members.tableName")}</th>
                    <th className="admin-th">{t("common.role")}</th>
                    <th className="admin-th">{t("common.status")}</th>
                    <th className="admin-th">{t("admin.members.invitedBy")}</th>
                    <th className="admin-th text-right">{t("admin.members.referrals")}</th>
                    <th className="admin-th text-right">{t("admin.members.points")}</th>
                    <th className="admin-th">{t("admin.members.dateJoined")}</th>
                    <th className="admin-th text-right">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {items.map((member) => (
                    <tr
                      key={member._id}
                      className="cursor-pointer transition hover:bg-white/[0.025]"
                      onClick={() => navigate(`/admin/members/${member._id}`)}
                    >
                      <td className="admin-td">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={member.profileImage}
                            firstName={member.firstName}
                            lastName={member.lastName}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-semibold text-cream/85">{member.fullName}</p>
                            <p className="mt-0.5 truncate text-[9.5px] text-white/30">@{member.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="admin-td">
                        <Badge status={member.role} dark dot={false} />
                      </td>
                      <td className="admin-td">
                        <Badge status={member.status} dark />
                      </td>
                      <td className="admin-td">
                        <p className="max-w-[140px] truncate text-[10.5px] text-white/45">
                          {member.parentMemberId ? `${member.parentMemberId.firstName} ${member.parentMemberId.lastName}` : "—"}
                        </p>
                        {member.parentMemberId?.username && (
                          <p className="mt-0.5 text-[9px] text-white/25">@{member.parentMemberId.username}</p>
                        )}
                      </td>
                      <td className="admin-td text-right">
                        <span className="text-[11.5px] font-semibold text-cream/70">{member.referralsCount || 0}</span>
                      </td>
                      <td className="admin-td text-right">
                        <span className="text-[11.5px] font-semibold text-gold-light">{formatNumber(member.points)}</span>
                      </td>
                      <td className="admin-td">
                        <span className="text-[10.5px] text-white/40">{formatDate(member.joinedAt, lang)}</span>
                      </td>
                      <td className="admin-td text-right">
                        <Link
                          to={`/admin/members/${member._id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/55 transition hover:border-gold/40 hover:text-gold-light"
                        >
                          {t("common.view")} <ArrowRight size={11} />
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
          <EmptyState dark icon={query || role !== "all" || status !== "all" ? SearchX : Users} title={t("admin.members.empty")} />
        )}
      </SectionCard>
    </div>
  );
}
