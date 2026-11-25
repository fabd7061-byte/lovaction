export default function PageHeader({ eyebrow, title, text, actions, dark = false, className = "" }) {
  return (
    <div className={`flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="max-w-2xl">
        {eyebrow && (
          <span className={dark ? "eyebrow-light" : "eyebrow"}>
            <span className="h-1 w-1 rounded-full bg-crimson" />
            {eyebrow}
          </span>
        )}
        <h1
          className={`${eyebrow ? "mt-2.5" : ""} font-display text-[1.9rem] leading-[1.08] tracking-[-0.025em] sm:text-[2.35rem] ${
            dark ? "text-cream" : "text-ink"
          }`}
        >
          {title}
        </h1>
        {text && (
          <p className={`mt-2.5 text-[13px] leading-relaxed ${dark ? "text-white/45" : "text-ink/50"}`}>
            {text}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionCard({ children, className = "", dark = false, padded = true }) {
  return (
    <section
      className={`${dark ? "admin-card" : "card"} ${padded ? "p-4 sm:p-5" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({ title, text, action, dark = false, className = "" }) {
  return (
    <div className={`mb-4 flex items-start justify-between gap-3 ${className}`}>
      <div>
        <h2 className={`font-display text-[1.05rem] tracking-[-0.015em] ${dark ? "text-cream" : "text-ink"}`}>
          {title}
        </h2>
        {text && <p className={`mt-1 text-[11.5px] ${dark ? "text-white/35" : "text-ink/45"}`}>{text}</p>}
      </div>
      {action}
    </div>
  );
}
