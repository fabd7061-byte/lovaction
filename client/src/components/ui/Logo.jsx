export function LogoMark({ size = 44, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="21.5" stroke="#C9972F" strokeWidth="1.4" />
      <circle cx="24" cy="24" r="18.5" stroke="#EAC97A" strokeOpacity=".22" strokeWidth=".8" />
      <path
        d="M24 34.4c-.7 0-11-7.7-11-14 0-3.8 2.9-6.2 5.9-6.2 2.3 0 4.3 1.4 5.1 3.5.8-2.1 2.8-3.5 5.1-3.5 3 0 5.9 2.4 5.9 6.2 0 6.3-10.3 14-11 14Z"
        fill="#BF3438"
      />
      <path
        d="M14 31.5c5 3.7 15.5 4 21.5-1.2"
        stroke="#C9972F"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeOpacity=".9"
      />
      <path d="M34.8 10.8 24.6 25.2h5.1L20.2 37.4l3-8.4h-4.6l4.8-8.5" fill="#F6E7BF" fillOpacity=".9" />
    </svg>
  );
}

export default function Logo({
  theme = "dark",
  compact = false,
  showMotto = true,
  size = 44,
  className = "",
}) {
  const isDark = theme === "dark";
  const actionColor = isDark ? "text-cream" : "text-ink";

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark size={size} />
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[22px] font-semibold tracking-[-0.035em] ${actionColor}`}>
          <span className="text-crimson">LOV</span>ACTION
        </span>
        <span
          className={`mt-1 flex items-center gap-1.5 text-[8.5px] font-semibold uppercase tracking-[0.38em] ${
            isDark ? "text-gold-light" : "text-gold-dark"
          }`}
        >
          <span className={`h-px w-3 ${isDark ? "bg-gold/60" : "bg-gold/50"}`} />
          Ministries
          <span className={`h-px w-3 ${isDark ? "bg-gold/60" : "bg-gold/50"}`} />
        </span>
        {!compact && showMotto && (
          <span className={`font-script mt-1.5 text-[13px] leading-none ${isDark ? "text-cream/55" : "text-ink/50"}`}>
            Love in Action, Hope for All.
          </span>
        )}
      </span>
    </span>
  );
}
