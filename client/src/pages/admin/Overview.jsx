import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  Images,
  MessageSquare,
  Newspaper,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import { EmptyState } from "../../components/ui/Feedback.jsx";
import { PageLoader } from "../../components/ui/Spinner.jsx";
import PageHeader, { CardHeader, SectionCard } from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import AreaChart from "../../components/charts/AreaChart.jsx";
import Donut from "../../components/charts/Donut.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import api, { apiError } from "../../services/api.js";
import { formatDate, formatNumber, relativeTime } from "../../utils/format.js";
import usePageMeta from "../../utils/usePageMeta.js";

const STATUS_COLORS = { active: "#34D399", suspended: "#F87171", inactive: "#94A3B8" };

export default function AdminOverview() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  usePageMeta(t("admin.nav.overview"));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/dashboard/admin");
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

  if (loading) return <PageLoader label={t("common.loading")} dark />;
  if (error) {
    return (
      <SectionCard dark className="py-16 text-center">
        <p className="text-sm text-white/45">{error}</p>
        <Button className="mt-5" variant="outline-light" onClick={load}>
          {t("common.retry")}
        </Button>
      </SectionCard>
    );
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const growth = charts.memberGrowth || [];
  const trend = charts.applicationTrend || [];
  const status = charts.status || [];
  const roles = charts.roles || [];
  const topReferrers = data?.topReferrers || [];
  const recentApplications = data?.recentApplications || [];
  const recentActivity = data?.recentActivity || [];
  const recentMessages = data?.recentMessages || [];

  const totalStatus = status.reduce((sum, item) => sum + item.value, 0);

  const secondary = [
    { label: t("admin.stats.newToday"), value: stats.newToday, icon: UserPlus },
    { label: t("admin.overview.newMembers"), value: stats.newThisMonth, icon: UserCheck },
    { label: t("admin.stats.totalReferrals"), value: stats.totalReferrals, icon: TrendingUp },
    { label: t("admin.stats.totalPoints"), value: stats.totalPoints, icon: Sparkles },
    { label: t("admin.stats.newMessages"), value: stats.newMessages, icon: MessageSquare },
    { label: t("admin.overview.approvalRate"), value: `${stats.approvalRate || 0}%`, icon: ShieldCheck },
  ];

  const quickActions = [
    { to: "/admin/applications", label: t("admin.reviewApplications"), icon: ClipboardList, text: t("admin.stats.pendingApplications") },
    { to: "/admin/members", label: t("admin.manageMembers"), icon: Users, text: t("admin.members.subtitle") },
    { to: "/admin/news", label: t("admin.writeNews"), icon: Newspaper, text: t("admin.news.subtitle") },
    { to: "/admin/reports", label: t("admin.exportReport"), icon: FileText, text: t("admin.reports.subtitle") },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        dark
        eyebrow={t("admin.title")}
        title={t("admin.overview.title", { name: user?.firstName || "" })}
        text={t("admin.overview.subtitle")}
        actions={
          <>
            <Button as={Link} to="/admin/applications" variant="outline-light" size="sm" icon={ClipboardList}>
              {t("admin.reviewApplications")}
            </Button>
            <Button as={Link} to="/admin/reports" size="sm" icon={FileText}>
              {t("admin.exportReport")}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          dark
          label={t("admin.stats.totalMembers")}
          value={formatNumber(stats.totalMembers)}
          note={`${stats.newThisMonth || 0} ${t("admin.overview.newMembers").toLowerCase()}`}
          icon={Users}
          tone="gold"
        />
        <StatCard
          dark
          label={t("admin.stats.activeMembers")}
          value={formatNumber(stats.activeMembers)}
          note={t("admin.overview.communityStatus")}
          icon={UserCheck}
          tone="green"
        />
        <StatCard
          dark
          label={t("admin.stats.pendingApplications")}
          value={formatNumber((stats.pendingApplications || 0) + (stats.underReview || 0))}
          note={`${stats.underReview || 0} ${t("status.under_review").toLowerCase()}`}
          icon={ClipboardList}
          tone="amber"
        />
        <StatCard
          dark
          label={t("admin.stats.totalReferrals")}
          value={formatNumber(stats.totalReferrals)}
          note={`${formatNumber(stats.totalPoints)} ${t("common.points").toLowerCase()}`}
          icon={TrendingUp}
          tone="blue"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        {secondary.map((item) => (
          <div key={item.label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[9px] font-semibold uppercase tracking-[0.1em] text-white/35">{item.label}</p>
              <item.icon size={12} className="shrink-0 text-gold-light/50" />
            </div>
            <p className="mt-1.5 font-display text-lg leading-none text-cream/85">{item.value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <SectionCard dark>
          <CardHeader
            dark
            title={t("admin.chart.memberGrowth")}
            text={t("admin.overview.subtitle")}
            action={<Badge label={`${growth.reduce((s, m) => s + (m.members || 0), 0)} ${t("common.members")}`} tone="gold" dark dot={false} />}
          />
          {growth.length ? (
            <AreaChart
              data={growth}
              series={[{ key: "members", label: t("admin.stats.totalMembers"), color: "#C9972F" }]}
              height={230}
              dark
            />
          ) : (
            <EmptyState dark icon={TrendingUp} title={t("common.noData")} />
          )}
        </SectionCard>

        <SectionCard dark>
          <CardHeader dark title={t("admin.chart.status")} text={t("admin.overview.communityStatus")} />
          {status.length ? (
            <div className="flex flex-col items-center gap-5 sm:flex-row xl:flex-col">
              <Donut
                segments={status.map((s) => ({
                  name: t(`status.${s.name}`),
                  value: s.value,
                  color: STATUS_COLORS[s.name] || "#C9972F",
                }))}
                centerValue={formatNumber(totalStatus)}
                centerLabel={t("common.members")}
                dark
              />
              <div className="w-full space-y-2.5">
                {status.map((item) => (
                  <div key={item.name} className="flex items-center gap-2.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[item.name] || "#C9972F" }}
                    />
                    <span className="flex-1 text-[11px] text-white/45">{t(`status.${item.name}`)}</span>
                    <span className="text-[11.5px] font-semibold text-cream/75">{item.value}</span>
                    <span className="w-9 text-right text-[9.5px] text-white/25">
                      {totalStatus ? Math.round((item.value / totalStatus) * 100) : 0}%
                    </span>
                  </div>
                ))}
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-3">
                  {roles.map((role) => (
                    <span
                      key={role.name}
                      className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[9px] font-semibold text-white/40"
                    >
                      {t(`status.${role.name}`)} · {role.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState dark icon={Users} title={t("common.noData")} />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <SectionCard dark>
          <CardHeader
            dark
            title={t("admin.chart.applications")}
            text={t("admin.applications.subtitle")}
            action={
              <div className="flex flex-wrap gap-3">
                {[
                  { label: t("admin.chart.submitted"), color: "#EAC97A" },
                  { label: t("admin.chart.approved"), color: "#34D399" },
                  { label: t("admin.chart.rejected"), color: "#BF3438" },
                ].map((item) => (
                  <span key={item.label} className="flex items-center gap-1.5 text-[9.5px] text-white/40">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                ))}
              </div>
            }
          />
          {trend.length ? (
            <AreaChart
              data={trend}
              series={[
                { key: "submitted", label: t("admin.chart.submitted"), color: "#EAC97A" },
                { key: "approved", label: t("admin.chart.approved"), color: "#34D399" },
                { key: "rejected", label: t("admin.chart.rejected"), color: "#BF3438" },
              ]}
              height={230}
              dark
            />
          ) : (
            <EmptyState dark icon={ClipboardList} title={t("common.noData")} />
          )}
        </SectionCard>

        <SectionCard dark>
          <CardHeader dark title={t("admin.overview.quickActionsTitle")} text={t("admin.overview.subtitle")} />
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 transition hover:border-gold/30 hover:bg-white/[0.04]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold-light">
                  <action.icon size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11.5px] font-semibold text-cream/80">{action.label}</span>
                  <span className="mt-0.5 block truncate text-[9.5px] text-white/30">{action.text}</span>
                </span>
                <ArrowRight size={13} className="shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-gold-light" />
              </Link>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-gold/20 bg-gold/[0.05] px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-gold-light/70">
              <Trophy size={11} /> {t("admin.topReferrers")}
            </p>
            <div className="mt-2.5 space-y-2">
              {topReferrers.slice(0, 3).map((row) => (
                <div key={row.id} className="flex items-center gap-2">
                  <Avatar src={row.profileImage} firstName={row.firstName} lastName={row.lastName} size="xs" />
                  <span className="min-w-0 flex-1 truncate text-[10.5px] text-cream/65">{row.fullName}</span>
                  <span className="text-[10.5px] font-bold text-gold-light">
                    {data?.rankingMetric === "points" ? row.points : row.approvedReferrals}
                  </span>
                </div>
              ))}
              {!topReferrers.length && <p className="text-[10px] text-white/25">{t("common.noData")}</p>}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <SectionCard dark padded={false}>
          <div className="flex items-center justify-between gap-3 p-4 sm:px-5">
            <CardHeader dark title={t("admin.recentApplications")} text={t("admin.applications.subtitle")} className="!mb-0" />
            <Link to="/admin/applications" className="shrink-0 text-[10.5px] font-semibold text-gold-light/70 hover:text-gold-light">
              {t("admin.viewAll")} →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="border-y border-white/[0.06] bg-white/[0.02]">
                <tr>
                  <th className="admin-th">{t("admin.applications.applicant")}</th>
                  <th className="admin-th">{t("admin.applications.referrer")}</th>
                  <th className="admin-th">{t("common.status")}</th>
                  <th className="admin-th">{t("admin.applications.submitted")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {recentApplications.map((application) => (
                  <tr key={application._id} className="transition hover:bg-white/[0.02]">
                    <td className="admin-td">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={application.profileImage}
                          firstName={application.firstName}
                          lastName={application.lastName}
                          size="xs"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[11.5px] font-semibold text-cream/80">
                            {application.firstName} {application.lastName}
                          </p>
                          <p className="mt-0.5 truncate text-[9.5px] text-white/30">{application.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="admin-td">
                      <span className="text-[10.5px] text-white/45">@{application.referralUsername}</span>
                    </td>
                    <td className="admin-td">
                      <Badge status={application.status} dark />
                    </td>
                    <td className="admin-td">
                      <span className="text-[10.5px] text-white/40">{formatDate(application.createdAt, lang)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!recentApplications.length && <EmptyState dark icon={ClipboardList} title={t("common.noData")} />}
          </div>
        </SectionCard>

        <SectionCard dark>
          <CardHeader
            dark
            title={t("admin.recentActivity")}
            text={t("admin.overview.recentActivity")}
            action={
              <Link to="/admin/audit" className="text-[10px] font-semibold text-gold-light/70 hover:text-gold-light">
                {t("admin.viewAll")} →
              </Link>
            }
          />
          {recentActivity.length ? (
            <div className="relative space-y-0.5 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-white/[0.07]">
              {recentActivity.slice(0, 7).map((log) => (
                <div key={log._id} className="relative flex gap-3 py-2">
                  <span className="z-10 mt-0.5 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-ink-card">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] leading-relaxed text-white/55">{log.description}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[9px] text-white/25">
                      <span className="font-semibold text-gold-light/50">{log.actorName || t("admin.audit.actorSystem")}</span>
                      <span>·</span>
                      <span>{relativeTime(log.createdAt, lang)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState dark icon={ShieldCheck} title={t("admin.overview.noActivity")} />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.6fr]">
        <SectionCard dark>
          <CardHeader
            dark
            title={t("admin.overview.messagesCard")}
            text={t("admin.messages.subtitle")}
            action={
              <Link to="/admin/messages" className="text-[10px] font-semibold text-gold-light/70 hover:text-gold-light">
                {t("admin.viewAll")} →
              </Link>
            }
          />
          {recentMessages.length ? (
            <div className="space-y-1.5">
              {recentMessages.map((message) => (
                <Link
                  key={message._id}
                  to="/admin/messages"
                  className="flex items-start gap-2.5 rounded-xl px-2 py-2.5 transition hover:bg-white/[0.03]"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-[9px] font-bold text-gold-light/70">
                    {message.name?.slice(0, 1)?.toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-cream/75">{message.subject}</p>
                    <p className="mt-0.5 truncate text-[9.5px] text-white/30">{message.name}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge status={message.status} dark dot={false} />
                    <span className="text-[8.5px] text-white/20">{relativeTime(message.createdAt, lang)}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState dark icon={MessageSquare} title={t("admin.messages.empty")} />
          )}
        </SectionCard>

        <SectionCard dark>
          <CardHeader
            dark
            title={t("admin.topReferrers")}
            text={t("admin.referrals.subtitle")}
            action={<Badge label={t("admin.points.leaderboard")} tone="gold" dark dot={false} />}
          />
          {topReferrers.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {topReferrers.map((row) => (
                <Link
                  key={row.id}
                  to={`/admin/members/${row.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-white/[0.055] bg-white/[0.02] px-3 py-2.5 transition hover:border-gold/30"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/10 text-[9.5px] font-bold text-gold-light">
                    {row.rank}
                  </span>
                  <Avatar src={row.profileImage} firstName={row.firstName} lastName={row.lastName} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10.5px] font-semibold text-cream/75">{row.fullName}</p>
                    <p className="truncate text-[8.5px] text-white/30">@{row.username}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] font-bold text-gold-light">
                      {data?.rankingMetric === "points" ? row.points : row.approvedReferrals}
                    </p>
                    <p className="text-[8px] uppercase tracking-[0.08em] text-white/25">
                      {data?.rankingMetric === "points" ? t("common.points") : t("common.referrals")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState dark icon={Trophy} title={t("common.noData")} />
          )}
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-4">
            <Link to="/admin/news" className="flex items-center gap-2 rounded-xl px-2 py-2 text-[10.5px] text-white/45 transition hover:bg-white/[0.03] hover:text-cream">
              <Newspaper size={13} className="text-gold-light/60" />
              {formatNumber(stats.publishedNews)} {t("admin.news.published").toLowerCase()}
            </Link>
            <Link to="/admin/gallery" className="flex items-center gap-2 rounded-xl px-2 py-2 text-[10.5px] text-white/45 transition hover:bg-white/[0.03] hover:text-cream">
              <Images size={13} className="text-gold-light/60" />
              {formatNumber(stats.galleryItems)} {t("admin.stats.galleryItems").toLowerCase()}
            </Link>
          </div>
        </SectionCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[9.5px] text-white/20">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={11} className="text-gold/50" /> {t("admin.overview.subtitle")}
        </span>
        <span>{data?.generatedAt ? relativeTime(data.generatedAt, lang) : ""}</span>
      </div>
    </div>
  );
}
