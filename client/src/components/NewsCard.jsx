import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, Clock3 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { formatDate } from "../utils/format.js";

function readTime(content = "") {
  const words = String(content).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function NewsCard({ item, featured = false, compact = false, dark = false }) {
  const { t, lang } = useLanguage();
  if (!item) return null;
  const meta = [formatDate(item.publishedAt || item.createdAt, lang), `${readTime(item.content || item.excerpt)} ${t("news.minRead")}`];

  return (
    <Link
      to={`/news/${item.slug}`}
      className={`group flex flex-col overflow-hidden rounded-2xl border transition duration-300 ${
        dark
          ? "border-white/[0.07] bg-ink-card hover:border-gold/30"
          : "border-ink/[0.07] bg-white shadow-soft hover:-translate-y-1 hover:shadow-lift"
      } ${featured ? "sm:grid sm:grid-cols-[1.15fr_1fr]" : ""}`}
    >
      <div className={`relative overflow-hidden bg-ink/5 ${featured ? "aspect-[16/10] sm:h-full sm:min-h-[280px]" : compact ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
        {item.coverImage ? (
          <img
            src={item.coverImage}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink via-ink-soft to-ink-card">
            <span className="font-display text-4xl text-gold/40">L</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-70" />
        <span className="absolute left-3.5 top-3.5 rounded-full border border-white/20 bg-ink/55 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-cream backdrop-blur">
          {t(`category.${item.category}`)}
        </span>
        {item.status === "draft" && (
          <span className="absolute right-3.5 top-3.5 rounded-full bg-crimson px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-white">
            {t("status.draft")}
          </span>
        )}
      </div>

      <div className={`flex flex-1 flex-col p-5 ${featured ? "sm:justify-center sm:p-7" : ""}`}>
        <div className={`flex items-center gap-3 text-[10px] ${dark ? "text-white/35" : "text-ink/40"}`}>
          <span className="flex items-center gap-1"><CalendarDays size={11} /> {meta[0]}</span>
          <span className="h-1 w-1 rounded-full bg-gold/60" />
          <span className="flex items-center gap-1"><Clock3 size={11} /> {meta[1]}</span>
        </div>
        <h3
          className={`mt-2.5 font-display leading-[1.16] tracking-[-0.02em] transition group-hover:text-gold-dark ${
            featured ? "text-2xl sm:text-[1.8rem]" : "text-[1.15rem]"
          } ${dark ? "text-cream group-hover:text-gold-light" : "text-ink"}`}
        >
          {item.title}
        </h3>
        <p className={`mt-2.5 line-clamp-3 text-[12.5px] leading-relaxed ${dark ? "text-white/40" : "text-ink/50"}`}>
          {item.excerpt}
        </p>
        <div className={`mt-4 flex items-center justify-between gap-3 pt-1 text-[11px] ${dark ? "text-gold-light/70" : "text-gold-dark"}`}>
          <span className="font-semibold">{t("news.readStory")}</span>
          <ArrowUpRight size={15} className="transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

export { readTime };
