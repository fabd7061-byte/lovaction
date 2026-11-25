import { useState } from "react";
import { Check, Copy, Link2, Share2, Sparkles } from "lucide-react";
import Button from "./ui/Button.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { copyText } from "../utils/format.js";

export default function ReferralLinkCard({
  referralLink,
  username,
  pointsPerReferral,
  compact = false,
  className = "",
}) {
  const { t } = useLanguage();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const relative = referralLink || (username ? `/join?ref=${username}` : "");
  const absolute = relative.startsWith("http")
    ? relative
    : `${window.location.origin}${relative.startsWith("/") ? "" : "/"}${relative}`;

  const copy = async () => {
    try {
      await copyText(absolute);
      setCopied(true);
      toast.success(t("dashboard.copyLinkSuccess"));
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error(t("common.errorText"));
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Lovaction Ministries",
          text: t("dashboard.shareText"),
          url: absolute,
        });
        return;
      } catch {
        // User cancelled the share sheet.
      }
    }
    copy();
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-ink p-5 text-cream ${className}`}>
      <div className="pointer-events-none absolute inset-0 pattern-dots opacity-35" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/[0.12] blur-2xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold-light/70">
              <Link2 size={11} /> {t("dashboard.referralLink")}
            </span>
            <p className="mt-1.5 text-[11px] leading-relaxed text-cream/40">
              {compact ? t("dashboard.shareText") : t("dashboard.referralLinkHint")}
            </p>
          </div>
          {pointsPerReferral ? (
            <span className="hidden shrink-0 items-center gap-1 rounded-full border border-gold/25 bg-gold/[0.08] px-2.5 py-1 text-[9.5px] font-semibold text-gold-light sm:flex">
              <Sparkles size={10} /> +{pointsPerReferral}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.14em] text-white/25">URL</span>
            <p className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-cream/60">{absolute}</p>
          </div>
          <Button onClick={copy} variant="gold" size="sm" icon={copied ? Check : Copy} className="shrink-0">
            {copied ? t("common.copied") : t("common.copyLink")}
          </Button>
          <button
            type="button"
            onClick={share}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-cream/50 transition hover:border-gold/40 hover:text-cream sm:flex"
            aria-label={t("common.share")}
          >
            <Share2 size={14} />
          </button>
        </div>

        {!compact && (
          <p className="mt-3 text-[10px] leading-relaxed text-cream/25">{t("dashboard.referralsLinkHint")}</p>
        )}
      </div>
    </div>
  );
}
