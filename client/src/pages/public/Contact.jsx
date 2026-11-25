import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Twitter,
  Youtube,
} from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import { Input, Textarea } from "../../components/ui/Field.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useSite } from "../../context/SiteContext.jsx";
import { apiError } from "../../services/api.js";
import api from "../../services/api.js";
import usePageMeta from "../../utils/usePageMeta.js";

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "" };

export default function Contact() {
  const { t } = useLanguage();
  const { settings } = useSite();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  usePageMeta(t("nav.contact"));

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setServerError("");
    const next = {};
    if (form.name.trim().length < 2) next.name = t("validation.required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = t("validation.email");
    if (form.subject.trim().length < 3) next.subject = t("validation.required");
    if (form.message.trim().length < 10) next.message = t("validation.short");
    setErrors(next);
    if (Object.keys(next).length) return;

    setSending(true);
    try {
      await api.post("/contact", {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setSent(true);
      setForm(EMPTY);
      window.scrollTo(0, 0);
    } catch (err) {
      setServerError(apiError(err, t("common.errorText")));
    } finally {
      setSending(false);
    }
  };

  const socials = settings.socials || {};
  const socialItems = [
    { href: socials.facebook, icon: Facebook, label: "Facebook" },
    { href: socials.instagram, icon: Instagram, label: "Instagram" },
    { href: socials.twitter, icon: Twitter, label: "X" },
    { href: socials.youtube, icon: Youtube, label: "YouTube" },
  ].filter((item) => item.href);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink/[0.06] bg-cream">
        <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-gold/[0.13] blur-3xl" />
        <div className="container-page relative py-14 sm:py-20">
          <span className="eyebrow">
            <span className="h-1 w-1 rounded-full bg-crimson" />
            {t("contact.eyebrow")}
          </span>
          <h1 className="display-lg mt-3 max-w-3xl">{t("contact.title")}</h1>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink/55">{t("contact.intro")}</p>
        </div>
      </section>

      <section className="py-10 sm:py-16">
        <div className="container-page grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-[1.75rem] bg-ink p-6 text-cream sm:p-8">
              <div className="pointer-events-none absolute inset-0 pattern-dots opacity-30" />
              <div className="relative">
                <p className="eyebrow-light">{t("contact.formTitle")}</p>
                <p className="mt-4 font-script text-[1.7rem] leading-snug text-gold-light">
                  “Love in Action, Hope for All.”
                </p>

                <div className="mt-7 space-y-5">
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-gold-light">
                      <MapPin size={17} />
                    </span>
                    <div>
                      <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/30">{t("contact.visitUs")}</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-cream/70">{settings.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-gold-light">
                      <Mail size={17} />
                    </span>
                    <div>
                      <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/30">{t("contact.emailUs")}</p>
                      <a href={`mailto:${settings.email}`} className="mt-1 block text-[12.5px] text-cream/70 transition hover:text-cream">
                        {settings.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-gold-light">
                      <Phone size={17} />
                    </span>
                    <div>
                      <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/30">{t("contact.callUs")}</p>
                      <a href={`tel:${settings.phone}`} className="mt-1 block text-[12.5px] text-cream/70 transition hover:text-cream">
                        {settings.phone}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-gold-light">
                      <Clock3 size={17} />
                    </span>
                    <div>
                      <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/30">{t("contact.hours")}</p>
                      <p className="mt-1 text-[12.5px] text-cream/70">{t("contact.hoursValue")}</p>
                    </div>
                  </div>
                </div>

                {socialItems.length > 0 && (
                  <div className="mt-7 border-t border-white/[0.08] pt-5">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/30">
                      {t("contact.followUs")}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      {socialItems.map((social) => (
                        <a
                          key={social.label}
                          href={social.href}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={social.label}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-cream/50 transition hover:border-gold/50 hover:text-gold-light"
                        >
                          <social.icon size={15} />
                        </a>
                      ))}
                    </div>
                    <p className="mt-3 text-[10.5px] leading-relaxed text-cream/30">{t("contact.socialNote")}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-gold/20 bg-gold/[0.06] p-4">
              <MessageSquare size={18} className="shrink-0 text-gold-dark" />
              <p className="text-[11px] leading-relaxed text-ink/50">{t("contact.responseNote")}</p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-ink/[0.07] bg-white p-5 shadow-soft sm:p-8">
            {sent ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={30} />
                </span>
                <h2 className="mt-5 font-display text-3xl">{t("contact.successTitle")}</h2>
                <p className="mt-2.5 max-w-sm text-[13px] leading-relaxed text-ink/50">{t("contact.successText")}</p>
                <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
                  {t("contact.send")}
                </Button>
              </div>
            ) : (
              <>
                <h2 className="font-display text-2xl tracking-[-0.02em]">{t("contact.formTitle")}</h2>
                <p className="mt-1.5 text-[12px] text-ink/45">{t("contact.formSubtitle")}</p>

                {serverError && (
                  <div className="mt-5 rounded-xl border border-crimson/20 bg-crimson/[0.05] px-4 py-3 text-[12px] font-medium text-crimson">
                    {serverError}
                  </div>
                )}

                <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label={t("contact.name")}
                      required
                      value={form.name}
                      onChange={update("name")}
                      error={errors.name}
                      placeholder={t("contact.namePlaceholder")}
                      autoComplete="name"
                    />
                    <Input
                      type="email"
                      label={t("common.email")}
                      required
                      value={form.email}
                      onChange={update("email")}
                      error={errors.email}
                      placeholder={t("contact.emailPlaceholder")}
                      autoComplete="email"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label={t("common.optionalPhone")}
                      value={form.phone}
                      onChange={update("phone")}
                      autoComplete="tel"
                      placeholder="+250 7xx xxx xxx"
                    />
                    <Input
                      label={t("contact.subject")}
                      required
                      value={form.subject}
                      onChange={update("subject")}
                      error={errors.subject}
                      placeholder={t("contact.subjectPlaceholderShort")}
                    />
                  </div>

                  <Textarea
                    label={t("common.message")}
                    required
                    rows={7}
                    value={form.message}
                    onChange={update("message")}
                    error={errors.message}
                    placeholder={t("contact.messagePlaceholder")}
                  />

                  <div className="flex items-start gap-2.5 rounded-xl bg-cream px-4 py-3">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    <p className="text-[10.5px] leading-relaxed text-ink/45">{t("contact.responseNote")}</p>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <p className="text-[10.5px] text-ink/35">{t("contact.responseTime")}</p>
                    <Button type="submit" loading={sending} icon={Send} size="lg">
                      {sending ? t("contact.sending") : t("contact.send")}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-ink/[0.06] bg-cream-soft py-12">
        <div className="container-page flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl">{t("join.title")}</h2>
            <p className="mt-1.5 text-[12.5px] text-ink/45">{t("join.intro")}</p>
          </div>
          <Button as="a" href="/join" variant="dark" iconRight={ArrowRight}>
            {t("common.applyNow")}
          </Button>
        </div>
      </section>
    </div>
  );
}
