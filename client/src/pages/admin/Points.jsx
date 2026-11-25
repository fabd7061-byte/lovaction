import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  Medal,
  SearchX,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { Input, Select, Textarea } from "../../components/ui/Field.jsx";
import { EmptyState, Pagination } from "../../components/ui/Feedback.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import { TableSkeleton } from "../../components/ui/Spinner.jsx";
import PageHeader, { CardHeader, SectionCard } from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import api, { apiError } from "../../services/api.js";
import { formatDateTime, formatNumber } from "../../utils/format.js";
import usePageMeta from "../../utils/usePageMeta.js";

const TYPES = ["all", "referral", "admin_adjustment", "bonus", "penalty"];
const ADJUST_TYPES = ["bonus", "admin_adjustment", "penalty"];
const RANK_STYLES = [
  "bg-gold/20 text-gold-light border-gold/40",
  "bg-white/[0.08] text-cream/80 border-white/20",
  "bg-amber-700/20 text-amber-300 border-amber-600/30",
];

function typeLabel(type, t) {
  const map = {
    referral: t("admin.points.typeReferral"),
    admin_adjustment: t("admin.points.typeAdjustment"),
    adjustment: t("admin.points.typeAdjustment"),
    bonus: t("admin.points.typeBonus"),
    penalty: t("admin.points.typePenalty"),
  };
  return map[type] || type;
}

const EMPTY_ADJUST = { points: "", type: "bonus", description: "" };

