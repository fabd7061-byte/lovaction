import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  Mail,
  MapPin,
  Network,
  Phone,
  Save,
  UserRound,
  Users,
} from "lucide-react";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import { Input, Textarea } from "../../components/ui/Field.jsx";
import { PageLoader } from "../../components/ui/Spinner.jsx";
import PageHeader, { CardHeader, SectionCard } from "../../components/PageHeader.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import api, { apiError } from "../../services/api.js";
import { formatDate } from "../../utils/format.js";
import { uploadImageFile } from "../../utils/upload.js";
import usePageMeta from "../../utils/usePageMeta.js";

const EMPTY = {
  firstName: "",
  lastName: "",
  phone: "",
  location: "",
  bio: "",
  profileImage: "",
};

export default function Profile() {
  const { t, lang } = useLanguage();
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const [data, setData] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const memberId = user?.id || user?._id;

  usePageMeta(t("dashboard.profileTitle"));

  const load = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/members/${memberId}`);
      setData(response.data);
      const member = response.data.member || {};
      setForm({
        firstName: member.firstName || "",
        lastName: member.lastName || "",
        phone: member.phone || "",
        location: member.location || "",
        bio: member.bio || "",
        profileImage: member.profileImage || "",
      });
    } catch (err) {
      setError(apiError(err, t("common.errorText")));
    } finally {
      setLoading(false);
    }
  }, [memberId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const onPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      setForm((current) => ({ ...current, profileImage: url }));
      updateUser({ profileImage: url });
      toast.success(t("dashboard.photoUploaded"));
    } catch (err) {
      toast.error(err.message || t("common.errorText"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError(t("validation.required"));
      return;
    }
    setSaving(true);
    try {
      const response = await api.put(`/members/${memberId}`, form);
      const member = response.data.member;
      setData((current) => ({ ...current, member: { ...current?.member, ...member } }));
      updateUser({
        firstName: member.firstName,
        lastName: member.lastName,
        fullName: member.fullName,
        profileImage: member.profileImage,
        phone: member.phone,
        location: member.location,
        bio: member.bio,
      });
      toast.success(t("dashboard.profileSaved"));
    } catch (err) {
      const message = apiError(err, t("dashboard.profileError"));
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader label={t("common.loading")} />;

  const member = data?.member || user || {};
  const stats = data?.referralStats || { approved: 0, pending: 0, rejected: 0, total: 0 };
  const childrenCount = data?.childrenCount || 0;
  const parent = member.parentMemberId;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("dashboard.nav.profile")}
        title={t("dashboard.profileTitle")}
        text={t("dashboard.profileSubtitle")}
        actions={
          <>
            <Button as={Link} to="/dashboard/tree" variant="outline" size="sm" icon={Network}>
              {t("dashboard.nav.tree")}
            </Button>
            <Button type="submit" form="profile-form" loading={saving} icon={Save} size="sm">
              {t("dashboard.saveProfile")}
            </Button>
          </>
        }
      />

      {error && !saving && (
        <div className="rounded-xl border border-crimson/20 bg-crimson/[0.05] px-4 py-3 text-[12px] font-medium text-crimson">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.5fr]">
        <SectionCard className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-ink pattern-dots opacity-95" />
          <div className="relative pt-10 text-center">
            <div className="relative mx-auto w-fit">
              <Avatar
                src={form.profileImage}
                firstName={form.firstName}
                lastName={form.lastName}
                size="3xl"
                className="ring-4 ring-white"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gold text-ink shadow-md transition hover:bg-gold-light disabled:opacity-60"
                aria-label={t("dashboard.changePhoto")}
              >
                {uploading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/40 border-t-transparent" /> : <Camera size={14} />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={onPhoto}
                className="hidden"
              />
            </div>

            <h2 className="mt-4 font-display text-xl tracking-[-0.02em]">
              {form.firstName} {form.lastName}
            </h2>
            <p className="mt-1 text-[11px] text-ink/40">@{member.username}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Badge status={member.role} />
              <Badge status={member.status} />
            </div>
            <p className="mt-3 text-[10px] text-ink/35">{t("dashboard.profilePhotoHint")}</p>

            <div className="mt-5 space-y-2.5 border-t border-ink/[0.06] pt-4 text-left">
              {[
                { icon: BadgeCheck, label: t("dashboard.memberCode"), value: member.memberCode },
                { icon: CalendarDays, label: t("dashboard.joinedOn"), value: formatDate(member.joinedAt, lang) },
                {
                  icon: Mail,
                  label: t("common.email"),
                  value: member.email,
                },
                {
                  icon: Users,
                  label: t("dashboard.invitedBy"),
                  value: parent ? `${parent.firstName} ${parent.lastName}` : t("dashboard.leader"),
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2.5">
                  <item.icon size={13} className="mt-0.5 shrink-0 text-gold-dark/70" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-ink/35">{item.label}</p>
                    <p className="mt-0.5 truncate text-[11.5px] text-ink/65">{item.value || "—"}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-ink/[0.06] pt-4">
              {[
                { label: t("dashboard.approvedCount"), value: stats.approved },
                { label: t("dashboard.pendingCount"), value: stats.pending },
                { label: t("admin.members.children"), value: childrenCount },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-cream/70 px-2 py-2">
                  <p className="font-display text-lg leading-none text-ink/80">{item.value}</p>
                  <p className="mt-1 truncate text-[8.5px] uppercase tracking-[0.06em] text-ink/35">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <form id="profile-form" onSubmit={submit} className="space-y-4">
          <SectionCard>
            <CardHeader title={t("dashboard.personalInfo")} text={t("dashboard.profileSubtitle")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t("dashboard.firstName")}
                value={form.firstName}
                onChange={set("firstName")}
                required
                autoComplete="given-name"
              />
              <Input
                label={t("dashboard.lastName")}
                value={form.lastName}
                onChange={set("lastName")}
                required
                autoComplete="family-name"
              />
              <Input
                label={t("dashboard.phone")}
                value={form.phone}
                onChange={set("phone")}
                placeholder="+250 7xx xxx xxx"
                autoComplete="tel"
              />
              <Input
                label={t("dashboard.location")}
                value={form.location}
                onChange={set("location")}
                placeholder={t("dashboard.location")}
                autoComplete="address-level2"
              />
              <div className="sm:col-span-2">
                <Textarea
                  label={t("dashboard.bio")}
                  value={form.bio}
                  onChange={set("bio")}
                  rows={4}
                  maxLength={600}
                  placeholder={t("dashboard.bioPlaceholder")}
                  hint={`${form.bio.length}/600`}
                />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-ink/[0.06] pt-4">
              <Button type="submit" loading={saving} icon={Save} size="sm">
                {t("dashboard.saveProfile")}
              </Button>
            </div>
          </SectionCard>

          <SectionCard>
            <CardHeader title={t("dashboard.accountInfo")} text={t("dashboard.accountDetails")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="label">{t("common.email")}</p>
                <div className="flex items-center gap-2 rounded-xl border border-ink/[0.07] bg-cream/60 px-4 py-3">
                  <Mail size={14} className="shrink-0 text-ink/30" />
                  <span className="min-w-0 truncate text-[12.5px] text-ink/60">{member.email}</span>
                </div>
                <p className="mt-1.5 text-[10.5px] text-ink/35">{t("dashboard.emailAdminNote")}</p>
              </div>
              <div>
                <p className="label">{t("dashboard.username")}</p>
                <div className="flex items-center gap-2 rounded-xl border border-ink/[0.07] bg-cream/60 px-4 py-3">
                  <UserRound size={14} className="shrink-0 text-ink/30" />
                  <span className="min-w-0 truncate font-mono text-[12.5px] text-ink/60">@{member.username}</span>
                </div>
                <p className="mt-1.5 text-[10.5px] text-ink/35">{t("dashboard.referralUsername")}</p>
              </div>
              <div>
                <p className="label">{t("dashboard.role")}</p>
                <div className="rounded-xl border border-ink/[0.07] bg-cream/60 px-4 py-2.5">
                  <Badge status={member.role} />
                </div>
              </div>
              <div>
                <p className="label">{t("dashboard.memberCode")}</p>
                <div className="rounded-xl border border-ink/[0.07] bg-cream/60 px-4 py-3 font-mono text-[12.5px] tracking-[0.08em] text-ink/60">
                  {member.memberCode}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-gold/20 bg-gold/[0.05] px-3.5 py-3">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-gold-dark" />
              <p className="text-[10.5px] leading-relaxed text-ink/45">
                {member.bio || t("dashboard.noBio")}
              </p>
            </div>
          </SectionCard>

          <SectionCard>
            <CardHeader title={t("dashboard.yourPath")} text={t("dashboard.pathText")} />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-ink/[0.06] bg-cream/50 px-3 py-3">
                <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-ink/35">
                  <MapPin size={11} /> {t("dashboard.location")}
                </p>
                <p className="mt-1.5 truncate text-[11.5px] font-medium text-ink/65">{form.location || "—"}</p>
              </div>
              <div className="rounded-xl border border-ink/[0.06] bg-cream/50 px-3 py-3">
                <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-ink/35">
                  <Phone size={11} /> {t("dashboard.phone")}
                </p>
                <p className="mt-1.5 truncate text-[11.5px] font-medium text-ink/65">{form.phone || "—"}</p>
              </div>
              <div className="rounded-xl border border-ink/[0.06] bg-cream/50 px-3 py-3">
                <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-ink/35">
                  <Network size={11} /> {t("dashboard.nav.tree")}
                </p>
                <Link to="/dashboard/tree" className="mt-1.5 block truncate text-[11.5px] font-semibold text-gold-dark hover:text-ink">
                  {t("dashboard.actionTreeText")} →
                </Link>
              </div>
            </div>
          </SectionCard>
        </form>
      </div>
    </div>
  );
}
