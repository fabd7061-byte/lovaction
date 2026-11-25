import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  HeartHandshake,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Field.jsx";
import Logo from "../../components/ui/Logo.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { apiError } from "../../services/api.js";
import usePageMeta from "../../utils/usePageMeta.js";

const DEMO = [
  {
    key: "founderDemo",
    identifier: "founder@lovaction.org",
    password: "Founder@2026",
    tone: "border-gold/30 bg-gold/[0.08] text-gold-dark",
  },
  {
    key: "adminDemo",
    identifier: "admin@lovaction.org",
    password: "Admin@2026",
    tone: "border-crimson/20 bg-crimson/[0.05] text-crimson",
  },
  {
    key: "memberDemo",
    identifier: "jean.mugisha@lovaction.org",
    password: "Member@2026",
    tone: "border-ink/10 bg-white text-ink/55",
  },
];

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80";

export default function Login() {
  const { t } = useLanguage();
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  usePageMeta(t("nav.login"));

  useEffect(() => {
    if (user) {
      navigate(user.role === "member" ? "/dashboard" : "/admin", { replace: true });
    }
  }, [user, navigate]);

  if (user) {
    return <Navigate to={user.role === "member" ? "/dashboard" : "/admin"} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!identifier.trim() || !password) {
      setError(t("validation.required"));
      return;
    }
    setLoading(true);
    try {
      const account = await login(identifier.trim(), password);
      const fallback = account.role === "member" ? "/dashboard" : "/admin";
      let destination = fallback;
      if (location.state?.from) {
        const from = location.state.from;
        const allowed =
          (account.role === "member" && from.startsWith("/dashboard")) ||
          (account.role !== "member" && from.startsWith("/admin"));
        if (allowed) destination = from;
      }
      if (account.mustChangePassword) {
        toast.info(t("login.mustChange"));
        destination = account.role === "member" ? "/dashboard/settings" : "/admin";
      } else {
        toast.success(`${t("login.eyebrow")}, ${account.firstName}.`);
      }
      navigate(destination, { replace: true });
    } catch (err) {
      setError(apiError(err, t("login.error")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-76px)] lg:grid-cols-[1.02fr_0.98fr]">
      <section className="relative hidden overflow-hidden bg-ink p-10 text-cream lg:flex lg:flex-col lg:justify-between xl:p-14">
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/85 via-ink/70 to-ink" />
        <div className="relative">
          <Link to="/">
            <Logo size={44} theme="dark" />
          </Link>
        </div>

        <div className="relative max-w-lg">
          <span className="eyebrow-light">
            <span className="h-px w-8 bg-gold/70" />
            {t("home.eyebrow")}
          </span>
          <h1 className="mt-5 font-display text-[3.1rem] leading-[1.02] tracking-[-0.035em]">
            {t("login.brandLine")}
          </h1>
          <p className="mt-5 max-w-md text-[13.5px] leading-relaxed text-cream/50">{t("home.heroText")}</p>

          <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
            {[
              { icon: HeartHandshake, label: t("home.statsReferrals") },
              { icon: Sparkles, label: t("home.statsPoints") },
              { icon: ShieldCheck, label: t("members.legendMember") },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur">
                <item.icon size={17} className="text-gold-light" />
                <p className="mt-2 text-[10px] leading-snug text-cream/45">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/10 text-gold-light">
            <Lock size={18} />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-cream/75">{t("login.secureNote")}</p>
            <p className="mt-0.5 text-[9.5px] text-cream/30">Lovaction Ministries · Member Portal</p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-cream px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link to="/">
              <Logo size={38} theme="light" compact />
            </Link>
            <Link to="/" className="text-[11px] font-medium text-ink/40 hover:text-ink">
              {t("login.viewPublic")}
            </Link>
          </div>

          <div className="hidden justify-end lg:flex">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink/35 transition hover:text-ink"
            >
              <ArrowLeft size={12} /> {t("login.viewPublic")}
            </Link>
          </div>

          <span className="eyebrow mt-8 lg:mt-0">
            <span className="h-1 w-1 rounded-full bg-crimson" />
            {t("login.eyebrow")}
          </span>
          <h1 className="mt-3 font-display text-[2.3rem] leading-[1.08] tracking-[-0.03em]">
            {t("login.title")}
          </h1>
          <p className="mt-2.5 text-[12.5px] text-ink/45">{t("login.subtitle")}</p>

          {error && (
            <div className="mt-5 rounded-xl border border-crimson/20 bg-crimson/[0.05] px-4 py-3 text-[12px] font-medium text-crimson">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Input
              label={t("login.identifier")}
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={t("login.identifierPlaceholder")}
              autoComplete="username"
            />
            <div>
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  label={t("login.password")}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="[&_input]:pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShow((value) => !value)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-[2.15rem] rounded-full p-1 text-ink/35 transition hover:text-ink"
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="mt-2 text-[10.5px] text-ink/35">{t("login.forgot")}</p>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading} iconRight={ArrowRight}>
              {loading ? t("login.submitting") : t("login.submit")}
            </Button>
          </form>

          <p className="mt-4 text-center text-[11.5px] text-ink/40">
            {t("login.noAccount")}{" "}
            <Link to="/join" className="font-semibold text-gold-dark hover:text-ink">
              {t("login.apply")}
            </Link>
          </p>

          <div className="mt-8 rounded-2xl border border-ink/[0.07] bg-white p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/40">
                {t("login.demoTitle")}
              </p>
              <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.1em] text-gold-dark">
                Demo
              </span>
            </div>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink/35">{t("login.demoHint")}</p>
            <div className="mt-3 space-y-1.5">
              {DEMO.map((account) => (
                <button
                  key={account.key}
                  type="button"
                  onClick={() => {
                    setIdentifier(account.identifier);
                    setPassword(account.password);
                    setError("");
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${account.tone}`}
                >
                  <span>
                    <span className="block text-[11px] font-semibold">{t(`login.${account.key}`)}</span>
                    <span className="mt-0.5 block text-[9.5px] opacity-60">{account.identifier}</span>
                  </span>
                  <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.1em] opacity-60">
                    {t("login.fill")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-ink/30">
            <ShieldCheck size={12} /> {t("login.secureNote")}
          </p>
        </div>
      </section>
    </div>
  );
}
