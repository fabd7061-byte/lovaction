import Spinner from "./Spinner.jsx";

const variants = {
  gold: "btn-gold",
  dark: "btn-dark",
  outline: "btn-ghost",
  "outline-light": "btn-ghost-light",
  ghost: "text-ink/70 hover:bg-ink/[0.05] hover:text-ink",
  "ghost-light": "text-cream/70 hover:bg-white/[0.06] hover:text-cream",
  danger: "btn-danger",
  soft: "bg-ink/[0.06] text-ink hover:bg-ink/[0.1]",
  "soft-dark": "bg-white/[0.07] text-cream hover:bg-white/[0.12]",
  crimson: "bg-crimson text-white hover:bg-crimson-dark",
};

const sizes = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
};

export default function Button({
  as: Tag = "button",
  variant = "gold",
  size = "md",
  className = "",
  loading = false,
  disabled,
  icon: Icon,
  iconRight: IconRight,
  children,
  type = "button",
  ...props
}) {
  return (
    <Tag
      type={Tag === "button" ? type : undefined}
      disabled={disabled || loading}
      className={`btn ${variants[variant] || variants.gold} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? <Spinner size={16} className="shrink-0" /> : Icon ? <Icon size={16} className="shrink-0" /> : null}
      {children}
      {IconRight && !loading ? <IconRight size={16} className="shrink-0" /> : null}
    </Tag>
  );
}
