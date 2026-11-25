import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Menu,
  Phone,
  Twitter,
  X,
  Youtube,
} from "lucide-react";
import Logo from "../components/ui/Logo.jsx";
import Button from "../components/ui/Button.jsx";
import LangSwitch from "../components/layout/LangSwitch.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useSite } from "../context/SiteContext.jsx";

const NAV = [
  { to: "/", key: "nav.home", end: true },
  { to: "/about", key: "nav.about" },
  { to: "/news", key: "nav.news" },
  { to: "/gallery", key: "nav.gallery" },
  { to: "/members", key: "nav.members" },
  { to: "/top-members", key: "nav.topMembers" },
  { to: "/contact", key: "nav.contact" },
];

function SocialLink({ href, label, icon: Icon }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-cream/50 transition hover:border-gold/50 hover:text-gold-light"
    >
      <Icon size={15} />
    </a>
  );
}

export default function PublicLayout() {
  const { t } = useLanguage();
  const { user, isAdmin } = useAuth();
  const { settings } = useSite();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const dashLink = isAdmin ? "/admin" : "/dashboard";
  const socials = settings?.socials || {};

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink/95 backdrop-blur-xl">
        <div className="container-page flex h-[76px] items-center justify-between gap-4">
          <Link to="/" aria-label="Lovaction Ministries home" className="shrink-0">
            <Logo size={40} theme="dark" showMotto={false} />
          </Link>

          <nav className="hidden items-center gap-1 xl:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative rounded-full px-3.5 py-2 text-[12.5px] font-medium transition ${
                    isActive ? "text-gold-light" : "text-cream/60 hover:text-cream"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {t(item.key)}
                    {isActive && (
                      <span className="absolute inset-x-3.5 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <LangSwitch />
            {user ? (
              <Button as={Link} to={dashLink} variant="outline-light" size="sm" iconRight={ArrowUpRight}>
                {t("nav.dashboard")}
              </Button>
            ) : (
              <>
                <Link to="/login" className="px-2 text-[12.5px] font-medium text-cream/60 transition hover:text-cream">
                  {t("nav.login")}
                </Link>
                <Button as={Link} to="/join" size="sm" iconRight={ArrowRight}>
                  {t("nav.join")}
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <LangSwitch />
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={t("nav.menu")}
              aria-expanded={open}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-cream/80 transition hover:border-gold/50 hover:text-gold-light"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 top-[76px] z-40 overflow-y-auto bg-ink px-5 pb-10 pt-6 lg:hidden">
          <nav className="flex flex-col">
            {NAV.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={{ animationDelay: `${index * 40}ms` }}
                className={({ isActive }) =>
                  `flex animate-fade-up items-center justify-between border-b border-white/[0.06] py-4 font-display text-2xl tracking-[-0.02em] ${
                    isActive ? "text-gold-light" : "text-cream"
                  }`
                }
              >
                {t(item.key)}
                <ArrowUpRight size={18} className="text-gold/60" />
              </NavLink>
            ))}
          </nav>

          <div className="mt-7 flex flex-col gap-3">
            {user ? (
              <Button as={Link} to={dashLink} size="lg" iconRight={ArrowRight}>
                {t("nav.dashboard")}
              </Button>
            ) : (
              <>
                <Button as={Link} to="/join" size="lg" iconRight={ArrowRight}>
                  {t("nav.join")}
                </Button>
                <Button as={Link} to="/login" variant="outline-light" size="lg">
                  {t("nav.login")}
                </Button>
              </>
            )}
          </div>

          <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <p className="font-script text-xl text-gold-light">{settings.motto}</p>
            <div className="mt-4 space-y-2.5 text-[12px] text-cream/50">
              <p className="flex items-center gap-2"><MapPin size={13} /> {settings.address}</p>
              <p className="flex items-center gap-2"><Mail size={13} /> {settings.email}</p>
              <p className="flex items-center gap-2"><Phone size={13} /> {settings.phone}</p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="relative overflow-hidden bg-ink text-cream">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/[0.07] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-crimson/[0.06] blur-3xl" />
        <div className="container-page relative py-14 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.1fr]">
            <div>
              <Logo size={44} theme="dark" />
              <p className="mt-5 max-w-xs text-[13px] leading-relaxed text-cream/45">
                {t("footer.joinText")}
              </p>
              <div className="mt-5 flex items-center gap-2">
                <SocialLink href={socials.facebook} label="Facebook" icon={Facebook} />
                <SocialLink href={socials.instagram} label="Instagram" icon={Instagram} />
                <SocialLink href={socials.twitter} label="X" icon={Twitter} />
                <SocialLink href={socials.youtube} label="YouTube" icon={Youtube} />
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-light/80">
                {t("footer.explore")}
              </h3>
              <ul className="mt-4 space-y-2.5 text-[12.5px] text-cream/50">
                <li><Link className="transition hover:text-cream" to="/about">{t("nav.about")}</Link></li>
                <li><Link className="transition hover:text-cream" to="/news">{t("nav.news")}</Link></li>
                <li><Link className="transition hover:text-cream" to="/gallery">{t("nav.gallery")}</Link></li>
                <li><Link className="transition hover:text-cream" to="/contact">{t("nav.contact")}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-light/80">
                {t("footer.community")}
              </h3>
              <ul className="mt-4 space-y-2.5 text-[12.5px] text-cream/50">
                <li><Link className="transition hover:text-cream" to="/members">{t("nav.members")}</Link></li>
                <li><Link className="transition hover:text-cream" to="/top-members">{t("nav.topMembers")}</Link></li>
                <li><Link className="transition hover:text-cream" to="/join">{t("nav.join")}</Link></li>
                <li><Link className="transition hover:text-cream" to="/login">{t("footer.signIn")}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-light/80">
                {t("footer.connect")}
              </h3>
              <ul className="mt-4 space-y-3 text-[12.5px] text-cream/50">
                <li className="flex items-start gap-2.5">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-gold/70" />
                  <span>{settings.address}</span>
                </li>
                <li>
                  <a href={`mailto:${settings.email}`} className="flex items-center gap-2.5 transition hover:text-cream">
                    <Mail size={14} className="shrink-0 text-gold/70" />
                    {settings.email}
                  </a>
                </li>
                <li>
                  <a href={`tel:${settings.phone}`} className="flex items-center gap-2.5 transition hover:text-cream">
                    <Phone size={14} className="shrink-0 text-gold/70" />
                    {settings.phone}
                  </a>
                </li>
              </ul>
              <p className="mt-5 font-script text-lg text-gold-light/80">{settings.motto}</p>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.07] pt-6 text-[10.5px] text-cream/30 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {settings.orgName}. {t("footer.rights")}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span>{t("footer.madeWith")}</span>
              <Link to="/login" className="transition hover:text-cream/60">{t("footer.admin")}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
