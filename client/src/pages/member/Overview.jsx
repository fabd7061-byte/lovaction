import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Copy,
  Crown,
  Network,
  Settings,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import { EmptyState } from "../../components/ui/Feedback.jsx";
import { PageLoader } from "../../components/ui/Spinner.jsx";
import PageHeader, { CardHeader, SectionCard } from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import ReferralLinkCard from "../../components/ReferralLinkCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import api, { apiError } from "../../services/api.js";
import { copyText, formatDate, formatNumber, relativeTime } from "../../utils/format.js";
import usePageMeta from "../../utils/usePageMeta.js";

function personOf(referral) {
  return referral.referredMember || referral.application || {};
}

function referralName(referral) {
  const person = personOf(referral);
  return person.firstName ? `${person.firstName} ${person.lastName || ""}`.trim() : "—";
}

export default function Overview() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  usePageMeta(t("dashboard.nav.overview"));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/dashboard/member");
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

  const copyUsername = async () => {
    try {
      await copyText(user?.username || data?.user?.username || "");
      toast.success(t("dashboard.usernameCopied"));
    } catch {
      toast.error(t("common.errorText"));
    }
  };

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

  const stats = data?.stats || { approved: 0, pending: 0, rejected: 0, total: 0 };
  const rankInfo = data?.rankInfo || {};
  const member = data?.user || user;
  const ancestors = data?.ancestors || [];
  const nextRank = data?.nextRank;
  const gap = nextRank?.difference ?? 0;
  const metricLabel =
    nextRank?.metric === "points" ? t("dashboard.pointsMetric") : t("dashboard.referralsMetric");

  const approvedRatio = stats.total ? Math.round((stats.approved / stats.total) * 100) : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("dashboard.nav.overview")}
        title={t("dashboard.welcome", { name: member?.firstName || "" })}
        text={t("dashboard.overviewNote")}
        actions={
          <>
            <Button as={Link} to="/dashboard/referrals" variant="outline" icon={Users} size="sm">
              {t("dashboard.invite")}
            </Button>
            <Button as={Link} to="/dashboard/tree" icon={Network} size="sm">
              {t("dashboard.nav.tree")}
            </Button>
          </>
        }
      />

      {member?.mustChangePassword && (
        <div className="flex flex-col gap-3 rounded-2xl border border-gold/30 bg-gold/[0.07] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
              <Settings size={14} />
            </span>
            <p className="text-[12.5px] font-medium text-ink/70">{t("dashboard.mustChangeBanner")}</p>
          </div>
          <Link to="/dashboard/settings" className="shrink-0 text-[11.5px] font-bold text-gold-dark hover:text-ink">
            {t("dashboard.mustChangeCta")} →
          </Link>
        </div>
      )}

      {member?.status === "suspended" && (
        <div className="rounded-2xl border border-crimson/20 bg-crimson/[0.05] px-4 py-3.5 text-[12.5px] font-medium text-crimson">
          {t("dashboard.suspendedBanner")}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("dashboard.points")}
          value={formatNumber(member?.points ?? 0)}
          note={t("dashboard.balance")}
          icon={Sparkles}
          tone="gold"
        />
        <StatCard
          label={t("dashboard.invited")}
          value={formatNumber(stats.total)}
          note={`${stats.pending} ${t("dashboard.pending").toLowerCase()}`}
          icon={Users}
          tone="blue"
        />
        <StatCard
          label={t("dashboard.approved")}
          value={formatNumber(stats.approved)}
          note={`${approvedRatio}% ${t("dashboard.approved").toLowerCase()}`}
          icon={BadgeCheck}
          tone="green"
        />
        <StatCard
          label={t("dashboard.rank")}
          value={rankInfo.rank ? `#${rankInfo.rank}` : "—"}
          note={t("dashboard.ofMembers", { count: rankInfo.totalRanked || 0 })}
          icon={Trophy}
          tone="red"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <ReferralLinkCard
          referralLink={data?.referralLink}
          username={member?.username}
          pointsPerReferral={data?.pointsPerReferral}
        />

        <div className="relative overflow-hidden rounded-2xl border border-ink/[0.07] bg-white p-5 shadow-soft">
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gold/[0.1] blur-2xl" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-dark/70">
                  {t("dashboard.nextRank")}
                </p>
                <p className="mt-1.5 font-display text-lg leading-tight tracking-[-0.02em]">
                  {nextRank ? nextRank.fullName : t("dashboard.leader")}
                </p>
                <p className="mt-1 text-[11px] text-ink/45">
                  {nextRank ? `@${nextRank.username}` : t("dashboard.rankedMembers", { count: rankInfo.totalRanked || 0 })}
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold-dark">
                <Crown size={18} />
              </span>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-[10.5px] font-semibold text-ink/45">
                <span>{t("dashboard.rankPosition", { rank: rankInfo.rank || "—" })}</span>
                <span>{t("dashboard.ofMembers", { count: rankInfo.totalRanked || 0 })}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/[0.06]">
                <div
                  className="h-full rounded-full bg-gold-gradient transition-all duration-700"
                  style={{
                    width: `${Math.max(
                      6,
                      Math.min(
                        100,
                        rankInfo.rank && rankInfo.totalRanked
                          ? ((rankInfo.totalRanked - rankInfo.rank + 1) / rankInfo.totalRanked) * 100
                          : 6
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            <p className="mt-4 flex-1 text-[11.5px] leading-relaxed text-ink/50">
              {nextRank && gap > 0
                ? t("dashboard.gapToNext", { gap, metric: metricLabel, name: nextRank.fullName })
                : t("dashboard.nextRankHint")}
            </p>

            <Button as={Link} to="/dashboard/ranking" variant="soft" size="sm" iconRight={ArrowRight} className="mt-4 w-fit">
              {t("dashboard.viewRanking")}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <SectionCard>
          <CardHeader
            title={t("dashboard.recentReferrals")}
            text={t("dashboard.referralsSubtitle")}
            action={
              <Link to="/dashboard/referrals" className="text-[11px] font-semibold text-gold-dark hover:text-ink">
                {t("dashboard.viewAll")} →
              </Link>
            }
          />
          {data?.recentReferrals?.length ? (
            <div className="divide-y divide-ink/[0.055]">
              {data.recentReferrals.map((referral) => {
                const person = personOf(referral);
                return (
                  <div key={referral._id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Avatar
                      src={person.profileImage}
                      firstName={person.firstName}
                      lastName={person.lastName}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-ink/85">{referralName(referral)}</p>
                      <p className="mt-0.5 text-[10.5px] text-ink/40">
                        {referral.status === "approved" && referral.approvedAt
                          ? t("dashboard.approvedOn", { date: formatDate(referral.approvedAt, lang) })
                          : relativeTime(referral.createdAt, lang)}
                      </p>
                    </div>
                    {referral.status === "approved" && referral.pointsAwarded ? (
                      <span className="hidden shrink-0 items-center gap-1 rounded-full bg-gold/[0.09] px-2 py-1 text-[10px] font-bold text-gold-dark sm:inline-flex">
                        <Sparkles size={10} /> +{referral.pointsAwarded}
                      </span>
                    ) : null}
                    <Badge status={referral.status} dot={false} className="shrink-0" />
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title={t("dashboard.emptyReferrals")}
              action={
                <Button as={Link} to="/dashboard/referrals" variant="gold" size="sm">
                  {t("dashboard.invite")}
                </Button>
              }
            />
          )}
        </SectionCard>

        <SectionCard>
          <CardHeader
            title={t("dashboard.recentPoints")}
            text={t("dashboard.pointsSubtitle")}
            action={
              <Link to="/dashboard/points" className="text-[11px] font-semibold text-gold-dark hover:text-ink">
                {t("dashboard.viewAll")} →
              </Link>
            }
          />
          {data?.recentPoints?.length ? (
            <div className="space-y-1">
              {data.recentPoints.map((tx) => (
                <div key={tx._id} className="flex items-center gap-3 rounded-xl px-1 py-2.5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      tx.points >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-crimson/10 text-crimson"
                    }`}
                  >
                    {tx.points >= 0 ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] font-medium text-ink/75">{tx.description}</p>
                    <p className="mt-0.5 text-[10px] text-ink/35">{relativeTime(tx.createdAt, lang)}</p>
                  </div>
                  <span
                    className={`shrink-0 text-[12px] font-bold ${
                      tx.points >= 0 ? "text-emerald-600" : "text-crimson"
                    }`}
                  >
                    {tx.points > 0 ? "+" : ""}
                    {tx.points}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Sparkles} title={t("dashboard.emptyPoints")} />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <SectionCard>
          <CardHeader title={t("dashboard.yourPath")} text={t("dashboard.pathText")} />
          {ancestors.length ? (
            <div className="flex flex-wrap items-center gap-2">
              {ancestors.map((person, index) => {
                const isSelf = String(person.id) === String(member?.id || member?._id);
                return (
                  <div key={person.id} className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2 ${
                        isSelf
                          ? "border-gold/40 bg-gold/[0.07]"
                          : "border-ink/[0.07] bg-cream/60"
                      }`}
                    >
                      <Avatar
                        src={person.profileImage}
                        firstName={person.firstName}
                        lastName={person.lastName}
                        size="xs"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold text-ink/80">
                          {isSelf ? t("dashboard.yourCard") : person.fullName}
                        </p>
                        <p className="truncate text-[9px] uppercase tracking-[0.08em] text-ink/35">
                          {person.role === "founder" ? t("dashboard.root") : person.username ? `@${person.username}` : ""}
                        </p>
                      </div>
                    </div>
                    {index < ancestors.length - 1 && <ArrowRight size={12} className="shrink-0 text-gold/60" />}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Network} title={t("dashboard.noTree")} />
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[10.5px] text-ink/40">
            <CalendarDays size={12} />
            {t("dashboard.memberSinceShort", { date: formatDate(member?.joinedAt, lang) })}
            <span className="text-ink/20">·</span>
            <span className="font-mono tracking-wide">{member?.memberCode}</span>
            <button
              type="button"
              onClick={copyUsername}
              className="ml-auto inline-flex items-center gap-1 rounded-full border border-ink/10 px-2.5 py-1 text-[10px] font-semibold text-ink/45 transition hover:border-gold/40 hover:text-ink"
            >
              <Copy size={10} /> @{member?.username}
            </button>
          </div>
        </SectionCard>

        <SectionCard>
          <CardHeader title={t("dashboard.quickActions")} text={t("dashboard.actionInviteText")} />
          <div className="space-y-2">
            {[
              {
                to: "/dashboard/referrals",
                icon: Users,
                title: t("dashboard.nav.referrals"),
                text: t("dashboard.actionInviteText"),
              },
              {
                to: "/dashboard/profile",
                icon: UserRound,
                title: t("dashboard.nav.profile"),
                text: t("dashboard.actionProfileText"),
              },
              {
                to: "/dashboard/tree",
                icon: Network,
                title: t("dashboard.nav.tree"),
                text: t("dashboard.actionTreeText"),
              },
              {
                to: "/dashboard/settings",
                icon: Settings,
                title: t("dashboard.nav.settings"),
                text: t("dashboard.settingsSubtitle"),
              },
            ].map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="group flex items-center gap-3 rounded-xl border border-transparent px-2 py-2.5 transition hover:border-ink/[0.06] hover:bg-cream/60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/[0.045] text-ink/55 transition group-hover:bg-gold/10 group-hover:text-gold-dark">
                  <action.icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold text-ink/80">{action.title}</span>
                  <span className="mt-0.5 block truncate text-[10.5px] text-ink/40">{action.text}</span>
                </span>
                <ArrowRight size={13} className="shrink-0 text-ink/20 transition group-hover:translate-x-0.5 group-hover:text-gold-dark" />
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
