import { Link } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  Heart,
  HeartHandshake,
  Quote,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import SectionHeading from "../../components/ui/SectionHeading.jsx";
import Reveal from "../../components/ui/Reveal.jsx";
import Button from "../../components/ui/Button.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import usePageMeta from "../../utils/usePageMeta.js";

const VALUES = [
  { key: "love", icon: Heart },
  { key: "compassion", icon: HeartHandshake },
  { key: "integrity", icon: ShieldCheck },
  { key: "respect", icon: Sparkles },
  { key: "justice", icon: Scale },
  { key: "transparency", icon: Eye },
  { key: "collaboration", icon: Users },
];

const STORY_IMAGE =
  "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1100&q=80";
const TEAM_IMAGE =
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&q=80";

export default function About() {
  const { t } = useLanguage();
  usePageMeta(t("nav.about"));

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink/[0.06] bg-cream">
        <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-gold/[0.12] blur-3xl" />
        <div className="container-page relative grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-24">
          <div>
            <span className="eyebrow">
              <span className="h-1 w-1 rounded-full bg-crimson" />
              {t("about.eyebrow")}
            </span>
            <h1 className="display-lg mt-4 max-w-2xl">{t("about.title")}</h1>
            <p className="mt-5 max-w-xl text-[14.5px] leading-relaxed text-ink/55">{t("about.intro")}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {["love", "compassion", "integrity", "respect"].map((value) => (
                <span
                  key={value}
                  className="rounded-full border border-ink/10 bg-white/70 px-3.5 py-1.5 text-[11px] font-medium text-ink/55"
                >
                  {t(`about.value.${value}`)}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="overflow-hidden rounded-[2rem] rounded-tr-[5rem]">
              <img src={STORY_IMAGE} alt={t("about.title")} className="aspect-[4/4.4] w-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-4 w-48 rounded-2xl bg-ink p-4 text-cream shadow-lift sm:-left-8">
              <p className="font-script text-[1.2rem] leading-snug text-gold-light">Love in Action, Hope for All.</p>
              <p className="mt-2 text-[9px] uppercase tracking-[0.16em] text-cream/35">Lovaction Ministries</p>
            </div>
            <div className="absolute -right-3 top-8 rounded-2xl border border-gold/30 bg-cream px-4 py-3 text-center shadow-soft">
              <p className="font-display text-2xl leading-none text-ink">2019</p>
              <p className="mt-1 text-[8.5px] uppercase tracking-[0.16em] text-ink/40">Founded</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal className="relative">
            <img
              src={TEAM_IMAGE}
              alt={t("about.storyTitle")}
              loading="lazy"
              className="aspect-[5/4] w-full rounded-[2rem] object-cover"
            />
            <div className="absolute -bottom-5 right-5 flex items-center gap-3 rounded-2xl border border-ink/[0.06] bg-white px-4 py-3 shadow-lift">
              <Quote size={18} className="text-crimson" />
              <p className="max-w-[12rem] text-[10.5px] leading-snug text-ink/55">{t("home.quote")}</p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <span className="eyebrow">
              <span className="h-1 w-1 rounded-full bg-crimson" />
              {t("about.storyTitle")}
            </span>
            <h2 className="mt-3 font-display text-3xl leading-tight tracking-[-0.02em] sm:text-[2.5rem]">
              {t("about.storyTitle")}
            </h2>
            <p className="mt-4 text-[13.5px] leading-relaxed text-ink/55">{t("about.story1")}</p>
            <p className="mt-3 text-[13.5px] leading-relaxed text-ink/55">{t("about.story2")}</p>
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-gold/20 bg-gold/[0.055] p-4">
              <HeartHandshake size={22} className="shrink-0 text-gold-dark" />
              <p className="text-[12px] leading-relaxed text-ink/60">{t("home.quote")}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-ink py-16 text-cream sm:py-24">
        <div className="pointer-events-none absolute inset-0 pattern-dots opacity-30" />
        <div className="container-page relative">
          <SectionHeading
            eyebrow={t("about.valuesLabel")}
            title={t("about.valuesTitle")}
            text={t("about.valuesText")}
            light
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value, index) => (
              <Reveal key={value.key} delay={index * 50}>
                <div className="group h-full rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition hover:border-gold/30 hover:bg-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold-light">
                      <value.icon size={18} strokeWidth={1.7} />
                    </span>
                    <span className="font-display text-xl text-white/10">0{index + 1}</span>
                  </div>
                  <h3 className="mt-4 font-display text-[1.05rem] text-cream">{t(`about.value.${value.key}`)}</h3>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-cream/40">
                    {t(`about.value.${value.key}Text`)}
                  </p>
                </div>
              </Reveal>
            ))}
            <Reveal delay={350}>
              <div className="flex h-full flex-col justify-between rounded-2xl border border-gold/25 bg-gold/[0.08] p-5">
                <p className="font-script text-[1.4rem] leading-snug text-gold-light">
                  “{t("about.ctaText")}”
                </p>
                <Link
                  to="/join"
                  className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-light transition hover:text-cream"
                >
                  {t("nav.join")} <ArrowRight size={13} />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container-page">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-ink/[0.07] bg-white p-7 shadow-soft">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/10 text-gold-dark">
                <Sparkles size={20} />
              </span>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-dark">
                {t("about.visionLabel")}
              </p>
              <h3 className="mt-2 font-display text-2xl leading-tight tracking-[-0.02em]">
                {t("home.visionTitle")}
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-ink/55">{t("about.visionText")}</p>
            </div>
            <div className="rounded-3xl bg-ink p-7 text-cream shadow-lift">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-crimson/15 text-crimson">
                <HeartHandshake size={20} />
              </span>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-light/70">
                {t("about.missionLabel")}
              </p>
              <h3 className="mt-2 font-display text-2xl leading-tight tracking-[-0.02em]">
                {t("home.missionTitle")}
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-cream/50">{t("about.missionText1")}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-cream/45">{t("about.missionText2")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/[0.06] bg-cream-soft py-16 sm:py-24">
        <div className="container-page">
          <SectionHeading
            align="center"
            eyebrow={t("about.approachLabel")}
            title={t("about.approachTitle")}
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {["1", "2", "3"].map((step, index) => (
              <Reveal key={step} delay={index * 90}>
                <div className="relative h-full rounded-3xl border border-ink/[0.07] bg-white p-6 shadow-soft">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-display text-lg text-gold-dark">
                    {step}
                  </span>
                  <h3 className="mt-5 font-display text-xl">{t(`about.approach${step}.title`)}</h3>
                  <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink/50">
                    {t(`about.approach${step}.text`)}
                  </p>
                  {index < 2 && (
                    <span className="absolute -right-2 top-1/2 hidden h-px w-6 bg-gold/40 md:block" />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-gradient-to-br from-gold-pale via-cream to-cream p-8 sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="font-display text-3xl leading-tight tracking-[-0.02em]">{t("about.ctaTitle")}</h2>
            <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-ink/50">{t("about.ctaText")}</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button as={Link} to="/join" iconRight={ArrowRight}>
              {t("common.joinUs")}
            </Button>
            <Button as={Link} to="/contact" variant="outline">
              {t("common.contactUs")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