export default function AdminPoints() {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [leaderboard, setLeaderboard] = useState(null);
  const [leaderLoading, setLeaderLoading] = useState(true);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [adjustForm, setAdjustForm] = useState(EMPTY_ADJUST);
  const [adjusting, setAdjusting] = useState(false);

  usePageMeta(t("admin.points.title"));

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
      const response = await api.get("/points", {
        params: { type, search: search || undefined, page, limit: 12 },
      });
      setItems(response.data.items || []);
      setPagination(response.data.pagination || null);
      setStats(response.data.stats || null);
    } catch (err) {
      setError(apiError(err, t("common.errorText")));
    } finally {
      setLoading(false);
    }
  }, [type, search, page, t]);

  const loadLeaderboard = useCallback(async () => {
    setLeaderLoading(true);
    try {
      const response = await api.get("/points/leaderboard", { params: { limit: 10 } });
      setLeaderboard(response.data);
    } catch {
      setLeaderboard(null);
    } finally {
      setLeaderLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    if (!adjustOpen) return undefined;
    const needle = memberQuery.trim();
    if (needle.length < 2) {
      setMemberResults([]);
      return undefined;
    }
    setMemberSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await api.get("/members", { params: { search: needle, limit: 8, status: "all" } });
        setMemberResults(response.data.items || []);
      } catch {
        setMemberResults([]);
      } finally {
        setMemberSearching(false);
      }
    }, 320);
    return () => {
      window.clearTimeout(timer);
      setMemberSearching(false);
    };
  }, [memberQuery, adjustOpen]);

  const openAdjust = () => {
    setAdjustOpen(true);
    setMemberQuery("");
    setMemberResults([]);
    setSelectedMember(null);
    setAdjustForm(EMPTY_ADJUST);
  };

  const closeAdjust = () => {
    if (adjusting) return;
    setAdjustOpen(false);
  };

  const submitAdjust = async () => {
    if (!selectedMember) {
      toast.error(t("admin.members.pointsText"));
      return;
    }
    const value = Number(adjustForm.points);
    if (!Number.isInteger(value) || value === 0) {
      toast.error(t("admin.members.pointsAmount"));
      return;
    }
    if (adjustForm.description.trim().length < 3) {
      toast.error(t("admin.members.pointsReason"));
      return;
    }
    setAdjusting(true);
    try {
      await api.post("/points/adjust", {
        memberId: selectedMember._id,
        points: value,
        type: adjustForm.type,
        description: adjustForm.description.trim(),
      });
      toast.success(t("admin.members.pointsDone"));
      setAdjustOpen(false);
      load();
      loadLeaderboard();
    } catch (err) {
      toast.error(apiError(err, t("common.errorText")));
    } finally {
      setAdjusting(false);
    }
  };

  const metric = leaderboard?.metric === "points" ? t("common.points") : t("common.referrals");
  const rows = useMemo(() => leaderboard?.rows || [], [leaderboard]);

  return (
    <div className="space-y-5">
      <PageHeader
        dark
        eyebrow={t("admin.nav.community")}
        title={t("admin.points.title")}
        text={t("admin.points.subtitle")}
        actions={
          <>
            <Button as={Link} to="/admin/reports" variant="outline-light" size="sm" icon={FileText}>
              {t("admin.exportReport")}
            </Button>
            <Button size="sm" icon={Sparkles} onClick={openAdjust}>
              {t("admin.members.adjustPoints")}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          dark
          label={t("admin.points.totalAwarded")}
          value={formatNumber(stats?.awarded)}
          note={t("admin.points.awarded")}
          icon={ArrowUpRight}
          tone="green"
        />
        <StatCard
          dark
          label={t("admin.points.totalDeducted")}
          value={formatNumber(stats?.deducted)}
          note={t("admin.points.deducted")}
          icon={ArrowDownRight}
          tone="crimson"
        />
        <StatCard
          dark
          label={t("admin.points.transactionCount")}
          value={formatNumber(stats?.count)}
          note={t("admin.points.ledger")}
          icon={Sparkles}
          tone="gold"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
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
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(1);
              }}
              className="input-dark h-11 w-full py-0 text-[11.5px] sm:w-auto"
            >
              {TYPES.map((key) => (
                <option key={key} value={key} className="bg-ink-soft">
                  {key === "all" ? t("admin.points.allTypes") : typeLabel(key, t)}
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
              icon={Sparkles}
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
                <table className="w-full min-w-[760px]">
                  <thead className="bg-white/[0.02]">
                    <tr>
                      <th className="admin-th">{t("admin.points.member")}</th>
                      <th className="admin-th">{t("admin.points.description")}</th>
                      <th className="admin-th text-right">{t("admin.points.typeLabel")}</th>
                      <th className="admin-th text-right">{t("admin.points.balanceAfter")}</th>
                      <th className="admin-th text-right">{t("common.date")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {items.map((tx) => {
                      const positive = tx.points >= 0;
                      return (
                        <tr key={tx._id} className="transition hover:bg-white/[0.025]">
                          <td className="admin-td">
                            <Link to={`/admin/members/${tx.member?._id}`} className="flex items-center gap-2.5">
                              <Avatar
                                src={tx.member?.profileImage}
                                firstName={tx.member?.firstName}
                                lastName={tx.member?.lastName}
                                size="xs"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-[11.5px] font-semibold text-cream/80">
                                  {tx.member ? `${tx.member.firstName} ${tx.member.lastName}` : t("common.notAvailable")}
                                </p>
                                <p className="mt-0.5 truncate text-[9px] text-white/25">
                                  {tx.member ? `@${tx.member.username}` : "—"}
                                </p>
                              </div>
                            </Link>
                          </td>
                          <td className="admin-td">
                            <p className="max-w-[320px] truncate text-[11px] text-white/55" title={tx.description}>
                              {tx.description}
                            </p>
                          </td>
                          <td className="admin-td text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Badge
                                label={typeLabel(tx.type, t)}
                                tone={tx.type === "referral" ? "gold" : tx.type === "penalty" ? "red" : positive ? "green" : "neutral"}
                                dark
                                dot={false}
                              />
                              <span className={`w-12 text-right text-[11.5px] font-bold ${positive ? "text-emerald-300" : "text-red-300"}`}>
                                {positive ? "+" : ""}
                                {tx.points}
                              </span>
                            </div>
                          </td>
                          <td className="admin-td text-right text-[10.5px] text-white/45">{tx.balanceAfter ?? 0}</td>
                          <td className="admin-td text-right text-[9.5px] text-white/35">
                            {formatDateTime(tx.createdAt, lang)}
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
              icon={query || type !== "all" ? SearchX : Sparkles}
              title={t("admin.points.empty")}
            />
          )}
        </SectionCard>

        <SectionCard dark>
          <CardHeader
            dark
            title={t("admin.points.leaderboard")}
            text={t("top.rankedByPoints")}
            action={<Badge label={metric} tone="gold" dark dot={false} />}
          />
          {leaderLoading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-xl bg-white/[0.03]" />
              ))}
            </div>
          ) : rows.length ? (
            <div className="space-y-1.5">
              {rows.map((row) => (
                <Link
                  key={row.id}
                  to={`/admin/members/${row.id}`}
                  className="group flex items-center gap-2.5 rounded-xl border border-transparent px-2 py-2 transition hover:border-white/[0.06] hover:bg-white/[0.025]"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                      RANK_STYLES[row.rank - 1] || "border-white/10 bg-white/[0.03] text-white/40"
                    }`}
                  >
                    {row.rank <= 3 ? <Medal size={12} /> : row.rank}
                  </span>
                  <Avatar src={row.profileImage} firstName={row.firstName} lastName={row.lastName} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-cream/75">{row.fullName}</p>
                    <p className="truncate text-[8.5px] text-white/25">@{row.username}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] font-bold text-gold-light">
                      {leaderboard?.metric === "points" ? formatNumber(row.points) : row.approvedReferrals}
                    </p>
                    <p className="text-[8px] uppercase tracking-[0.08em] text-white/25">{metric}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState dark icon={Trophy} title={t("dashboard.rankingEmpty")} />
          )}
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
            <Link
              to="/admin/referrals"
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-gold-light/70 transition hover:text-gold-light"
            >
              <Users size={11} /> {t("admin.referrals.title")}
            </Link>
            <span className="text-[9px] text-white/20">
              {leaderboard?.all?.length || 0} {t("common.members").toLowerCase()}
            </span>
          </div>
        </SectionCard>
      </div>

      <Modal
        open={adjustOpen}
        onClose={closeAdjust}
        theme="dark"
        size="md"
        title={t("admin.members.pointsTitle")}
        description={t("admin.members.pointsText")}
        footer={
          <>
            <Button variant="soft-dark" size="sm" onClick={closeAdjust} disabled={adjusting}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" loading={adjusting} onClick={submitAdjust} disabled={!selectedMember}>
              {t("common.save")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {selectedMember ? (
            <div className="flex items-center gap-3 rounded-xl border border-gold/25 bg-gold/[0.06] px-3.5 py-3">
              <Avatar
                src={selectedMember.profileImage}
                firstName={selectedMember.firstName}
                lastName={selectedMember.lastName}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-cream/85">
                  {selectedMember.firstName} {selectedMember.lastName}
                </p>
                <p className="mt-0.5 truncate text-[9.5px] text-white/35">
                  @{selectedMember.username} · {formatNumber(selectedMember.points)} {t("common.points").toLowerCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedMember(null);
                  setMemberQuery("");
                }}
                className="rounded-full border border-white/10 p-1.5 text-white/40 transition hover:border-gold/40 hover:text-cream"
                aria-label={t("common.change")}
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div>
              <SearchInput
                value={memberQuery}
                onChange={setMemberQuery}
                dark
                placeholder={t("admin.members.tableName")}
              />
              <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-white/[0.06]">
                {memberSearching ? (
                  <div className="space-y-1.5 p-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-10 animate-pulse rounded-lg bg-white/[0.03]" />
                    ))}
                  </div>
                ) : memberResults.length ? (
                  memberResults.map((member) => (
                    <button
                      key={member._id}
                      type="button"
                      onClick={() => setSelectedMember(member)}
                      className="flex w-full items-center gap-2.5 border-b border-white/[0.05] px-2.5 py-2 text-left transition last:border-0 hover:bg-white/[0.04]"
                    >
                      <Avatar
                        src={member.profileImage}
                        firstName={member.firstName}
                        lastName={member.lastName}
                        size="xs"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold text-cream/75">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="truncate text-[9px] text-white/30">@{member.username}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-gold-light">
                        {formatNumber(member.points)}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-5 text-center text-[10.5px] text-white/30">
                    {memberQuery.trim().length < 2 ? t("admin.members.subtitle") : t("common.noResults")}
                  </p>
                )}
              </div>
            </div>
          )}

          <Input
            dark
            type="number"
            label={t("admin.members.pointsAmount")}
            value={adjustForm.points}
            onChange={(event) => setAdjustForm({ ...adjustForm, points: event.target.value })}
            placeholder="+10 / -5"
          />
          <Select
            dark
            label={t("admin.members.pointsType")}
            value={adjustForm.type}
            onChange={(event) => setAdjustForm({ ...adjustForm, type: event.target.value })}
          >
            {ADJUST_TYPES.map((value) => (
              <option key={value} value={value} className="bg-ink-soft">
                {typeLabel(value, t)}
              </option>
            ))}
          </Select>
          <Textarea
            dark
            label={t("admin.members.pointsReason")}
            value={adjustForm.description}
            onChange={(event) => setAdjustForm({ ...adjustForm, description: event.target.value })}
            rows={3}
            maxLength={400}
            placeholder={t("admin.members.pointsReasonPlaceholder")}
          />
        </div>
      </Modal>
    </div>
  );
}
