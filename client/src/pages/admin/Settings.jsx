import { useCallback, useEffect, useState } from "react";
import {
  AtSign,
  Check,
  ExternalLink,
  Globe2,
  HandHeart,
  Home,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import { Input, Select } from "../../components/ui/Field.jsx";
import { PageLoader } from "../../components/ui/Spinner.jsx";
import PageHeader, { CardHeader, SectionCard } from "../../components/PageHeader.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useSite } from "../../context/SiteContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import api, { apiError } from "../../services/api.js";
import usePageMeta from "../../utils/usePageMeta.js";

const EMPTY = {
  orgName: "",
  motto: "",
  email: "",
  phone: "",
  address: "",
  foundedYear: new Date().getFullYear(),
  pointsPerReferral: 10,
  rankingMetric: "referrals",
  allowPublicLeaderboard: true,
  allowPublicMembers: true,
  joinEnabled: true,
  socials: { facebook: "", instagram: "", twitter: "", youtube: "" },
};

function Toggle({ checked, onChange, label, text, icon: Icon }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
        checked
          ? "border-gold/30 bg-gold/[0.055]"
          : "border-white/[0.06] bg-white/[0.018] hover:border-white/15"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          checked ? "bg-gold/15 text-gold-light" : "bg-white/[0.04] text-white/30"
        }`}
      >
        {Icon && <Icon size={14} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold text-cream/80">{label}</span>
        <span className="mt-0.5 block text-[9px] leading-relaxed text-white/28">{text}</span>
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
          checked ? "bg-gold" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export default function AdminSettings() {
  const { t } = useLanguage();
  const { setSettings, refreshSite } = useSite();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [initial, setInitial] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  usePageMeta(t("admin.settings.title"));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/settings/admin");
      const settings = response.data.settings || {};
      const next = {
        orgName: settings.orgName || "",
        motto: settings.motto || "",
        email: settings.email || "",
        phone: settings.phone || "",
        address: settings.address || "",
        foundedYear: settings.foundedYear || new Date().getFullYear(),
        pointsPerReferral: settings.pointsPerReferral ?? 10,
        rankingMetric: settings.rankingMetric || "referrals",
        allowPublicLeaderboard: Boolean(settings.allowPublicLeaderboard),
        allowPublicMembers: Boolean(settings.allowPublicMembers),
        joinEnabled: Boolean(settings.joinEnabled),
        socials: {
          facebook: settings.socials?.facebook || "",
          instagram: settings.socials?.instagram || "",
          twitter: settings.socials?.twitter || "",
          youtube: settings.socials?.youtube || "",
        },
      };
      setForm(next);
      setInitial(next);
    } catch (err) {
      setError(apiError(err, t("common.errorText")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const setSocial = (key) => (event) =>
    setForm((current) => ({ ...current, socials: { ...current.socials, [key]: event.target.value } }));

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const save = async (event) => {
    event?.preventDefault?.();
    if (!form.orgName.trim() || !form.motto.trim()) {
      toast.error(t("validation.required"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        orgName: form.orgName.trim(),
        motto: form.motto.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        foundedYear: Number(form.foundedYear),
        pointsPerReferral: Number(form.pointsPerReferral),
        socials: Object.fromEntries(
          Object.entries(form.socials).map(([key, value]) => [key, String(value).trim()])
        ),
      };
      const response = await api.put("/settings", payload);
      if (response.data.settings) setSettings(response.data.settings);
      await refreshSite();
      setInitial(form);
      toast.success(t("admin.settings.saved"));
    } catch (err) {
      toast.error(apiError(err, t("common.errorText")));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader label={t("common.loading")} dark />;

  return (
    <div className="space-y-5">
      <PageHeader
        dark
        eyebrow={t("admin.nav.settings")}
        title={t("admin.settings.title")}
        text={t("admin.settings.subtitle")}
        actions={
          <>
            {dirty && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[9.5px] font-semibold text-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> {t("admin.settings.unsaved")}
              </span>
            )}
            <Button variant="outline-light" size="sm" icon={RefreshCw} onClick={load} disabled={saving}>
              {t("common.reset")}
            </Button>
            <Button size="sm" icon={Save} loading={saving} onClick={save} disabled={!dirty}>
              {t("admin.settings.saveSettings")}
            </Button>
          </>
        }
      />

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-[11px] text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={save} className="grid items-start gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-4">
          <SectionCard dark>
            <CardHeader dark title={t("admin.settings.organization")} text={t("admin.settings.subtitle")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                dark
                label={t("admin.settings.orgName")}
                value={form.orgName}
                onChange={set("orgName")}
                maxLength={120}
                required
              />
              <Input
                dark
                label={t("admin.settings.motto")}
                value={form.motto}
                onChange={set("motto")}
                maxLength={180}
                required
              />
              <Input
                dark
                type="number"
                label={t("admin.settings.foundedYear")}
                value={form.foundedYear}
                onChange={set("foundedYear")}
                min={1900}
                max={new Date().getFullYear()}
              />
            </div>
          </SectionCard>

          <SectionCard dark>
            <CardHeader dark title={t("admin.settings.contactDetails")} text={t("admin.settings.publicCta")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                dark
                type="email"
                label={t("admin.settings.email")}
                value={form.email}
                onChange={set("email")}
                required
              />
              <Input
                dark
                label={t("admin.settings.phone")}
                value={form.phone}
                onChange={set("phone")}
              />
              <div className="sm:col-span-2">
                <Input
                  dark
                  label={t("admin.settings.address")}
                  value={form.address}
                  onChange={set("address")}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard dark>
            <CardHeader dark title={t("admin.settings.referralRules")} text={t("admin.settings.referralsNote")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                dark
                type="number"
                label={t("admin.settings.pointsPerReferral")}
                value={form.pointsPerReferral}
                onChange={set("pointsPerReferral")}
                min={0}
                max={1000}
                hint={t("admin.settings.pointsHint")}
              />
              <Select
                dark
                label={t("admin.settings.rankingMetric")}
                value={form.rankingMetric}
                onChange={set("rankingMetric")}
              >
                <option value="referrals" className="bg-ink-soft">{t("admin.settings.byReferrals")}</option>
                <option value="points" className="bg-ink-soft">{t("admin.settings.byPoints")}</option>
              </Select>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-gold/20 bg-gold/[0.05] px-3.5 py-2.5">
              <Sparkles size={13} className="mt-0.5 shrink-0 text-gold-light/70" />
              <p className="text-[10px] leading-relaxed text-white/40">{t("admin.settings.referralsNote")}</p>
            </div>
          </SectionCard>

          <SectionCard dark>
            <CardHeader dark title={t("admin.settings.socialLinks")} text={t("admin.settings.socialNote")} />
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/lovaction" },
                { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/lovaction" },
                { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/lovaction" },
                { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@lovaction" },
              ].map((social) => (
                <Input
                  key={social.key}
                  dark
                  label={social.label}
                  value={form.socials[social.key]}
                  onChange={setSocial(social.key)}
                  placeholder={social.placeholder}
                />
              ))}
            </div>
          </SectionCard>

          <div className="flex items-center justify-end gap-2">
            <Button variant="soft-dark" size="sm" onClick={load} disabled={saving}>
              {t("common.reset")}
            </Button>
            <Button type="submit" size="sm" icon={Save} loading={saving} disabled={!dirty}>
              {t("admin.settings.saveSettings")}
            </Button>
          </div>
        </div>

        <div className="space-y-4 xl:sticky xl:top-[88px]">
          <SectionCard dark>
            <CardHeader dark title={t("admin.settings.publicVisibility")} text={t("admin.settings.publicSite")} />
            <div className="space-y-2">
              <Toggle
                checked={form.allowPublicLeaderboard}
                onChange={(value) => setForm({ ...form, allowPublicLeaderboard: value })}
                label={t("admin.settings.showLeaderboard")}
                text={t("top.rankedByReferrals")}
                icon={Trophy}
              />
              <Toggle
                checked={form.allowPublicMembers}
                onChange={(value) => setForm({ ...form, allowPublicMembers: value })}
                label={t("admin.settings.showMembers")}
                text={t("members.treeNote")}
                icon={Users}
              />
              <Toggle
                checked={form.joinEnabled}
                onChange={(value) => setForm({ ...form, joinEnabled: value })}
                label={t("admin.settings.joinOpen")}
                text={form.joinEnabled ? t("admin.settings.joinedOpen") : t("admin.settings.joinedClosed")}
                icon={HandHeart}
              />
            </div>
          </SectionCard>

          <SectionCard dark>
            <CardHeader dark title={t("admin.settings.atGlance")} text={t("admin.settings.publicCta")} />
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="font-display text-lg leading-tight tracking-[-0.02em] text-cream">
                {form.orgName || t("brand.name")}
              </p>
              <p className="mt-1 font-script text-lg text-gold-light/70">{form.motto || t("brand.motto")}</p>
              <div className="mt-3 space-y-2 text-[10px]">
                {[
                  { icon: MailIcon, value: form.email || "—" },
                  { icon: Phone, value: form.phone || "—" },
                  { icon: MapPin, value: form.address || "—" },
                  { icon: Home, value: form.foundedYear },
                ].map((item) => (
                  <p key={item.value} className="flex items-center gap-2 text-white/40">
                    <item.icon size={11} className="shrink-0 text-gold-light/50" />
                    <span className="truncate">{item.value}</span>
                  </p>
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge
                label={form.joinEnabled ? t("admin.settings.joinedOpen") : t("admin.settings.joinedClosed")}
                tone={form.joinEnabled ? "green" : "neutral"}
                dark
                dot
              />
              <Badge
                label={form.allowPublicMembers ? t("admin.settings.showMembers") : t("common.none")}
                tone={form.allowPublicMembers ? "blue" : "neutral"}
                dark
                dot={false}
              />
              <Badge
                label={form.allowPublicLeaderboard ? t("admin.settings.showLeaderboard") : t("common.none")}
                tone={form.allowPublicLeaderboard ? "gold" : "neutral"}
                dark
                dot={false}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-4">
              <div className="rounded-xl border border-white/[0.055] px-3 py-2.5">
                <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-white/25">
                  {t("admin.settings.pointsPerReferral")}
                </p>
                <p className="mt-1 font-display text-lg text-gold-light">{form.pointsPerReferral}</p>
              </div>
              <div className="rounded-xl border border-white/[0.055] px-3 py-2.5">
                <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-white/25">
                  {t("admin.settings.rankingMetric")}
                </p>
                <p className="mt-1 text-[10.5px] font-semibold text-cream/70">
                  {form.rankingMetric === "points" ? t("admin.settings.byPoints") : t("admin.settings.byReferrals")}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard dark>
            <div className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold-light">
                <ShieldCheck size={15} />
              </span>
              <div>
                <p className="text-[10.5px] font-semibold text-cream/70">{t("admin.settings.rolesNote")}</p>
                <p className="mt-1 text-[9.5px] leading-relaxed text-white/30">{t("admin.settings.founderNote")}</p>
              </div>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 py-2 text-[10px] font-semibold text-white/40 transition hover:border-gold/40 hover:text-cream"
            >
              <ExternalLink size={11} /> {t("nav.viewSite")}
            </a>
          </SectionCard>

          <p className="flex items-center gap-1.5 px-1 text-[9px] text-white/20">
            <Globe2 size={10} /> {t("admin.settings.publicCta")}
            <span className="ml-auto inline-flex items-center gap-1">
              <Check size={9} /> {t("admin.settings.updated")}
            </span>
          </p>
        </div>
      </form>
    </div>
  );
}

function MailIcon(props) {
  return <AtSign {...props} />;
}
