import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, FileText, HeartHandshake, MessageSquare, Sparkles, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { relativeTime } from "../../utils/format.js";

const ICONS = {
  application: FileText,
  referral: HeartHandshake,
  points: Sparkles,
  message: MessageSquare,
  member: UserRound,
  system: Bell,
};

export default function NotificationMenu({ dark = true }) {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications", { params: { limit: 12 } });
      setItems(data.items || []);
      setUnread(data.unread || 0);
    } catch {
      // Notifications are non-critical; leave the menu quiet on failure.
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const openMenu = () => {
    setOpen((value) => !value);
    if (!open) load();
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      setUnread(0);
      toast.success(t("dashboard.notificationRead"));
    } catch {
      // Ignore.
    }
  };

  const openItem = async (item) => {
    setOpen(false);
    if (!item.read) {
      try {
        await api.patch(`/notifications/${item._id}/read`);
        setItems((current) =>
          current.map((entry) => (entry._id === item._id ? { ...entry, read: true } : entry))
        );
        setUnread((value) => Math.max(0, value - 1));
      } catch {
        // Ignore.
      }
    }
    if (item.link) navigate(item.link);
  };

  const panelClass = dark
    ? "border-white/10 bg-ink-soft text-cream shadow-[0_30px_70px_-20px_rgba(0,0,0,0.8)]"
    : "border-ink/[0.08] bg-white text-ink shadow-lift";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={openMenu}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition ${
          dark
            ? "border-white/10 bg-white/[0.04] text-cream/65 hover:border-gold/40 hover:text-cream"
            : "border-ink/10 bg-white text-ink/55 hover:border-gold/50 hover:text-ink"
        }`}
        aria-label={t("dashboard.notifications")}
        aria-expanded={open}
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-crimson px-1 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 top-12 z-50 w-[20rem] overflow-hidden rounded-2xl border sm:w-[22rem] ${panelClass}`}
        >
          <div
            className={`flex items-center justify-between border-b px-4 py-3 ${
              dark ? "border-white/[0.07]" : "border-ink/[0.06]"
            }`}
          >
            <p className="text-[12px] font-semibold">{t("dashboard.notifications")}</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className={`inline-flex items-center gap-1 text-[10.5px] font-medium transition ${
                  dark ? "text-gold-light hover:text-white" : "text-gold-dark hover:text-ink"
                }`}
              >
                <CheckCheck size={12} /> {t("dashboard.markAllRead")}
              </button>
            )}
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {!loaded ? (
              <div className="space-y-3 px-4 py-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={`h-12 animate-pulse rounded-xl ${dark ? "bg-white/[0.05]" : "bg-ink/[0.05]"}`} />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className={`px-4 py-8 text-center text-[12px] ${dark ? "text-white/35" : "text-ink/45"}`}>
                {t("dashboard.noNotifications")}
              </p>
            ) : (
              items.map((item) => {
                const Icon = ICONS[item.type] || Bell;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => openItem(item)}
                    className={`flex w-full items-start gap-3 border-b px-4 py-3 text-left transition last:border-0 ${
                      dark
                        ? "border-white/[0.05] hover:bg-white/[0.035]"
                        : "border-ink/[0.05] hover:bg-cream"
                    } ${!item.read ? (dark ? "bg-gold/[0.045]" : "bg-gold/[0.045]") : ""}`}
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        dark ? "bg-gold/10 text-gold-light" : "bg-gold/10 text-gold-dark"
                      }`}
                    >
                      <Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-2">
                        <span className={`flex-1 text-[12px] font-semibold leading-snug ${dark ? "text-cream/90" : "text-ink/85"}`}>
                          {item.title}
                        </span>
                        {!item.read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-crimson" />}
                      </span>
                      <span className={`mt-0.5 line-clamp-2 block text-[11px] leading-relaxed ${dark ? "text-white/40" : "text-ink/50"}`}>
                        {item.message}
                      </span>
                      <span className={`mt-1 block text-[9.5px] uppercase tracking-[0.1em] ${dark ? "text-white/25" : "text-ink/30"}`}>
                        {relativeTime(item.createdAt, lang)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
