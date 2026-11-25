import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, Eye, Share2 } from "lucide-react";
import Avatar from "../../components/ui/Avatar.jsx";
import Button from "../../components/ui/Button.jsx";
import NewsCard from "../../components/NewsCard.jsx";
import { PageLoader } from "../../components/ui/Spinner.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { copyText, formatDate } from "../../utils/format.js";
import usePageMeta from "../../utils/usePageMeta.js";
import api from "../../services/api.js";
import { readTime } from "../../components/NewsCard.jsx";

export default function NewsDetail() {
  const { slug } = useParams();
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  usePageMeta(data?.news?.title || t("nav.news"));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api
      .get(`/news/${slug}`)
      .then(({ data: payload }) => {
        if (!cancelled) setData(payload);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.message || t("common.notFoundTitle"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, t]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: data?.news?.title, url });
        return;
      }
      await copyText(url);
      toast.success(t("news.linkCopied"));
    } catch {
      // The user may cancel the native share sheet.
    }
  };

  if (loading) return <PageLoader label={t("common.loadingPage")} />;

  if (error || !data?.news) {
    return (
      <div className="container-page py-24 text-center">
        <p className="eyebrow justify-center">{t("nav.news")}</p>
        <h1 className="mt-3 font-display text-4xl">{t("common.notFoundTitle")}</h1>
        <p className="mt-3 text-[13px] text-ink/50">{t("common.notFoundText")}</p>
        <Button as={Link} to="/news" variant="dark" className="mt-6" icon={ArrowLeft}>
          {t("news.back")}
        </Button>
      </div>
    );
  }

  const article = data.news;
  const paragraphs = String(article.content || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div>
      <section className="border-b border-ink/[0.06] bg-cream">
        <div className="container-page py-10 sm:py-14">
          <Link
            to="/news"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/40 transition hover:text-ink"
          >
            <ArrowLeft size={13} /> {t("news.back")}
          </Link>

          <div className="mx-auto mt-7 max-w-4xl text-center">
            <span className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-dark">
              {t(`category.${article.category}`)}
            </span>
            <h1 className="mt-5 font-display text-[2.2rem] leading-[1.06] tracking-[-0.03em] sm:text-5xl">
              {article.title}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[14px] leading-relaxed text-ink/50">{article.excerpt}</p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-ink/40">
              <span className="flex items-center gap-2">
                <Avatar
                  src={article.author?.profileImage}
                  firstName={article.author?.firstName}
                  lastName={article.author?.lastName}
                  size="xs"
                />
                {t("news.byAuthor", {
                  name: article.author ? `${article.author.firstName} ${article.author.lastName}` : "Lovaction Ministries",
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays size={12} /> {formatDate(article.publishedAt || article.createdAt, lang)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock3 size={12} /> {readTime(article.content)} {t("news.minRead")}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye size={12} /> {t("news.views", { count: article.views })}
              </span>
            </div>
          </div>
        </div>
      </section>

      {article.status === "draft" && (
        <div className="container-page pt-6">
          <p className="rounded-xl border border-amber-300/40 bg-amber-50 px-4 py-3 text-[12px] font-medium text-amber-700">
            {t("news.adminDraftNote")}
          </p>
        </div>
      )}

      <article className="container-page py-10 sm:py-14">
        <div className="mx-auto max-w-5xl">
          {article.coverImage && (
            <div className="overflow-hidden rounded-[2rem]">
              <img
                src={article.coverImage}
                alt={article.title}
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
          )}

          <div className="mx-auto mt-10 max-w-3xl">
            <div className="prose-lovaction space-y-5">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className={`text-[14.5px] leading-[1.85] text-ink/70 ${
                    index === 0
                      ? "first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-[3.6rem] first-letter:leading-[0.8] first-letter:text-gold-dark"
                      : ""
                  }`}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-ink/[0.08] pt-6">
              <p className="text-[11px] text-ink/40">{t("news.moreFrom")}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" icon={Share2} onClick={share}>
                  {t("news.share")}
                </Button>
                <Button as={Link} to="/news" variant="soft" size="sm" icon={ArrowLeft}>
                  {t("news.back")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {data.related?.length > 0 && (
        <section className="border-t border-ink/[0.06] bg-cream-soft py-12">
          <div className="container-page">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl tracking-[-0.02em]">{t("news.related")}</h2>
              <Link
                to="/news"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold-dark transition hover:text-ink"
              >
                {t("common.viewAll")} <ArrowRight size={13} />
              </Link>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {data.related.map((item) => (
                <NewsCard key={item._id} item={item} compact />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
