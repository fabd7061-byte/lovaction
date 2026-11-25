import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const sizes = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  full: "max-w-6xl",
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  theme = "light",
  hideClose = false,
  className = "",
}) {
  const titleId = useId();
  const dark = theme === "dark";

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink/70 backdrop-blur-[3px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={`relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[26px] border shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)] animate-scale-in sm:rounded-[26px] ${
          sizes[size] || sizes.md
        } ${
          dark
            ? "border-white/10 bg-ink-soft text-cream"
            : "border-ink/[0.07] bg-cream text-ink"
        } ${className}`}
      >
        {(title || !hideClose) && (
          <div
            className={`flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6 ${
              dark ? "border-white/[0.08]" : "border-ink/[0.07]"
            }`}
          >
            <div>
              {title && (
                <h2 id={titleId} className={`font-display text-xl tracking-[-0.02em] ${dark ? "text-cream" : "text-ink"}`}>
                  {title}
                </h2>
              )}
              {description && (
                <p className={`mt-1 text-[12.5px] leading-relaxed ${dark ? "text-white/45" : "text-ink/50"}`}>
                  {description}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className={`rounded-full p-2 transition ${
                  dark
                    ? "text-white/40 hover:bg-white/[0.07] hover:text-white"
                    : "text-ink/40 hover:bg-ink/[0.06] hover:text-ink"
                }`}
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer && (
          <div
            className={`flex flex-wrap items-center justify-end gap-2 border-t px-5 py-4 sm:px-6 ${
              dark ? "border-white/[0.08] bg-white/[0.015]" : "border-ink/[0.07] bg-ink/[0.015]"
            }`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
