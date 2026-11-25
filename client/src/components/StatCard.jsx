import { ArrowDownRight, ArrowUpRight } from "lucide-react";

const tones = {
  gold: "bg-gold/10 text-gold-dark",
  crimson: "bg-crimson/10 text-crimson",
  green: "bg-emerald-500/10 text-emerald-600",
  blue: "bg-sky-500/10 text-sky-600",
  neutral: "bg-ink/[0.06] text-ink/60",
};

const darkTones = {
  gold: "bg-gold/10 text-gold-light",
  crimson: "bg-crimson/15 text-crimson",
  green: "bg-emerald-400/10 text-emerald-300",
  blue: "bg-sky-400/10 text-sky-300",
  neutral: "bg-white/[0.06] text-white/60",
};

export default function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone = "gold",
  dark = false,
  trend,
  className = "",
}) {
  const palette = dark ? darkTones : tones;
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-4 transition duration-300 ${
        dark
          ? "border-white/[0.07] bg-ink-card hover:border-gold/25"
          : "border-ink/[0.07] bg-white shadow-soft hover:-translate-y-0.5 hover:shadow-lift"
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={`text-[10.5px] font-semibold uppercase tracking-[0.13em] ${dark ? "text-white/40" : "text-ink/45"}`}>
          {label}
        </p>
        {Icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${palette[tone] || palette.gold}`}>
            <Icon size={16} strokeWidth={1.8} />
          </span>
        )}
      </div>
      <p className={`mt-3 font-display text-[1.85rem] leading-none tracking-[-0.03em] ${dark ? "text-cream" : "text-ink"}`}>
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {typeof trend === "number" && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold ${
              trend >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-crimson/10 text-crimson"
            }`}
          >
            {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {Math.abs(trend)}%
          </span>
        )}
        {note && <p className={`text-[10.5px] ${dark ? "text-white/30" : "text-ink/40"}`}>{note}</p>}
      </div>
    </div>
  );
}
