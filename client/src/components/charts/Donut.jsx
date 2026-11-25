export default function Donut({
  segments = [],
  size = 180,
  thickness = 14,
  centerLabel = "",
  centerValue = 0,
  dark = true,
}) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  let offset = 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={centerLabel}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={dark ? "rgba(255,255,255,0.06)" : "rgba(12,14,20,0.06)"}
          strokeWidth={thickness}
        />
        {total > 0 &&
          segments.map((segment) => {
            const value = Number(segment.value) || 0;
            if (!value) return null;
            const length = (value / total) * circumference;
            const dashOffset = -offset;
            offset += length;
            return (
              <circle
                key={segment.name}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={thickness}
                strokeDasharray={`${Math.max(length - 2, 0)} ${circumference - Math.max(length - 2, 0)}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              >
                <title>{`${segment.name}: ${value}`}</title>
              </circle>
            );
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display text-2xl ${dark ? "text-cream" : "text-ink"}`}>{centerValue}</span>
        {centerLabel && (
          <span className={`mt-0.5 text-[9.5px] uppercase tracking-[0.14em] ${dark ? "text-white/35" : "text-ink/40"}`}>
            {centerLabel}
          </span>
        )}
      </div>
    </div>
  );
}
