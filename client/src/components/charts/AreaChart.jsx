import { useId } from "react";

function smoothPath(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    path += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
}

export default function AreaChart({
  data = [],
  series = [],
  height = 240,
  dark = true,
  valueFormatter = (v) => v,
}) {
  const rawId = useId().replace(/:/g, "");
  const width = 640;
  const padding = { top: 18, right: 14, bottom: 28, left: 28 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const allValues = data.flatMap((row) => series.map((s) => Number(row[s.key]) || 0));
  const max = Math.max(4, ...allValues);
  const min = 0;

  const xFor = (index) =>
    padding.left + (data.length <= 1 ? chartW / 2 : (index / (data.length - 1)) * chartW);
  const yFor = (value) =>
    padding.top + chartH - ((Number(value) || 0) - min) / (max - min || 1) * chartH;

  const gridLines = 4;
  const textColor = dark ? "rgba(255,255,255,0.32)" : "rgba(20,20,26,0.4)";
  const gridColor = dark ? "rgba(255,255,255,0.055)" : "rgba(20,20,26,0.06)";
  const labelEvery = data.length > 10 ? Math.ceil(data.length / 7) : 1;

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-4">
        {series.map((s) => (
          <span key={s.key} className={`flex items-center gap-1.5 text-[10.5px] ${dark ? "text-white/45" : "text-ink/50"}`}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Activity chart"
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`area-${rawId}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.24" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.01" />
            </linearGradient>
          ))}
        </defs>

        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const value = (max / gridLines) * i;
          const y = yFor(value);
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={gridColor} strokeWidth="1" />
              <text x={padding.left - 7} y={y + 3} textAnchor="end" fill={textColor} fontSize="8">
                {Math.round(value)}
              </text>
            </g>
          );
        })}

        {data.map((row, index) => {
          if (index % labelEvery !== 0 && index !== data.length - 1) return null;
          return (
            <text
              key={row.label + index}
              x={xFor(index)}
              y={height - 6}
              textAnchor="middle"
              fill={textColor}
              fontSize="8"
            >
              {row.label}
            </text>
          );
        })}

        {series.map((s) => {
          const points = data.map((row, index) => ({
            x: xFor(index),
            y: yFor(row[s.key]),
            value: row[s.key],
            label: row.label,
          }));
          const line = smoothPath(points);
          const area = `${line} L ${points[points.length - 1]?.x || padding.left} ${
            padding.top + chartH
          } L ${points[0]?.x || padding.left} ${padding.top + chartH} Z`;

          return (
            <g key={s.key}>
              {s.fill !== false && <path d={area} fill={`url(#area-${rawId}-${s.key})`} />}
              <path
                d={line}
                fill="none"
                stroke={s.color}
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {data.length <= 20 &&
                points.map((point, index) => (
                  <circle key={index} cx={point.x} cy={point.y} r="2.6" fill={dark ? "#11141C" : "#fff"} stroke={s.color} strokeWidth="1.6">
                    <title>{`${s.label} · ${point.label}: ${valueFormatter(point.value)}`}</title>
                  </circle>
                ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
