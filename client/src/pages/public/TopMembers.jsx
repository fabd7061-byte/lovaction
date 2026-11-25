import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Crown, Lock, Medal, Sparkles, Trophy } from "lucide-react";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import { EmptyState } from "../../components/ui/Feedback.jsx";
import { PageLoader } from "../../components/ui/Spinner.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { formatDate, formatNumber } from "../../utils/format.js";
import usePageMeta from "../../utils/usePageMeta.js";
import api from "../../services/api.js";

const PODIUM_STYLES = [
  { order: "sm:order-2", height: "sm:-mt-8", tone: "from-gold-light/90 to-gold/60", ring: "ring-gold/60", icon: Crown },
  { order: "sm:order-1", height: "", tone: "from-cream to-cream-deep", ring: "ring-ink/10", icon: Medal },
  { order: "sm:order-3", height: "", tone: "from-cream to-cream-deep", ring: "ring-ink/10", icon: Medal },
];

export default function TopMembers() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [disabled, setDisabled] = useState(false);

  usePageMeta(t("nav.topMembers"));

  useEffect(() => {
    let cancelled = false;
    api
      .get("/public/leaderboard", { params: { limit: 30 } })
      .then(({ data: payload }) => {
        if (!cancelled) setData(payload);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.response?.status === 403) setDisabled(true);
        else setError(err?.response?.data?.message || t("common.errorText"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const rows = data?.rows || [];
  const podium = [rows[0], rows[1], rows[2]];
  const rest = rows.slice(3);
  const metric = data?.metric || "referrals";

  const metricValue = (row) =>
    metric === "points" ? formatNumber(row.points) : formatNumber(row.approvedReferrals);
  const metricLabel = metric === "points" ? t("top.points") : t("top.referrals");

  return (
    <div>
      <section className="relative overflow-hidden bg-ink py-14 text-cream sm:py-20">
        <div className="pointer-events-none absolute inset-0 pattern-dots opacity-30" />
        <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-gold/[0.1] blur-3xl" />
        <div className="container-page relative">
          <span className="eyebrow-light">
            <span className="h-px w-8 bg-gold/70" />
            {t("top.eyebrow")}
          </span>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] tracking-[-0.03em] sm:text-6xl">
            {t("top.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-cream/50">{t("top.intro")}</p>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-[10.5px] text-cream/35">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/[0.06] px-3 py-1.5 text-gold-light/80">
              <Trophy size={12} />
              {metric === "points" ? t("top.rankedByPoints") : t("top.rankedByReferrals")}
            </span>
            <span>{t("top.podiumNote")}</span>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container-page">
          {loading ? (
            <PageLoader label={t("common.loadingPage")} />
          ) : disabled ? (
            <div className="rounded-3xl border border-ink/[0.06] bg-white shadow-soft">
              <EmptyState
                icon={Lock}
                title={t("top.title")}
                text={t("top.empty")}
                action={
                  <Button as={Link} to="/contact" variant="outline">
                    {t("common.contactUs")}
                  </Button>
                }
              />
            </div>
          ) : error ? (
            <p className="rounded-2xl border border-crimson/15 bg-crimson/[0.04] px-5 py-10 text-center text-[13px] text-crimson">
              {error}
            </p>
          ) : rows.length === 0 ? (
            <div className="rounded-3xl border border-ink/[0.06] bg-white shadow-soft">
              <EmptyState
                icon={Trophy}
                title={t("top.emptyTitle")}
                text={t("top.empty")}
                action={
                  <Button as={Link} to="/join" iconRight={ArrowRight}>
                    {t("common.joinUs")}
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="grid items-end gap-4 sm:grid-cols-3">
                {podium.map((row, index) => {
                  if (!row) return <div key={index} className="hidden sm:block" />;
                  const style = PODIUM_STYLES[index];
                  const isMe = user && String(user.id) === String(row.id);
                  return (
                    <div
                      key={row.id}
                      className={`relative flex flex-col items-center rounded-3xl border bg-gradient-to-b px-5 pb-6 pt-7 shadow-soft ${style.order} ${style.height} ${
                        index === 0 ? "border-gold/40" : "border-ink/[0.07]"
                      }`}
                    >
                      {isMe && (
                        <span className="absolute right-3 top-3 rounded-full bg-ink px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.1em] text-gold-light">
                          {t("top.youTag")}
                        </span>
                      )}
                      <span className="flex h-8 items-center gap-1.5 rounded-full bg-ink px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-gold-light">
                        <style.icon size={12} /> #{row.rank}
                      </span>
                      <div className="mt-4">
                        <Avatar
                          src={row.profileImage}
                          firstName={row.firstName}
                          lastName={row.lastName}
                          size={index === 0 ? "2xl" : "xl"}
                          ring={index === 0}
                        />
                      </div>
                      <p className="mt-3 text-center font-display text-lg leading-tight text-ink">{row.fullName}</p>
                      <p className="mt-0.5 text-[10px] text-ink/40">@{row.username}</p>
                      <p className="mt-3 font-display text-2xl leading-none text-ink">{metricValue(row)}</p>
                      <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-ink/40">
                        {metricLabel}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge status={row.role} label={t(`status.${row.role}`)} />
                        <span className="text-[9.5px] text-ink/35">
                          {row.approvedReferrals} {t("members.referrals")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {rest.length > 0 && (
                <div className="mt-8 overflow-hidden rounded-2xl border border-ink/[0.07] bg-white shadow-soft">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead className="border-b border-ink/[0.06] bg-cream-soft/60">
                        <tr>
                          <th className="th w-16">{t("top.rank")}</th>
                          <th className="th">{t("top.member")}</th>
                          <th className="th">{t("top.referrals")}</th>
                          <th className="th">{t("common.points")}</th>
                          <th className="th">{t("top.joined")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/[0.05]">
                        {rest.map((row) => {
                          const isMe = user && String(user.id) === String(row.id);
                          return (
                            <tr key={row.id} className={isMe ? "bg-gold/[0.06]" : "transition hover:bg-cream-soft/40"}>
                              <td className="td">
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink/[0.05] text-[11px] font-bold text-ink/55">
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
                                  <div>
                                    <p className="flex items-center gap-2 text-[12.5px] font-semibold text-ink">
                                      {row.fullName}
                                      {isMe && (
                                        <span className="rounded-full bg-gold px-1.5 py-0.5 text-[8px] font-bold uppercase text-ink">
                                          {t("top.youTag")}
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-[10px] text-ink/35">@{row.username}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="td font-semibold text-ink/70">{row.approvedReferrals}</td>
                              <td className="td">
                                <span className="inline-flex items-center gap-1 font-semibold text-gold-dark">
                                  <Sparkles size={11} /> {formatNumber(row.points)}
                                </span>
                              </td>
                              <td className="td text-ink/45">{formatDate(row.joinedAt, lang)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <p className="mt-4 text-center text-[10.5px] text-ink/35">
                {t("top.people", { count: rows.length })} · {t("top.podiumNote")}
              </p>
            </>
          )}
        </div>
      </section>

      <section className="border-t border-ink/[0.06] bg-cream-soft py-12">
        <div className="container-page flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl">{t("members.ctaTitle")}</h2>
            <p className="mt-1.5 text-[12.5px] text-ink/45">{t("members.ctaText")}</p>
          </div>
          <Button as={Link} to="/join" variant="dark" iconRight={ArrowRight}>
            {t("common.applyNow")}
          </Button>
        </div>
      </section>
    </div>
  );
}
