import { useEffect, useState } from "react";
import { initials } from "../../utils/format.js";

const sizes = {
  xs: "h-7 w-7 text-[9px]",
  sm: "h-9 w-9 text-[11px]",
  md: "h-11 w-11 text-xs",
  lg: "h-14 w-14 text-sm",
  xl: "h-20 w-20 text-lg",
  "2xl": "h-24 w-24 text-xl",
  "3xl": "h-32 w-32 text-2xl",
};

const palettes = [
  "from-gold-light via-gold to-gold-dark text-ink",
  "from-crimson via-crimson to-crimson-dark text-cream",
  "from-[#4C6353] via-[#34493B] to-[#22312A] text-cream",
  "from-[#8E6D45] via-[#6B4F2D] to-[#4A361D] text-cream",
  "from-[#4A566A] via-[#333D4E] to-[#232A37] text-cream",
];

function hashCode(value = "") {
  return String(value)
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

export default function Avatar({
  src,
  firstName,
  lastName,
  name,
  size = "md",
  className = "",
  ring = false,
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const full = name || `${firstName || ""} ${lastName || ""}`.trim();
  const letters = firstName || lastName ? initials(firstName, lastName) : initials(full.split(" ")[0], full.split(" ")[1]);
  const palette = palettes[hashCode(full) % palettes.length];

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br font-sans font-bold uppercase tracking-wide ${
        sizes[size] || sizes.md
      } ${palette} ${
        ring ? "ring-2 ring-gold/50 ring-offset-2 ring-offset-ink" : ""
      } ${className}`}
      title={full || undefined}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={full || "Member"}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
          loading="lazy"
        />
      ) : (
        <span>{letters}</span>
      )}
      <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/10" />
    </span>
  );
}
