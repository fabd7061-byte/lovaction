import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Lock, Network } from "lucide-react";
import MemberTree from "../../components/MemberTree.jsx";
import Button from "../../components/ui/Button.jsx";
import { PageLoader } from "../../components/ui/Spinner.jsx";
import { EmptyState } from "../../components/ui/Feedback.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import usePageMeta from "../../utils/usePageMeta.js";
import api from "../../services/api.js";

function countNodes(nodes) {
  return nodes.reduce((sum, node) => sum + 1 + countNodes(node.children || []), 0);
}

export default function Members() {
  const { t } = useLanguage();
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [disabled, setDisabled] = useState(false);

  usePageMeta(t("nav.members"));

  useEffect(() => {
    let cancelled = false;
    api
      .get("/public/tree")
      .then(({ data }) => {
        if (!cancelled) setTree(data.tree || []);
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

  const total = useMemo(() => countNodes(tree), [tree]);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink/[0.06] bg-cream">
        <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-gold/[0.13] blur-3xl" />
        <div className="container-page relative grid gap-8 py-14 sm:py-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <span className="eyebrow">
              <span className="h-1 w-1 rounded-full bg-crimson" />
              {t("members.eyebrow")}
            </span>
            <h1 className="display-lg mt-3 max-w-3xl">{t("members.title")}</h1>
            <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink/55">{t("members.intro")}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-3.5 py-2 text-[11px] font-medium text-ink/55">
                <Network size={13} className="text-gold-dark" />
                {t("members.count", { count: total })}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-3.5 py-2 text-[11px] font-medium text-ink/55">
                <Lock size={12} className="text-gold-dark" />
                {t("members.safeNote")}
              </span>
            </div>
          </div>
          <div className="hidden justify-end lg:flex">
            <div className="relative flex h-40 w-40 items-center justify-center">
              <span className="absolute inset-0 rounded-full border border-gold/30" />
              <span className="absolute inset-6 rounded-full border border-gold/20" />
              <span className="absolute inset-12 rounded-full bg-gold/10" />
              <Network size={44} strokeWidth={1.1} className="relative text-gold-dark" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="container-page">
          {loading ? (
            <PageLoader label={t("common.loadingPage")} />
          ) : disabled ? (
            <div className="rounded-3xl border border-ink/[0.06] bg-white shadow-soft">
              <EmptyState
                icon={Lock}
                title={t("members.treeTitle")}
                text={t("members.treeText")}
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
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-ink/40">{t("members.treeNote")}</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-dark">
                  {t("members.treeTitle")}
                </p>
              </div>
              <MemberTree tree={tree} compact />
              <p className="mt-3 text-center text-[10px] text-ink/35">{t("members.safeNote")}</p>
            </>
          )}
        </div>
      </section>

      <section className="container-page pb-16 sm:pb-20">
        <div className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-ink p-7 text-cream sm:flex-row sm:items-center sm:p-9">
          <div>
            <h2 className="font-display text-2xl leading-tight sm:text-3xl">{t("members.ctaTitle")}</h2>
            <p className="mt-2 max-w-lg text-[12.5px] text-cream/45">{t("members.ctaText")}</p>
          </div>
          <Button as={Link} to="/join" iconRight={ArrowRight}>
            {t("common.joinUs")}
          </Button>
        </div>
      </section>
    </div>
  );
}
