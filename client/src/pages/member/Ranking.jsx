import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Medal, SearchX, Sparkles, Trophy, Users } from "lucide-react";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import { EmptyState } from "../../components/ui/Feedback.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import { PageLoader } from "../../components/ui/Spinner.jsx";
import PageHeader, { SectionCard } from "../../components/PageHeader.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import api, { apiError } from "../../services/api.js";
import { formatNumber, relativeTime } from "../../utils/format.js";
import usePageMeta from "../../utils/usePageMeta.js";

const PODIUM = [
  { icon: Crown, ring: "ring-gold/70", badge: "bg-gold text-ink", order: "sm:order-2", lift: "sm:-mt-6" },
  { icon: Medal, ring: "ring-ink/10", badge: "bg-ink/70 text-cream", order: "sm:order-1", lift: "" },
  { icon: Medal, ring: "ring-crimson/30", badge: "bg-crimson text-white", order: "sm:order-3", lift: "" },
];

export default function Ranking() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  usePageMeta(t("dashboard.rankingTitle"));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/points/leaderboard", { params: { limit: 100 } });
      setData(response.data);
    } catch (err) {
      setError(apiError(err, t("common.errorText")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = data?.rows || [];
  const all = data?.all || rows;
  const metric = data?.metric || "referrals";

  const valueOf = useCallback(
    (row) => (metric === "points" ? formatNumber(row.points) : formatNumber(row.approvedReferrals)),
    [metric]
  );
  const metricLabel = metric === "points" ? t("dashboard.pointsMetric") : t("dashboard.referralsMetric");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      [row.fullName, row.username, row.memberCode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [rows, query]);

  const myIndex = all.findIndex((row) => String(row.id) === String(user?.id));
  const me = myIndex >= 0 ? all[myIndex] : null;
  const above = myIndex > 0 ? all[myIndex - 1] : null;
  const gap = above
    ? metric === "points"
      ? Math.max(0, above.points - (me?.points || 0))
      : Math.max(0, above.approvedReferrals - (me?.approvedReferrals || 0))
    : 0;

  if (loading) return <PageLoader label={t("common.loading")} />;
  if (error) {
    return (
      <SectionCard className="py-16 text-center">
        <p className="text-sm text-ink/55">{error}</p>
        <Button className="mt-5" variant="outline" onClick={load}>
          {t("common.retry")}
        </Button>
      </SectionCard>
    );
  }

  const podium = rows.slice(0, 3);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("dashboard.nav.ranking")}
        title={t("dashboard.rankingTitle")}
        text={t("dashboard.rankingSubtitle")}
        actions={
          <Button as={Link} to="/dashboard/points" variant="outline" size="sm" icon={Sparkles}>
            {t("dashboard.viewPoints")}
          </Button>
        }
      />

      {me ? (
        <div className="relative overflow-hidden rounded-2xl bg-ink p-5 text-cream">
          <div className="pointer-events-none absolute inset-0 pattern-dots opacity-30" />
          <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-gold/[0.14] blur-2xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-gold/[0.1] font-display text-lg text-gold-light">
                #{me.rank}
              </span>
              <div>
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-light/65">
                  {t("dashboard.yourPosition")}
                </p>
                <p className="mt-1 font-display text-xl leading-none tracking-[-0.02em]">{me.fullName}</p>
                <p className="mt-1 text-[10.5px] text-cream/35">
                  {t("dashboard.rankedMembers", { count: all.length })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-left sm:text-right">
                <p className="font-display text-2xl leading-none text-gold-light">{valueOf(me)}</p>
                <p className="mt-1 text-[9.5px] uppercase tracking-[0.12em] text-cream/35">{metricLabel}</p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="max-w-[190px]">
                <p className="text-[10px] font-semibold text-cream/60">
                  {above ? t("dashboard.nextUp") : t("dashboard.leader")}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-cream/40">
                  {above ? above.fullName : t("dashboard.leader")}
                </p>
                <p className="mt-1 text-[10px] text-gold-light/60">
                  {above && gap > 0
                    ? t("dashboard.gapToNext", { gap, metric: metricLabel, name: above.fullName })
                    : t("dashboard.nextRankHint")}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {podium.length ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {podium.map((row, index) => {
            const style = PODIUM[index];
            const Icon = style.icon;
            const isMe = String(row.id) === String(user?.id);
            return (
              <div
                key={row.id}
                className={`relative overflow-hidden rounded-2xl border p-5 text-center transition hover:-translate-y-0.5 ${
                  style.order
                } ${style.lift} ${
                  isMe ? "border-gold/50 bg-gold/[0.06]" : "border-ink/[0.07] bg-white shadow-soft"
                }`}
              >
                <span
                  className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${style.badge}`}
                >
                  {row.rank}
                </span>
                <div className="flex justify-center">
                  <Avatar
                    src={row.profileImage}
                    firstName={row.firstName}
                    lastName={row.lastName}
                    size={index === 0 ? "xl" : "lg"}
                    ring={index === 0}
                    className={index === 0 ? "ring-offset-cream" : ""}
                  />
                </div>
                <Icon
                  size={index === 0 ? 19 : 15}
                  className={`mx-auto mt-3 ${index === 0 ? "text-gold" : "text-ink/30"}`}
                />
                <p className="mt-1.5 truncate font-display text-lg leading-tight tracking-[-0.02em]">
                  {row.fullName}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-ink/40">@{row.username}</p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <Badge status={row.role} dot={false} />
                  {isMe && (
                    <span className="rounded-full bg-gold px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.08em] text-ink">
                      {t("dashboard.yourCard")}
                    </span>
                  )}
                </div>
                <p className="mt-3 font-display text-2xl leading-none text-gold-dark">{valueOf(row)}</p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-ink/35">{metricLabel}</p>
                <p className="mt-2 text-[9.5px] text-ink/30">
                  {formatNumber(row.points)} {t("common.points")}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <SectionCard>
          <EmptyState icon={Trophy} title={t("dashboard.rankingEmpty")} />
        </SectionCard>
      )}

      <SectionCard padded={false}>
        <div className="flex flex-col gap-3 border-b border-ink/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-display text-[1.05rem] tracking-[-0.015em]">{t("dashboard.nav.ranking")}</h2>
            <p className="mt-1 text-[11px] text-ink/40">
              {metric === "points" ? t("top.rankedByPoints") : t("top.rankedByReferrals")}
              {data?.updatedAt ? ` · ${relativeTime(data.updatedAt, lang)}` : ""}
            </p>
          </div>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={t("common.search")}
            className="w-full sm:max-w-xs"
          />
        </div>

        {filtered.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[620px]">
                <thead className="bg-cream/50">
                  <tr>
                    <th className="th w-14">#</th>
                    <th className="th">{t("common.member")}</th>
                    <th className="th">{t("common.role")}</th>
                    <th className="th text-right">{t("common.referrals")}</th>
                    <th className="th text-right">{t("common.points")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/[0.055]">
                  {filtered.map((row) => {
                    const isMe = String(row.id) === String(user?.id);
                    return (
                      <tr
                        key={row.id}
                        className={`transition ${isMe ? "bg-gold/[0.06]" : "hover:bg-cream/40"}`}
                      >
                        <td className="td">
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[10.5px] font-bold ${
                              row.rank <= 3 ? "bg-gold/15 text-gold-dark" : "bg-ink/[0.045] text-ink/45"
                            }`}
                          >
                            {row.rank}
                          </span>
                        </td>
                        <td className="td">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={row.profileImage}
                              firstName={row.firstName}
                              lastName={row.lastName}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-[12.5px] font-semibold text-ink/85">
                                {row.fullName}
                                {isMe && (
                                  <span className="ml-1.5 rounded-full bg-gold px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.06em] text-ink">
                                    {t("dashboard.yourCard")}
                                  </span>
                                )}
                              </p>
                              <p className="mt-0.5 truncate text-[10px] text-ink/35">@{row.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="td">
                          <Badge status={row.role} dot={false} />
                        </td>
                        <td className="td text-right">
                          <span className={metric === "referrals" ? "font-bold text-ink/80" : "text-ink/50"}>
                            {formatNumber(row.approvedReferrals)}
                          </span>
                        </td>
                        <td className="td text-right">
                          <span className={metric === "points" ? "font-bold text-gold-dark" : "text-ink/50"}>
                            {formatNumber(row.points)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-ink/[0.055] md:hidden">
              {filtered.map((row) => {
                const isMe = String(row.id) === String(user?.id);
                return (
                  <div key={row.id} className={`flex items-center gap-3 px-4 py-3.5 ${isMe ? "bg-gold/[0.06]" : ""}`}>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        row.rank <= 3 ? "bg-gold/15 text-gold-dark" : "bg-ink/[0.045] text-ink/45"
                      }`}
                    >
                      {row.rank}
                    </span>
                    <Avatar
                      src={row.profileImage}
                      firstName={row.firstName}
                      lastName={row.lastName}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-ink/85">
                        {row.fullName}
                        {isMe && <span className="ml-1 text-[9px] font-bold text-gold-dark">({t("dashboard.yourCard")})</span>}
                      </p>
                      <p className="mt-0.5 truncate text-[9.5px] text-ink/35">@{row.username}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-base leading-none text-gold-dark">{valueOf(row)}</p>
                      <p className="mt-0.5 text-[8.5px] uppercase tracking-[0.08em] text-ink/30">{metricLabel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <EmptyState
            icon={query ? SearchX : Users}
            title={query ? t("common.noResults") : t("dashboard.rankingEmpty")}
          />
        )}
      </SectionCard>
    </div>
  );
}
