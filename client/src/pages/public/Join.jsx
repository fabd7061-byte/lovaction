import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  ImagePlus,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import { Input, Textarea } from "../../components/ui/Field.jsx";
import Logo from "../../components/ui/Logo.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useSite } from "../../context/SiteContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { apiError } from "../../services/api.js";
import api from "../../services/api.js";
import { uploadImageFile } from "../../utils/upload.js";
import usePageMeta from "../../utils/usePageMeta.js";

const EMPTY = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  referralUsername: "",
  location: "",
  reasonForJoining: "",
  message: "",
  profileImage: "",
};

export default function Join() {
  const { t } = useLanguage();
  const { settings } = useSite();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const fileRef = useRef(null);

  const [form, setForm] = useState({ ...EMPTY, referralUsername: searchParams.get("ref") || "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(null);

  usePageMeta(t("nav.join"));

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setForm((current) => ({ ...current, referralUsername: ref }));
  }, [searchParams]);

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const validate = () => {
    const next = {};
    if (form.firstName.trim().length < 2) next.firstName = t("validation.short");
    if (form.lastName.trim().length < 2) next.lastName = t("validation.short");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = t("validation.email");
    if (form.phone.trim().length < 8) next.phone = t("validation.phone");
    if (form.referralUsername.trim().length < 3) next.referralUsername = t("validation.required");
    if (form.reasonForJoining.trim().length < 20) next.reasonForJoining = t("validation.reason");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      setForm((current) => ({ ...current, profileImage: url }));
      toast.success(t("join.photoUploaded"));
    } catch (err) {
      toast.error(err.message || t("common.errorText"));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setServerError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post("/applications", {
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        referralUsername: form.referralUsername.trim().replace(/^@/, ""),
        location: form.location.trim(),
        reasonForJoining: form.reasonForJoining.trim(),
        message: form.message.trim(),
      });
      setSuccess(data.application);
      window.scrollTo(0, 0);
    } catch (err) {
      const details = err?.response?.data?.details;
      if (Array.isArray(details) && details.length) {
        const mapped = {};
        details.forEach((issue) => {
          if (issue.field) mapped[issue.field] = issue.message;
        });
        setErrors((current) => ({ ...current, ...mapped }));
      }
      setServerError(apiError(err, t("join.errorTitle")));
    } finally {
      setSubmitting(false);
    }
  };

  if (!settings.joinEnabled) {
    return (
      <div className="container-page py-24">
        <div className="mx-auto max-w-lg rounded-3xl border border-ink/[0.07] bg-white p-10 text-center shadow-soft">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 text-gold-dark">
            <Lock size={24} />
          </span>
          <h1 className="mt-5 font-display text-3xl">{t("join.closed")}</h1>
          <p className="mt-3 text-[13px] leading-relaxed text-ink/50">{t("join.closedText")}</p>
          <Button as={Link} to="/contact" variant="dark" className="mt-6">
            {t("common.contactUs")}
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-cream">
        <div className="container-page py-20 sm:py-28">
          <div className="mx-auto max-w-xl rounded-[2rem] border border-gold/25 bg-white p-8 text-center shadow-lift sm:p-12">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={30} />
            </span>
            <h1 className="mt-6 font-display text-3xl leading-tight tracking-[-0.02em] sm:text-4xl">
              {t("join.successTitle")}
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed text-ink/55">{t("join.successText")}</p>

            <div className="mt-6 rounded-2xl border border-ink/[0.07] bg-cream px-5 py-4">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-ink/35">
                {t("join.reference")}
              </p>
              <p className="mt-1 font-mono text-lg font-bold tracking-[0.08em] text-ink">{success.reference}</p>
            </div>

            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              <Button as={Link} to="/" variant="dark" iconRight={ArrowRight}>
                {t("common.backHome")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(null);
                  setForm({ ...EMPTY, referralUsername: searchParams.get("ref") || "" });
                  window.scrollTo(0, 0);
                }}
              >
                {t("join.another")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink/[0.06] bg-cream">
        <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-gold/[0.13] blur-3xl" />
        <div className="container-page relative py-14 sm:py-18">
          <span className="eyebrow">
            <span className="h-1 w-1 rounded-full bg-crimson" />
            {t("join.eyebrow")}
          </span>
          <h1 className="display-lg mt-3 max-w-3xl">{t("join.title")}</h1>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink/55">{t("join.intro")}</p>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="container-page grid gap-8 lg:grid-cols-[1.18fr_0.82fr] lg:items-start">
          <div className="rounded-[1.75rem] border border-ink/[0.07] bg-white p-5 shadow-soft sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl tracking-[-0.02em]">{t("join.formTitle")}</h2>
                <p className="mt-1.5 text-[12px] text-ink/45">{t("join.formSubtitle")}</p>
              </div>
              <span className="hidden h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold-dark sm:flex">
                <HeartHandshake size={19} />
              </span>
            </div>

            {serverError && (
              <div className="mt-5 rounded-xl border border-crimson/20 bg-crimson/[0.05] px-4 py-3 text-[12px] font-medium text-crimson">
                {serverError}
              </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label={t("join.firstName")}
                  required
                  value={form.firstName}
                  onChange={update("firstName")}
                  error={errors.firstName}
                  autoComplete="given-name"
                />
                <Input
                  label={t("join.lastName")}
                  required
                  value={form.lastName}
                  onChange={update("lastName")}
                  error={errors.lastName}
                  autoComplete="family-name"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  type="email"
                  label={t("join.email")}
                  required
                  value={form.email}
                  onChange={update("email")}
                  error={errors.email}
                  autoComplete="email"
                />
                <Input
                  type="tel"
                  label={t("join.phone")}
                  required
                  value={form.phone}
                  onChange={update("phone")}
                  error={errors.phone}
                  autoComplete="tel"
                  placeholder="+250 7xx xxx xxx"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label={t("join.referralUsername")}
                  required
                  value={form.referralUsername}
                  onChange={update("referralUsername")}
                  error={errors.referralUsername}
                  hint={t("join.referralHint")}
                  placeholder={t("join.referralPlaceholder")}
                />
                <Input
                  label={t("join.locationOptional")}
                  value={form.location}
                  onChange={update("location")}
                  placeholder={t("join.locationPlaceholder")}
                />
              </div>

              <Textarea
                label={t("join.reason")}
                required
                rows={5}
                value={form.reasonForJoining}
                onChange={update("reasonForJoining")}
                error={errors.reasonForJoining}
                placeholder={t("join.reasonPlaceholder")}
              />

              <Textarea
                label={t("join.messageOptional")}
                rows={3}
                value={form.message}
                onChange={update("message")}
                placeholder={t("join.messagePlaceholder")}
              />

              <div>
                <p className="label">{t("join.photo")}</p>
                <div className="flex items-center gap-4 rounded-xl border border-dashed border-ink/15 bg-cream/50 p-3.5">
                  {form.profileImage ? (
                    <div className="relative">
                      <img
                        src={form.profileImage}
                        alt="Profile preview"
                        className="h-14 w-14 rounded-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, profileImage: "" }))}
                        aria-label={t("join.removePhoto")}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-cream"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold-dark">
                      <ImagePlus size={18} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="text-[11.5px] font-semibold text-gold-dark transition hover:text-ink"
                      disabled={uploading}
                    >
                      {uploading ? t("common.uploading") : t("join.uploadPhoto")}
                    </button>
                    <p className="mt-0.5 text-[10px] text-ink/35">{t("join.photoHint")}</p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    className="hidden"
                    onChange={onUpload}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-cream px-4 py-3">
                <Lock size={14} className="mt-0.5 shrink-0 text-gold-dark" />
                <p className="text-[10.5px] leading-relaxed text-ink/45">{t("join.requiredNote")}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-ink/40">
                  {t("join.haveAccount")}{" "}
                  <Link to="/login" className="font-semibold text-gold-dark hover:text-ink">
                    {t("join.signIn")}
                  </Link>
                </p>
                <Button type="submit" loading={submitting} iconRight={ArrowRight} size="lg">
                  {submitting ? t("join.submitting") : t("join.submit")}
                </Button>
              </div>
            </form>
          </div>

          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="relative overflow-hidden rounded-[1.75rem] bg-ink p-6 text-cream sm:p-7">
              <div className="pointer-events-none absolute inset-0 pattern-dots opacity-30" />
              <div className="relative">
                <Logo size={38} theme="dark" showMotto={false} compact />
                <h2 className="mt-6 font-display text-2xl leading-tight">{t("join.benefitsTitle")}</h2>
                <ul className="mt-5 space-y-3.5">
                  {["benefit1", "benefit2", "benefit3", "benefit4"].map((key) => (
                    <li key={key} className="flex items-start gap-2.5 text-[12px] leading-relaxed text-cream/55">
                      <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold-light">
                        <CheckCircle2 size={10} />
                      </span>
                      {t(`join.${key}`)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-ink/[0.07] bg-white p-6 shadow-soft">
              <h3 className="flex items-center gap-2 font-display text-lg">
                <Sparkles size={17} className="text-gold-dark" />
                {t("join.stepsTitle")}
              </h3>
              <ol className="mt-4 space-y-4">
                {["1", "2", "3"].map((step) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-gold-light">
                      {step}
                    </span>
                    <p className="pt-1 text-[11.5px] leading-relaxed text-ink/50">
                      {t(`join.step${step}`)}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-gold/20 bg-gold/[0.06] p-4">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-gold-dark" />
              <p className="text-[10.5px] leading-relaxed text-ink/50">{t("join.privacy")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
