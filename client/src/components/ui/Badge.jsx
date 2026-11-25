import { statusTone } from "../../utils/format.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

const light = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  blue: "border-sky-200 bg-sky-50 text-sky-700",
  red: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-ink/10 bg-ink/[0.04] text-ink/60",
  gold: "border-gold/30 bg-gold/10 text-gold-dark",
};

const dark = {
  green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  amber: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  blue: "border-sky-300/20 bg-sky-300/10 text-sky-200",
  red: "border-red-400/20 bg-red-400/10 text-red-300",
  neutral: "border-white/10 bg-white/[0.04] text-white/55",
  gold: "border-gold/30 bg-gold/10 text-gold-light",
};

const dotColors = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  blue: "bg-sky-500",
  red: "bg-red-500",
  neutral: "bg-ink/30",
  gold: "bg-gold",
};

const statusLabels = {
  pending: "Pending",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  active: "Active",
  suspended: "Suspended",
  inactive: "Inactive",
  draft: "Draft",
  published: "Published",
  new: "New",
  read: "Read",
  replied: "Replied",
  founder: "Founder",
  admin: "Admin",
  member: "Member",
};

export default function Badge({
  status,
  label,
  tone,
  dark: isDark = false,
  dot = true,
  className = "",
}) {
  const { t } = useLanguage();
  const resolvedTone = tone || statusTone(status);
  const palette = isDark ? dark : light;
  const text =
    label ||
    (status
      ? t(`status.${status}`) !== `status.${status}`
        ? t(`status.${status}`)
        : statusLabels[status]
      : "");

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold capitalize leading-none ${
        palette[resolvedTone] || palette.neutral
      } ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            isDark
              ? resolvedTone === "green"
                ? "bg-emerald-400"
                : resolvedTone === "amber"
                  ? "bg-amber-300"
                  : resolvedTone === "blue"
                    ? "bg-sky-300"
                    : resolvedTone === "red"
                      ? "bg-red-400"
                      : resolvedTone === "gold"
                        ? "bg-gold-light"
                        : "bg-white/30"
              : dotColors[resolvedTone] || dotColors.neutral
          }`}
        />
      )}
      {text}
    </span>
  );
}
