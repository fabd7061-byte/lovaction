import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function Lightbox({ items = [], index = 0, onClose, onIndex }) {
  const { t } = useLanguage();
  const item = items[index];

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && items.length > 1) onIndex((index - 1 + items.length) % items.length);
      if (event.key === "ArrowRight" && items.length > 1) onIndex((index + 1) % items.length);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [index, items.length, onClose, onIndex]);

  if (!item) return null;

  return createPortal(
    <div className="fixed inset-0 z-[95] flex flex-col bg-ink/96 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <div className="min-w-0">
          <p className="truncate font-display text-lg text-cream">{item.title}</p>
          <p className="mt-0.5 text-[10.5px] uppercase tracking-[0.14em] text-gold-light/60">{item.album}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("gallery.close")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-cream/60 transition hover:border-gold/50 hover:text-cream"
        >
          <X size={18} />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8">
        {items.length > 1 && (
          <button
            type="button"
            onClick={() => onIndex((index - 1 + items.length) % items.length)}
            aria-label={t("gallery.previous")}
            className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-ink/60 text-cream/70 backdrop-blur transition hover:border-gold/60 hover:text-cream sm:left-6"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <figure className="flex h-full max-h-full max-w-6xl flex-col items-center justify-center">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="max-h-[72vh] w-auto max-w-full rounded-xl object-contain shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)]"
          />
          {(item.caption || item.title) && (
            <figcaption className="mt-4 max-w-2xl text-center">
              <p className="text-[13px] leading-relaxed text-cream/70">{item.caption || item.title}</p>
              <p className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-white/30">
                {index + 1} / {items.length}
              </p>
            </figcaption>
          )}
        </figure>

        {items.length > 1 && (
          <button
            type="button"
            onClick={() => onIndex((index + 1) % items.length)}
            aria-label={t("gallery.next")}
            className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-ink/60 text-cream/70 backdrop-blur transition hover:border-gold/60 hover:text-cream sm:right-6"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
