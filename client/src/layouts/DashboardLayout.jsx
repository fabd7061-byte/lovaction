import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  FileText,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Network,
  Newspaper,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Logo from "../components/ui/Logo.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Badge from "../components/ui/Badge.jsx";
import LangSwitch from "../components/layout/LangSwitch.jsx";
import NotificationMenu from "../components/layout/NotificationMenu.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export const MEMBER_NAV = [
  { to: "/dashboard", label: "dashboard.nav.overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/referrals", label: "dashboard.nav.referrals", icon: Users },
  { to: "/dashboard/points", label: "dashboard.nav.points", icon: Sparkles },
  { to: "/dashboard/tree", label: "dashboard.nav.tree", icon: Network },
  { to: "/dashboard/ranking", label: "dashboard.nav.ranking", icon: Trophy },
  { to: "/dashboard/profile", label: "dashboard.nav.profile", icon: UserRound },
  { to: "/dashboard/settings", label: "dashboard.nav.settings", icon: Settings },
];

export const ADMIN_NAV = [
  {
    group: "admin.nav.management",
    items: [
      { to: "/admin", label: "admin.nav.overview", icon: LayoutDashboard, end: true },
      { to: "/admin/applications", label: "admin.nav.applications", icon: ClipboardList },
      { to: "/admin/members", label: "admin.nav.members", icon: Users },
    ],
  },
  {
    group: "admin.nav.community",
    items: [
      { to: "/admin/referrals", label: "admin.nav.referrals", icon: Network },
      { to: "/admin/points", label: "admin.nav.points", icon: Sparkles },
    ],
  },
  {
    group: "admin.nav.content",
    items: [
      { to: "/admin/news", label: "admin.nav.news", icon: Newspaper },
      { to: "/admin/gallery", label: "admin.nav.gallery", icon: Images },
      { to: "/admin/messages", label: "admin.nav.messages", icon: MessageSquare },
      { to: "/admin/reports", label: "admin.nav.reports", icon: FileText },
      { to: "/admin/audit", label: "admin.nav.audit", icon: ScrollText },
    ],
  },
  {
    group: null,
    items: [{ to: "/admin/settings", label: "admin.nav.settings", icon: Settings }],
  },
];

function navItemClass(isActive) {
  return `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12.5px] font-medium transition ${
    isActive
      ? "bg-white/[0.08] text-cream"
      : "text-cream/45 hover:bg-white/[0.04] hover:text-cream/80"
  }`;
}

