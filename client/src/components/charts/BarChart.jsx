import { useId } from "react";

export default function BarChart({ data = [], height = 200, dark = true }) {
  const rawId = useId().replace(/:/g, "");
  const width = 640;
  const padding = { top: 18, right: 8, bottom: 26, left: 8 };
  const chartH = height - padding.top - padding.bottom;
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  const barGap = 8;
  const barWidth = Math.min(30, (width - padding.left - padding.right - barGap * (data.length - 1)) / Math.max(1, data.length));
  const totalWidth = barWidth * data.length + barGap * (data.length - 1);
  const startX = (width - totalWidth) / 2;
  const textColor = dark ? "rgba(255,255,255,0.32)" : "rgba(20,20,26,0.4)";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Bar chart">
      <defs>
        <linearGradient id={`bar-${rawId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EAC97A" />
          <stop offset="100%" stopColor="#A87A22" />
        </linearGradient>
      </defs>
      {data.map((item, index) => {
        const value = Number(item.value) || 0;
        const barHeight = Math.max(value > 0 ? 4 : 1, (value / max) * chartH);
        const x = startX + index * (barWidth + barGap);
        const y = padding.top + chartH - barHeight;
        const isLast = index === data.length - 1;
        return (
          <g key={item.label + index}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={Math.min(5, barWidth / 2)}
              fill={isLast ? "#BF3438" : `url(#bar-${rawId})`}
              opacity={isLast ? 1 : 0.8}
            >
              <title>{`${item.label}: ${value}`}</title>
            </rect>
            {(index % 2 === 0 || isLast) && (
              <text
                x={x + barWidth / 2}
                y={height - 7}
                textAnchor="middle"
                fill={textColor}
                fontSize="8"
              >
                {item.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
