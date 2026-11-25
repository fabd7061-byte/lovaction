import { useEffect, useState } from "react";
import { Images, Maximize2 } from "lucide-react";
import Lightbox from "../../components/Lightbox.jsx";
import { EmptyState, Pagination } from "../../components/ui/Feedback.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import usePageMeta from "../../utils/usePageMeta.js";
import api from "../../services/api.js";

const PAGE_SIZE = 24;

export default function Gallery() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [albumCounts, setAlbumCounts] = useState([]);
  const [album, setAlbum] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(null);

  usePageMeta(t("nav.gallery"));

  useEffect(() => {
    setPage(1);
  }, [album]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api
      .get("/gallery", { params: { album, page, limit: PAGE_SIZE } })
      .then(({ data }) => {
        if (cancelled) return;
        setItems(data.items || []);
        setAlbums(data.albums || []);
        setAlbumCounts(data.albumCounts || []);
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
  }, [album, page, t]);

  const countFor = (name) =>
    albumCounts.find((entry) => entry.album === name)?.count || 0;

  return (
    <div>
      <section className="relative overflow-hidden bg-ink py-14 text-cream sm:py-20">
        <div className="pointer-events-none absolute inset-0 pattern-dots opacity-30" />
        <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-gold/[0.1] blur-3xl" />
        <div className="container-page relative">
          <span className="eyebrow-light">
            <span className="h-px w-8 bg-gold/70" />
            {t("gallery.eyebrow")}
          </span>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] tracking-[-0.03em] sm:text-6xl">
            {t("gallery.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-cream/50">{t("gallery.intro")}</p>

          <div className="mt-8 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setAlbum("all")}
              className={`rounded-full px-3.5 py-2 text-[11px] font-semibold transition ${
                album === "all"
                  ? "bg-gold text-ink"
                  : "border border-white/10 bg-white/[0.03] text-cream/50 hover:border-gold/40 hover:text-cream"
              }`}
            >
              {t("gallery.allAlbums")}
            </button>
            {albums.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setAlbum(name)}
                className={`rounded-full px-3.5 py-2 text-[11px] font-semibold transition ${
                  album === name
                    ? "bg-gold text-ink"
                    : "border border-white/10 bg-white/[0.03] text-cream/50 hover:border-gold/40 hover:text-cream"
                }`}
              >
                {name}
                <span className={`ml-1.5 text-[9px] ${album === name ? "text-ink/45" : "text-white/25"}`}>
                  {countFor(name)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="container-page">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className={`animate-pulse rounded-2xl bg-ink/[0.06] ${
                    index % 7 === 0 ? "aspect-[3/4]" : "aspect-[4/3]"
                  }`}
                />
              ))}
            </div>
          ) : error ? (
            <p className="rounded-2xl border border-crimson/15 bg-crimson/[0.04] px-5 py-10 text-center text-[13px] text-crimson">
              {error}
            </p>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-ink/[0.06] bg-white shadow-soft">
              <EmptyState icon={Images} title={t("gallery.emptyTitle")} text={t("gallery.empty")} />
            </div>
          ) : (
            <>
              <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[210px] sm:grid-cols-3 lg:grid-cols-4">
                {items.map((item, index) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setLightbox(index)}
                    className={`group relative overflow-hidden rounded-2xl text-left ${
                      index % 11 === 0 ? "row-span-2" : ""
                    } ${index === 0 ? "sm:col-span-2" : ""}`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/5 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                    <span className="absolute right-3 top-3 flex h-8 w-8 translate-y-1 items-center justify-center rounded-full border border-white/20 bg-ink/40 text-cream opacity-0 backdrop-blur transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <Maximize2 size={13} />
                    </span>
                    <span className="absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <span className="block text-[9px] font-semibold uppercase tracking-[0.14em] text-gold-light">
                        {item.album}
                      </span>
                      <span className="mt-1 block font-display text-[15px] leading-tight text-cream">
                        {item.title}
                      </span>
                    </span>
                  </button>
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

      {lightbox !== null && (
        <Lightbox
          items={items}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndex={setLightbox}
        />
      )}
    </div>
  );
}