function UserMenu({ dark = true, onLogout, children }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {children || (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`flex items-center gap-2.5 rounded-full border py-1 pl-1 pr-3 transition ${
            dark
              ? "border-white/10 bg-white/[0.03] hover:border-gold/40"
              : "border-ink/10 bg-white hover:border-gold/50"
          }`}
        >
          <Avatar
            src={user?.profileImage}
            firstName={user?.firstName}
            lastName={user?.lastName}
            size="sm"
          />
          <span className="hidden text-left sm:block">
            <span className={`block text-[11.5px] font-semibold leading-tight ${dark ? "text-cream/90" : "text-ink/80"}`}>
              {user?.firstName} {user?.lastName}
            </span>
            <span className={`block text-[9px] uppercase tracking-[0.14em] ${dark ? "text-white/30" : "text-ink/35"}`}>
              {t(`common.${user?.role || "member"}`)}
            </span>
          </span>
          <ChevronDown size={13} className={dark ? "text-cream/35" : "text-ink/35"} />
        </button>
      )}

      {open && (
        <div
          className={`absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border p-1.5 ${
            dark
              ? "border-white/10 bg-ink-soft text-cream shadow-[0_30px_70px_-20px_rgba(0,0,0,0.8)]"
              : "border-ink/[0.08] bg-white text-ink shadow-lift"
          }`}
        >
          <div className={`px-3 py-2.5 ${dark ? "border-b border-white/[0.06]" : "border-b border-ink/[0.06]"}`}>
            <p className="truncate text-[12px] font-semibold">{user?.fullName || `${user?.firstName} ${user?.lastName}`}</p>
            <p className={`mt-0.5 truncate text-[10.5px] ${dark ? "text-white/35" : "text-ink/40"}`}>@{user?.username}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate(isAdmin ? "/admin" : "/dashboard/profile");
            }}
            className={`mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] transition ${
              dark ? "text-cream/65 hover:bg-white/[0.06]" : "text-ink/65 hover:bg-cream"
            }`}
          >
            <UserRound size={14} /> {isAdmin ? t("nav.dashboard") : t("common.profile")}
          </button>
          <Link
            to={isAdmin ? "/admin/settings" : "/dashboard/settings"}
            onClick={() => setOpen(false)}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] transition ${
              dark ? "text-cream/65 hover:bg-white/[0.06]" : "text-ink/65 hover:bg-cream"
            }`}
          >
            <Settings size={14} /> {t("common.settings")}
          </Link>
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] transition ${
              dark ? "text-cream/65 hover:bg-white/[0.06]" : "text-ink/65 hover:bg-cream"
            }`}
          >
            <ExternalLink size={14} /> {t("nav.viewSite")}
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className={`mt-1 flex w-full items-center gap-2.5 rounded-xl border-t px-3 py-2 text-[12px] text-crimson transition hover:bg-crimson/[0.06] ${
              dark ? "border-white/[0.06]" : "border-ink/[0.06]"
            }`}
          >
            <LogOut size={14} /> {t("nav.logout")}
          </button>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ variant = "member" }) {
  const admin = variant === "admin";
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawer, setDrawer] = useState(false);

  const flatNav = admin ? ADMIN_NAV.flatMap((group) => group.items) : MEMBER_NAV;
  const current = [...flatNav]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)));
  const pageTitle = current ? t(current.label) : admin ? t("admin.title") : t("nav.myMembership");

  useEffect(() => {
    setDrawer(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    toast.info(t("nav.logout"));
  };

  const renderNav = () => (
    <>
      {admin ? (
        <div className="space-y-5">
          {ADMIN_NAV.map((group, groupIndex) => (
            <div key={group.group || groupIndex}>
              {group.group && (
                <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/25">
                  {t(group.group)}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => navItemClass(isActive)}>
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gold" />}
                        <item.icon size={16} className={isActive ? "text-gold-light" : "text-cream/35 group-hover:text-cream/60"} />
                        {t(item.label)}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/25">
            {t("nav.myMembership")}
          </p>
          {MEMBER_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => navItemClass(isActive)}>
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gold" />}
                  <item.icon size={16} className={isActive ? "text-gold-light" : "text-cream/35 group-hover:text-cream/60"} />
                  {t(item.label)}
                </>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </>
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-ink">
      <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
        <Link to="/" aria-label="Lovaction Ministries">
          <Logo size={36} theme="dark" showMotto={false} compact />
        </Link>
        {drawer && (
          <button
            type="button"
            onClick={() => setDrawer(false)}
            className="rounded-full p-1.5 text-cream/40 hover:text-cream lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="dark-scroll flex-1 overflow-y-auto px-3 py-5">
        {admin && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-gold/15 bg-gold/[0.06] px-3 py-2.5">
            <ShieldCheck size={15} className="text-gold-light" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-light">{t("admin.title")}</p>
              <p className="mt-0.5 text-[9.5px] text-cream/35">{t(`common.${user?.role || "admin"}`)}</p>
            </div>
          </div>
        )}
        {renderNav()}
      </div>

      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
          <div className="flex items-center gap-2.5">
            <Avatar src={user?.profileImage} firstName={user?.firstName} lastName={user?.lastName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11.5px] font-semibold text-cream/85">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-[9.5px] text-cream/30">@{user?.username}</p>
            </div>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <Link
              to="/"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 py-1.5 text-[10px] font-medium text-cream/45 transition hover:border-gold/40 hover:text-cream"
            >
              <ExternalLink size={11} /> {t("nav.viewSite")}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-white/10 p-1.5 text-cream/40 transition hover:border-crimson/40 hover:text-crimson"
              aria-label={t("nav.logout")}
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${admin ? "bg-ink" : "bg-cream"}`}>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[258px] border-r border-white/[0.06] lg:block">
        {sidebar}
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] animate-fade-in shadow-2xl">{sidebar}</div>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:pl-[258px]">
        <header
          className={`sticky top-0 z-30 flex h-[68px] items-center justify-between gap-3 border-b px-4 sm:px-6 lg:px-8 ${
            admin
              ? "border-white/[0.06] bg-ink/90 backdrop-blur-xl"
              : "border-ink/[0.07] bg-cream/90 backdrop-blur-xl"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className={`flex h-9 w-9 items-center justify-center rounded-full border lg:hidden ${
                admin ? "border-white/10 text-cream/60" : "border-ink/10 text-ink/55"
              }`}
              aria-label={t("nav.menu")}
            >
              <Menu size={17} />
            </button>
            <div className="min-w-0">
              <p className={`text-[9.5px] font-semibold uppercase tracking-[0.18em] ${admin ? "text-gold-light/60" : "text-gold-dark/70"}`}>
                {admin ? t("admin.title") : t("nav.myMembership")}
              </p>
              <h1 className={`truncate font-display text-lg tracking-[-0.02em] sm:text-xl ${admin ? "text-cream" : "text-ink"}`}>
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <LangSwitch dark={admin} className="hidden sm:inline-flex" />
            {admin ? (
              <Link
                to="/"
                className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-cream/55 transition hover:border-gold/40 hover:text-cream sm:flex"
                aria-label={t("nav.viewSite")}
              >
                <ArrowUpRight size={16} />
              </Link>
            ) : (
              <Link
                to="/dashboard/referrals"
                className="hidden items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3.5 py-2 text-[11px] font-semibold text-ink/60 transition hover:border-gold/50 hover:text-ink sm:flex"
              >
                <Users size={13} /> {t("dashboard.invite")}
              </Link>
            )}
            <NotificationMenu dark={admin} />
            <UserMenu dark={admin} onLogout={handleLogout} />
          </div>
        </header>

        <main className={`flex-1 px-4 pb-14 pt-6 sm:px-6 lg:px-8 ${admin ? "text-cream" : "text-ink"}`}>
          <div className="mx-auto w-full max-w-[1400px]">
            <Outlet />
          </div>
        </main>

        <footer
          className={`border-t px-4 py-5 text-[10px] sm:px-6 lg:px-8 ${
            admin ? "border-white/[0.05] text-white/25" : "border-ink/[0.06] text-ink/30"
          }`}
        >
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} Lovaction Ministries · {t("brand.motto")}</span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <ShieldCheck size={11} /> {t("footer.madeWith")}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
