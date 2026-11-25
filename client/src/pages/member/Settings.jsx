import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Check,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  Languages,
  LogOut,
  ShieldCheck,
  ShieldQuestion,
  UserRound,
} from "lucide-react";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Field.jsx";
import PageHeader, { CardHeader, SectionCard } from "../../components/PageHeader.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import api, { apiError } from "../../services/api.js";
import { formatDate } from "../../utils/format.js";
import usePageMeta from "../../utils/usePageMeta.js";

export default function Settings() {
  const { t, lang, setLang } = useLanguage();
  const { user, isAdmin, logout, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  usePageMeta(t("dashboard.settingsTitle"));

  const changeLanguage = (code) => {
    setLang(code);
    toast.success(t("dashboard.languageSaved"));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!currentPassword || !newPassword || !confirm) {
      setError(t("validation.required"));
      return;
    }
    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError(t("validation.password"));
      return;
    }
    if (newPassword !== confirm) {
      setError(t("validation.match"));
      return;
    }
    setSaving(true);
    try {
      await api.patch("/auth/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      updateUser({ mustChangePassword: false });
      toast.success(t("dashboard.passwordSaved"));
    } catch (err) {
      setError(apiError(err, t("common.errorText")));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("dashboard.nav.settings")}
        title={t("dashboard.settingsTitle")}
        text={t("dashboard.settingsSubtitle")}
        actions={
          <Button as={Link} to="/dashboard/profile" variant="outline" size="sm" icon={UserRound}>
            {t("dashboard.nav.profile")}
          </Button>
        }
      />

      {user?.mustChangePassword && (
        <div className="rounded-2xl border border-gold/30 bg-gold/[0.07] px-4 py-3.5 text-[12.5px] font-medium text-ink/70">
          {t("dashboard.mustChangeBanner")}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <form onSubmit={submit} className="space-y-4">
          <SectionCard>
            <CardHeader
              title={t("dashboard.changePassword")}
              text={t("dashboard.changePasswordText")}
              action={
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-gold-dark">
                  <KeyRound size={16} />
                </span>
              }
            />

            {error && (
              <div className="mb-4 rounded-xl border border-crimson/20 bg-crimson/[0.05] px-4 py-3 text-[12px] font-medium text-crimson">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  label={t("dashboard.currentPassword")}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  className="[&_input]:pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShow((value) => !value)}
                  className="absolute right-3.5 top-[2.15rem] rounded-full p-1 text-ink/35 transition hover:text-ink"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  type={show ? "text" : "password"}
                  label={t("dashboard.newPassword")}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  hint={t("dashboard.settingsSecurityHint")}
                />
                <Input
                  type={show ? "text" : "password"}
                  label={t("dashboard.confirmPassword")}
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  autoComplete="new-password"
                  required
                  error={confirm && confirm !== newPassword ? t("validation.match") : ""}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-ink/[0.06] pt-4">
              <p className="flex items-center gap-1.5 text-[10.5px] text-ink/35">
                <ShieldCheck size={12} className="text-emerald-600" /> {t("login.secureNote")}
              </p>
              <Button type="submit" loading={saving} icon={Check} size="sm">
                {t("dashboard.changePassword")}
              </Button>
            </div>
          </SectionCard>

          <SectionCard>
            <CardHeader
              title={t("dashboard.language")}
              text={t("dashboard.languageText")}
              action={
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/[0.045] text-ink/55">
                  <Languages size={16} />
                </span>
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { code: "en", label: "English", sub: "English" },
                { code: "rw", label: "Kinyarwanda", sub: "Ikinyarwanda" },
              ].map((option) => {
                const active = lang === option.code;
                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => changeLanguage(option.code)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                      active
                        ? "border-gold/50 bg-gold/[0.07]"
                        : "border-ink/[0.08] bg-white hover:border-gold/30"
                    }`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      active ? "bg-gold text-ink" : "bg-ink/[0.045] text-ink/45"
                    }`}>
                      <Globe2 size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-semibold text-ink/80">{option.label}</span>
                      <span className="mt-0.5 block text-[10px] text-ink/35">{option.sub}</span>
                    </span>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        active ? "border-gold bg-gold text-ink" : "border-ink/15 text-transparent"
                      }`}
                    >
                      <Check size={11} />
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[10.5px] text-ink/35">{t("dashboard.languageText")}</p>
          </SectionCard>
        </form>

        <div className="space-y-4">
          <SectionCard>
            <CardHeader
              title={t("dashboard.account")}
              text={t("dashboard.accountText")}
              action={
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/[0.045] text-ink/55">
                  <ShieldQuestion size={16} />
                </span>
              }
            />
            <div className="flex items-center gap-3 rounded-2xl border border-ink/[0.06] bg-cream/60 p-3.5">
              <Avatar
                src={user?.profileImage}
                firstName={user?.firstName}
                lastName={user?.lastName}
                size="lg"
              />
              <div className="min-w-0">
                <p className="truncate font-display text-lg leading-tight tracking-[-0.02em]">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="mt-0.5 truncate text-[10.5px] text-ink/40">@{user?.username}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge status={user?.role} dot={false} />
                  <Badge status={user?.status} dot={false} />
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2.5 text-[11px]">
              <div className="flex items-center justify-between gap-3 border-b border-ink/[0.055] pb-2.5">
                <span className="text-ink/40">{t("common.email")}</span>
                <span className="truncate text-ink/65">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-ink/[0.055] pb-2.5">
                <span className="text-ink/40">{t("dashboard.memberCode")}</span>
                <span className="font-mono text-ink/65">{user?.memberCode}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink/40">{t("dashboard.joinedOn")}</span>
                <span className="text-ink/65">{formatDate(user?.joinedAt, lang)}</span>
              </div>
            </div>

            {isAdmin && (
              <Link
                to="/admin"
                className="mt-4 flex items-center justify-between rounded-xl border border-gold/25 bg-gold/[0.05] px-3.5 py-2.5 text-[11px] font-semibold text-gold-dark transition hover:border-gold/50"
              >
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck size={13} /> {t("admin.title")}
                </span>
                <span>→</span>
              </Link>
            )}

            <Button
              type="button"
              onClick={handleLogout}
              variant="outline"
              size="sm"
              icon={LogOut}
              className="mt-4 w-full !text-crimson hover:!border-crimson/40"
            >
              {t("nav.logout")}
            </Button>
          </SectionCard>

          <div className="relative overflow-hidden rounded-2xl bg-ink p-5 text-cream">
            <div className="pointer-events-none absolute inset-0 pattern-dots opacity-30" />
            <div className="relative">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-gold/[0.08] text-gold-light">
                <ShieldCheck size={16} />
              </span>
              <p className="mt-3 font-display text-lg leading-tight tracking-[-0.02em]">
                {t("login.secureNote")}
              </p>
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-cream/35">{t("dashboard.security")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
