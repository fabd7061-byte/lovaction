export default function Spinner({ size = 20, className = "text-gold" }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

export function PageLoader({ label = "Loading…", dark = false }) {
  return (
    <div className={`flex min-h-[55vh] flex-col items-center justify-center gap-4 ${dark ? "text-cream/60" : "text-ink/50"}`}>
      <span className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-gold/25" />
        <span className="absolute inset-2 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        <span className="h-2 w-2 rounded-full bg-crimson" />
      </span>
      <p className="text-xs uppercase tracking-[0.2em]">{label}</p>
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-ink/[0.06] ${className}`}
    />
  );
}

export function TableSkeleton({ rows = 5, dark = false }) {
  return (
    <div className={`space-y-3 ${dark ? "" : ""}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-2">
          <div className={`h-9 w-9 rounded-full ${dark ? "bg-white/[0.06]" : "bg-ink/[0.06]"}`} />
          <div className="flex-1 space-y-2">
            <div className={`h-3 w-1/3 rounded-full ${dark ? "bg-white/[0.06]" : "bg-ink/[0.06]"}`} />
            <div className={`h-2.5 w-1/5 rounded-full ${dark ? "bg-white/[0.04]" : "bg-ink/[0.04]"}`} />
          </div>
          <div className={`h-6 w-20 rounded-full ${dark ? "bg-white/[0.05]" : "bg-ink/[0.05]"}`} />
        </div>
      ))}
    </div>
  );
}
