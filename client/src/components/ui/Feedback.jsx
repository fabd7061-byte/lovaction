import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import Button from "./Button.jsx";
import Modal from "./Modal.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function EmptyState({ icon: Icon = Inbox, title, text, action, dark = false }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${dark ? "text-white/40" : "text-ink/40"}`}>
      <span
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border ${
          dark ? "border-white/10 bg-white/[0.03] text-gold-light" : "border-ink/[0.08] bg-white text-gold-dark"
        }`}
      >
        <Icon size={24} strokeWidth={1.5} />
      </span>
      <h4 className={`font-display text-lg ${dark ? "text-cream" : "text-ink"}`}>{title}</h4>
      {text && <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Pagination({ page, pages, onChange, dark = false, total, limit }) {
  const { t } = useLanguage();
  if (!pages || pages <= 1) return null;
  const from = (page - 1) * (limit || 10) + 1;
  const to = Math.min(page * (limit || 10), total || page * (limit || 10));

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 px-1 pt-4 ${dark ? "text-white/40" : "text-ink/45"}`}>
      {total ? (
        <p className="text-[11px]">
          {t("common.showing", { from, to, total })}
        </p>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label={t("common.previousPage")}
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition disabled:opacity-30 ${
            dark
              ? "border-white/10 hover:border-gold/50 hover:text-cream"
              : "border-ink/10 bg-white hover:border-gold/50 hover:text-ink"
          }`}
        >
          <ChevronLeft size={15} />
        </button>
        <span className={`px-2 text-[11px] font-semibold ${dark ? "text-cream/70" : "text-ink/70"}`}>
          {page} / {pages}
        </span>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          aria-label={t("common.nextPage")}
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition disabled:opacity-30 ${
            dark
              ? "border-white/10 hover:border-gold/50 hover:text-cream"
              : "border-ink/10 bg-white hover:border-gold/50 hover:text-ink"
          }`}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  text,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  loading = false,
  dark = false,
  children,
}) {
  const { t } = useLanguage();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={text}
      size="sm"
      theme={dark ? "dark" : "light"}
      footer={
        <>
          <Button variant={dark ? "soft-dark" : "soft"} onClick={onClose} disabled={loading}>
            {cancelLabel || t("common.cancel")}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "gold"} onClick={onConfirm} loading={loading}>
            {confirmLabel || t("common.confirm")}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
