import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, CheckCircle2, Clock, SearchX, Sparkles, Trophy, Users, XCircle } from "lucide-react";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import { EmptyState } from "../../components/ui/Feedback.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import { PageLoader } from "../../components/ui/Spinner.jsx";
import PageHeader, { SectionCard } from "../../components/PageHeader.jsx";
import ReferralLinkCard from "../../components/ReferralLinkCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useSite } from "../../context/SiteContext.jsx";
import api, { apiError } from "../../services/api.js";
import { formatDate, formatNumber } from "../../utils/format.js";
import usePageMeta from "../../utils/usePageMeta.js";

const FILTERS = ["all", "approved", "pending", "rejected"];

function personOf(referral) {
  return referral.referredMember || referral.application || {};
}

export default function Referrals() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { settings } = useSite();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  usePageMeta(t("dashboard.referralsTitle"));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/referrals/my");
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

  const referrals = data?.referrals || [];
  const stats = data?.stats || { total: 0, approved: 0, pending: 0, rejected: 0 };

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return referrals.filter((referral) => {
      if (filter !== "all" && referral.status !== filter) return false;
      if (!needle) return true;
      const person = personOf(referral);
      return [person.firstName, person.lastName, person.username].filter(Boolean).some((value) =>
        String(value).toLowerCase().includes(needle)
      );
    });
  }, [referrals, filter, query]);

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

  const rate = stats.total ? Math.round((stats.approved / stats.total) * 100) : 0;
  const breakdown = [
    { key: "approved", icon: CheckCircle2, tone: "bg-emerald-500", value: stats.approved },
    { key: "pending", icon: Clock, tone: "bg-amber-500", value: stats.pending },
    { key: "rejected", icon: XCircle, tone: "bg-crimson", value: stats.rejected },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("dashboard.nav.referrals")}
        title={t("dashboard.referralsTitle")}
        text={t("dashboard.referralsSubtitle")}
        actions={
          <Button as={Link} to="/dashboard/ranking" variant="outline" size="sm" icon={Trophy}>
            {t("dashboard.viewRanking")}
          </Button>
        }
      />

      <SectionCard padded={false} className="overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-y divide-ink/[0.055] sm:grid-cols-4 sm:divide-y-0">
          {[
            { label: t("dashboard.totalInvited"), value: stats.total, icon: Users, tone: "text-ink/55" },
            { label: t("dashboard.approvedCount"), value: stats.approved, icon: BadgeCheck, tone: "text-emerald-600" },
            { label: t("dashboard.pendingCount"), value: stats.pending, icon: Clock, tone: "text-amber-600" },
            { label: t("dashboard.points"), value: formatNumber(data?.points || 0), icon: Sparkles, tone: "text-gold-dark" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-4 py-4 sm:px-5">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/[0.045] ${item.tone}`}>
                <item.icon size={16} />
              </span>
              <div className="min-w-0">
                <p className="font-display text-xl leading-none tracking-[-0.02em]">{item.value}</p>
                <p className="mt-1 truncate text-[10px] font-medium uppercase tracking-[0.1em] text-ink/40">
                  {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <ReferralLinkCard
          referralLink={`/join?ref=${user?.username || ""}`}
          username={user?.username}
          pointsPerReferral={settings.pointsPerReferral}
        />

        <SectionCard>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-dark/70">
                {t("dashboard.referralBreakdown")}
              </p>
              <p className="mt-1.5 font-display text-2xl leading-none tracking-[-0.03em]">{rate}%</p>
              <p className="mt-1 text-[10.5px] text-ink/40">{t("dashboard.approved")}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold-dark">
              <BadgeCheck size={18} />
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/[0.06]">
            <div className="h-full rounded-full bg-gold-gradient" style={{ width: `${rate}%` }} />
          </div>
          <div className="mt-4 space-y-2.5">
            {breakdown.map((item) => (
              <div key={item.key} className="flex items-center gap-2.5">
                <span className={`h-1.5 w-1.5 rounded-full ${item.tone}`} />
                <span className="flex-1 text-[11px] text-ink/50">{t(`status.${item.key}`)}</span>
                <span className="text-[11.5px] font-semibold text-ink/75">{item.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-ink/[0.06] pt-3 text-[10.5px] leading-relaxed text-ink/35">
            {t("dashboard.pointsRuleText", { points: settings.pointsPerReferral })}
          </p>
        </SectionCard>
      </div>

      <SectionCard padded={false}>
        <div className="flex flex-col gap-3 border-b border-ink/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex flex-wrap gap-1 rounded-full border border-ink/[0.07] bg-cream/70 p-1">
            {FILTERS.map((key) => {
              const count = key === "all" ? stats.total : stats[key] || 0;
              const active = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-full px-3 py-1.5 text-[10.5px] font-semibold transition ${
                    active ? "bg-ink text-cream shadow-sm" : "text-ink/45 hover:text-ink"
                  }`}
                >
                  {key === "all" ? t("common.all") : t(`status.${key}`)}
                  <span className={`ml-1.5 ${active ? "text-cream/45" : "text-ink/30"}`}>{count}</span>
                </button>
              );
            })}
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
              <table className="w-full min-w-[560px]">
                <thead className="bg-cream/50">
                  <tr>
                    <th className="th">{t("dashboard.person")}</th>
                    <th className="th">{t("common.status")}</th>
                    <th className="th">{t("common.date")}</th>
                    <th className="th text-right">{t("dashboard.pointsEarned")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/[0.055]">
                  {filtered.map((referral) => {
                    const person = personOf(referral);
                    const isApplicant = !referral.referredMember;
                    return (
                      <tr key={referral._id} className="transition hover:bg-cream/40">
                        <td className="td">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={person.profileImage}
                              firstName={person.firstName}
                              lastName={person.lastName}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-[12.5px] font-semibold text-ink/85">
                                {person.firstName ? `${person.firstName} ${person.lastName || ""}` : "—"}
                              </p>
                              <p className="mt-0.5 text-[10px] text-ink/35">
                                {isApplicant ? t("dashboard.applicant") : `@${person.username || "member"}`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="td">
                          <Badge status={referral.status} />
                        </td>
                        <td className="td">
                          <p className="text-[11.5px] text-ink/60">
                            {formatDate(referral.approvedAt || referral.createdAt, lang)}
                          </p>
                          <p className="mt-0.5 text-[9.5px] text-ink/30">
                            {referral.status === "approved" ? t("dashboard.approved") : t("dashboard.awaitingReview")}
                          </p>
                        </td>
                        <td className="td text-right">
                          {referral.status === "approved" && referral.pointsAwarded ? (
                            <span className="inline-flex items-center gap-1 text-[12px] font-bold text-gold-dark">
                              <Sparkles size={11} /> +{referral.pointsAwarded}
                            </span>
                          ) : (
                            <span className="text-[11px] text-ink/25">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-ink/[0.055] md:hidden">
              {filtered.map((referral) => {
                const person = personOf(referral);
                return (
                  <div key={referral._id} className="flex items-center gap-3 px-4 py-3.5">
                    <Avatar
                      src={person.profileImage}
                      firstName={person.firstName}
                      lastName={person.lastName}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-ink/85">
                        {person.firstName ? `${person.firstName} ${person.lastName || ""}` : "—"}
                      </p>
                      <p className="mt-0.5 text-[10px] text-ink/35">
                        {formatDate(referral.approvedAt || referral.createdAt, lang)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge status={referral.status} dot={false} />
                      {referral.status === "approved" && referral.pointsAwarded ? (
                        <span className="text-[10px] font-bold text-gold-dark">+{referral.pointsAwarded}</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <EmptyState
            icon={query || filter !== "all" ? SearchX : Users}
            title={query || filter !== "all" ? t("common.noResults") : t("dashboard.emptyReferrals")}
            text={query || filter !== "all" ? undefined : t("dashboard.shareText")}
          />
        )}
      </SectionCard>
    </div>
  );
}
