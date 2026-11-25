import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  HandHeart,
  SearchX,
  Sparkles,
  Trophy,
  UserPlus,
  XCircle,
} from "lucide-react";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import { EmptyState } from "../../components/ui/Feedback.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import { PageLoader } from "../../components/ui/Spinner.jsx";
import PageHeader, { SectionCard } from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useSite } from "../../context/SiteContext.jsx";
import api, { apiError } from "../../services/api.js";
import { formatDateTime, formatNumber } from "../../utils/format.js";
import usePageMeta from "../../utils/usePageMeta.js";

const FILTERS = ["all", "earned", "deducted"];

function typeLabel(type, t) {
  const map = {
    referral: t("dashboard.referral"),
    adjustment: t("dashboard.adjustment"),
    bonus: t("admin.points.typeBonus"),
    penalty: t("admin.points.typePenalty"),
  };
  return map[type] || type;
}

export default function Points() {
  const { t, lang } = useLanguage();
  const { settings } = useSite();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  usePageMeta(t("dashboard.pointsTitle"));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/points/my");
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

  const transactions = data?.transactions || [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (filter === "earned" && tx.points <= 0) return false;
      if (filter === "deducted" && tx.points >= 0) return false;
      if (!needle) return true;
      return String(tx.description || "").toLowerCase().includes(needle);
    });
  }, [transactions, filter, query]);

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

  const balance = data?.balance || 0;
  const earned = data?.earned || 0;
  const deducted = data?.deducted || 0;
  const rank = data?.rank;
  const totalRanked = data?.totalRanked || 0;

  const steps = [
    { icon: UserPlus, title: t("dashboard.invite"), text: t("dashboard.actionInviteText") },
    { icon: BadgeCheck, title: t("dashboard.approved"), text: t("dashboard.referralsLinkHint") },
    { icon: Sparkles, title: t("dashboard.points"), text: t("dashboard.pointsRuleText", { points: settings.pointsPerReferral }) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("dashboard.nav.points")}
        title={t("dashboard.pointsTitle")}
        text={t("dashboard.pointsSubtitle")}
        actions={
          <Button as={Link} to="/dashboard/ranking" variant="outline" size="sm" icon={Trophy}>
            {t("dashboard.viewRanking")}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("dashboard.balance")}
          value={formatNumber(balance)}
          note={t("dashboard.pointsBalance")}
          icon={Sparkles}
          tone="gold"
        />
        <StatCard
          label={t("dashboard.earned")}
          value={formatNumber(earned)}
          note={t("dashboard.pointsEarned")}
          icon={ArrowUpRight}
          tone="green"
        />
        <StatCard
          label={t("dashboard.deducted")}
          value={formatNumber(deducted)}
          note={t("dashboard.adjustment")}
          icon={ArrowDownRight}
          tone="red"
        />
        <StatCard
          label={t("dashboard.rank")}
          value={rank ? `#${rank}` : "—"}
          note={t("dashboard.ofMembers", { count: totalRanked })}
          icon={Trophy}
          tone="blue"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.55fr]">
        <div className="relative overflow-hidden rounded-2xl bg-ink p-5 text-cream">
          <div className="pointer-events-none absolute inset-0 pattern-dots opacity-30" />
          <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-gold/[0.12] blur-2xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-light/75">
              <HandHeart size={11} /> {t("dashboard.pointsRuleTitle")}
            </span>
            <p className="mt-2 font-display text-xl leading-snug tracking-[-0.02em]">
              {t("dashboard.pointsRuleText", { points: settings.pointsPerReferral })}
            </p>
            <div className="mt-5 space-y-3">
              {steps.map((step, index) => (
                <div key={step.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.08] text-[10px] font-bold text-gold-light">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[11.5px] font-semibold text-cream/80">{step.title}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-cream/35">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button as={Link} to="/dashboard/referrals" variant="gold" size="sm" className="mt-5">
              {t("dashboard.invite")}
            </Button>
          </div>
        </div>

        <SectionCard padded={false}>
          <div className="flex flex-col gap-3 border-b border-ink/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="font-display text-[1.05rem] tracking-[-0.015em]">{t("dashboard.history")}</h2>
              <p className="mt-1 text-[11.5px] text-ink/45">
                {t("dashboard.pointsSubtitle")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1 rounded-full border border-ink/[0.07] bg-cream/70 p-1">
              {FILTERS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-full px-3 py-1.5 text-[10.5px] font-semibold transition ${
                    filter === key ? "bg-ink text-cream shadow-sm" : "text-ink/45 hover:text-ink"
                  }`}
                >
                  {key === "all"
                    ? t("common.all")
                    : key === "earned"
                      ? t("dashboard.earned")
                      : t("dashboard.deducted")}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 pb-4 pt-3 sm:px-5">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder={t("common.search")}
              className="mb-3 sm:max-w-xs"
            />
            {filtered.length ? (
              <div className="space-y-1.5">
                {filtered.map((tx) => {
                  const positive = tx.points >= 0;
                  return (
                    <div
                      key={tx._id}
                      className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2.5 transition hover:border-ink/[0.06] hover:bg-cream/50"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          positive ? "bg-emerald-500/10 text-emerald-600" : "bg-crimson/10 text-crimson"
                        }`}
                      >
                        {positive ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-ink/80">{tx.description}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[9.5px] text-ink/35">
                          <span>{formatDateTime(tx.createdAt, lang)}</span>
                          <span className="text-ink/15">·</span>
                          <Badge
                            label={typeLabel(tx.type, t)}
                            tone={tx.type === "referral" ? "gold" : positive ? "green" : "red"}
                            dot={false}
                            className="!px-1.5 !py-0 !text-[8.5px]"
                          />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-[13px] font-bold ${positive ? "text-emerald-600" : "text-crimson"}`}>
                          {positive ? "+" : ""}
                          {tx.points}
                        </p>
                        <p className="mt-0.5 text-[9px] text-ink/30">
                          {t("dashboard.balanceAfter")}: {tx.balanceAfter ?? 0}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={query || filter !== "all" ? SearchX : Sparkles}
                title={query || filter !== "all" ? t("common.noResults") : t("dashboard.emptyPoints")}
              />
            )}
          </div>
        </SectionCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-ink/[0.06] bg-white/60 px-4 py-3 text-[10.5px] text-ink/40">
        <span className="inline-flex items-center gap-1.5">
          <Clock size={12} /> {t("dashboard.referralsLinkHint")}
        </span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-ink/55">
          <Sparkles size={12} className="text-gold-dark" /> {formatNumber(balance)} {t("dashboard.pointsBalance")}
        </span>
      </div>
    </div>
  );
}
