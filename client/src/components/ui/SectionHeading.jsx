export default function SectionHeading({
  eyebrow,
  title,
  text,
  align = "left",
  light = false,
  className = "",
  action,
}) {
  const alignment = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`${alignment} ${className}`}>
      <div className={`flex flex-wrap items-end ${align === "center" ? "justify-center" : "justify-between"} gap-6`}>
        <div className={`max-w-2xl ${align === "center" ? "mx-auto" : ""}`}>
          {eyebrow && (
            <span className={light ? "eyebrow-light" : "eyebrow"}>
              <span className="h-1 w-1 rounded-full bg-crimson" />
              {eyebrow}
            </span>
          )}
          {title && (
            <h2
              className={`mt-3 font-display text-[2.1rem] leading-[1.07] tracking-[-0.025em] sm:text-[2.75rem] ${
                light ? "text-cream" : "text-ink"
              }`}
            >
              {title}
            </h2>
          )}
          {text && (
            <p
              className={`mt-4 max-w-xl text-[14.5px] leading-relaxed ${
                light ? "text-cream/55" : "text-ink/55"
              } ${align === "center" ? "mx-auto" : ""}`}
            >
              {text}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
