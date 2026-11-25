import { useEffect, useState } from "react";
import { ArrowRight, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import NewsCard from "../../components/NewsCard.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import { Pagination, EmptyState } from "../../components/ui/Feedback.jsx";
import Button from "../../components/ui/Button.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import usePageMeta from "../../utils/usePageMeta.js";
import api from "../../services/api.js";

const PAGE_SIZE = 9;

export default function News() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  usePageMeta(t("nav.news"));

  useEffect(() => {
    setPage(1);
  }, [category, search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api
      .get("/news", { params: { page, limit: PAGE_SIZE, category, search } })
      .then(({ data }) => {
        if (cancelled) return;
        setItems(data.items || []);
        setCategories(data.categories || []);
        setPagination(data.pagination || { page, pages: 1, total: 0, limit: PAGE_SIZE });
      })
      .catch(() => {
        if (!cancelled) setError(t("common.errorText"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, category, search, t]);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink/[0.06] bg-cream">
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-gold/[0.13] blur-3xl" />
        <div className="container-page relative py-14 sm:py-20">
          <span className="eyebrow">
            <span className="h-1 w-1 rounded-full bg-crimson" />
            {t("news.eyebrow")}
          </span>
          <h1 className="display-lg mt-3 max-w-3xl">{t("news.title")}</h1>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink/55">{t("news.intro")}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={`rounded-full px-3.5 py-2 text-[11px] font-semibold transition ${
                  category === "all"
                    ? "bg-ink text-cream"
                    : "border border-ink/10 bg-white/60 text-ink/55 hover:border-gold/40"
                }`}
              >
                {t("news.allCategories")}
              </button>
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`rounded-full px-3.5 py-2 text-[11px] font-semibold transition ${
                    category === item
                      ? "bg-ink text-cream"
                      : "border border-ink/10 bg-white/60 text-ink/55 hover:border-gold/40"
                  }`}
                >
                  {t(`category.${item}`)}
                </button>
              ))}
            </div>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t("news.searchPlaceholder")}
              className="w-full sm:max-w-xs"
            />
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="container-page">
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-2xl border border-ink/[0.06] bg-white">
                  <div className="aspect-[16/10] animate-pulse bg-ink/[0.06]" />
                  <div className="space-y-3 p-5">
                    <div className="h-2.5 w-1/3 animate-pulse rounded bg-ink/[0.06]" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-ink/[0.06]" />
                    <div className="h-2.5 w-full animate-pulse rounded bg-ink/[0.05]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-crimson/15 bg-crimson/[0.04] px-5 py-10 text-center">
              <p className="text-[13px] text-crimson">{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-ink/[0.06] bg-white shadow-soft">
              <EmptyState
                icon={Newspaper}
                title={search ? t("news.empty") : t("news.emptyTitle")}
                text={t("news.intro")}
                action={
                  (search || category !== "all") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch("");
                        setCategory("all");
                      }}
                    >
                      {t("common.reset")}
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <>
              {items.length > 0 && page === 1 && !search && category === "all" && (
                <div className="mb-8">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-dark">
                    {t("news.featured")}
                  </p>
                  <NewsCard item={items[0]} featured />
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {(page === 1 && !search && category === "all" ? items.slice(1) : items).map((item) => (
                  <NewsCard key={item._id} item={item} />
                ))}
              </div>

              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                limit={pagination.limit}
                onChange={setPage}
              />
            </>
          )}
        </div>
      </section>

      <section className="border-t border-ink/[0.06] bg-ink py-14 text-cream">
        <div className="container-page flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow-light">{t("home.joinEyebrow")}</p>
            <h2 className="mt-2.5 font-display text-2xl leading-tight sm:text-3xl">{t("home.joinTitle")}</h2>
          </div>
          <Button as={Link} to="/join" iconRight={ArrowRight}>
            {t("common.joinUs")}
          </Button>
        </div>
      </section>
    </div>
  );
}
