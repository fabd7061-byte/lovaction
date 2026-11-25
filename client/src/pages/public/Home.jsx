import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarRange,
  Check,
  GraduationCap,
  HeartHandshake,
  Home as HomeIcon,
  MapPin,
  Quote,
  Sparkles,
  Users,
} from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import SectionHeading from "../../components/ui/SectionHeading.jsx";
import Reveal from "../../components/ui/Reveal.jsx";
import NewsCard from "../../components/NewsCard.jsx";
import Lightbox from "../../components/Lightbox.jsx";
import StatCard from "../../components/StatCard.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useSite } from "../../context/SiteContext.jsx";
import { formatNumber } from "../../utils/format.js";
import usePageMeta from "../../utils/usePageMeta.js";
import api from "../../services/api.js";

const IMAGE = {
  hero: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
  about: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1000&q=80",
  quote:
    "https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1000&q=80",
};

const ACTIVITIES = [
  { key: "activity1", icon: BookOpen },
  { key: "activity2", icon: GraduationCap },
  { key: "activity3", icon: HomeIcon },
  { key: "activity4", icon: HeartHandshake },
];

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse rounded-2xl bg-ink/[0.06] ${index === 0 ? "col-span-2 row-span-2 h-full min-h-[280px]" : "aspect-[4/3]"}`}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();
  const { stats, settings } = useSite();
  const [news, setNews] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  usePageMeta(t("brand.name"));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [newsRes, galleryRes] = await Promise.allSettled([
        api.get("/news", { params: { limit: 3 } }),
        api.get("/gallery", { params: { limit: 6 } }),
      ]);
      if (cancelled) return;
      if (newsRes.status === "fulfilled") setNews(newsRes.value.data.items || []);
      if (galleryRes.status === "fulfilled") setPhotos(galleryRes.value.data.items || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = [
    { label: t("home.statsMembers"), value: formatNumber(stats.members), icon: Users, tone: "gold" },
    { label: t("home.statsReferrals"), value: formatNumber(stats.referrals), icon: HeartHandshake, tone: "crimson" },
    { label: t("home.statsYears"), value: formatNumber(stats.yearsOfService || new Date().getFullYear() - (settings.foundedYear || 2019)), icon: CalendarRange, tone: "blue" },
    { label: t("home.statsPoints"), value: formatNumber(stats.pointsEarned), icon: Sparkles, tone: "green" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-cream">
        <div className="pointer-events-none absolute inset-0 pattern-dots opacity-40" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-[34rem] w-[34rem] rounded-full bg-gold/[0.09] blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-40 left-1/4 h-[26rem] w-[26rem] rounded-full bg-crimson/[0.08] blur-[100px]" />

        <div className="container-page relative grid items-center gap-12 pb-28 pt-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:pb-32 lg:pt-20">
          <div className="animate-fade-up">
            <span className="eyebrow-light">
              <span className="h-px w-8 bg-gold/70" />
              {t("home.eyebrow")}
            </span>
            <h1 className="display-xl mt-5 text-cream">
              {t("home.heroTitle1")}
              <span className="italic text-gradient-gold">{t("home.heroTitleAccent")}</span>
              <br />
              {t("home.heroTitle2")}
            </h1>
            <p className="mt-6 max-w-xl text-[14.5px] leading-relaxed text-cream/55 sm:text-[15px]">
              {t("home.heroText")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button as={Link} to="/join" size="lg" iconRight={ArrowRight}>
                {t("home.heroPrimary")}
              </Button>
              <Button as="a" href="#our-work" variant="outline-light" size="lg">
                {t("home.heroSecondary")}
              </Button>
            </div>

            <div className="mt-8 flex items-center gap-3 text-[11.5px] text-cream/35">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gold/30 text-gold-light">
                <Check size={11} />
              </span>
              {t("home.heroNote")}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[480px] lg:mx-0 lg:ml-auto">
            <div className="absolute -left-3 -top-3 h-full w-full rounded-[30px] border border-gold/25 sm:-left-5 sm:-top-5" />
            <div className="relative overflow-hidden rounded-[26px] border border-white/10">
              <img
                src={IMAGE.hero}
                alt={t("home.imageCaption")}
                className="aspect-[4/4.6] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <p className="max-w-[19rem] font-script text-[1.35rem] leading-snug text-cream/90 sm:text-[1.5rem]">
                  “{t("home.imageCaption")}”
                </p>
              </div>
            </div>

            <div className="absolute -left-4 bottom-24 hidden w-[13.5rem] rounded-2xl border border-gold/25 bg-ink-soft/95 p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur sm:block">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gold-light/70">
                {t("home.visionLabel")}
              </p>
              <p className="mt-2 font-display text-[13.5px] leading-snug text-cream/85">
                {t("home.visionTitle")}
              </p>
            </div>

            <div className="absolute -right-3 top-8 flex flex-col items-center gap-1 rounded-full border border-gold/30 bg-ink/80 px-2.5 py-4 backdrop-blur sm:-right-5">
              <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-gold-light/70">Est.</span>
              <span className="font-display text-base text-gold-light">{settings.foundedYear || 2019}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 -mt-14 pb-8">
        <div className="container-page">
          <div className="grid gap-3 rounded-3xl border border-ink/[0.06] bg-cream p-3 shadow-lift sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3.5 rounded-2xl bg-white/70 px-4 py-4"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold-dark">
                  <stat.icon size={19} strokeWidth={1.7} />
                </span>
                <div>
                  <p className="font-display text-[1.55rem] leading-none text-ink">{stat.value}</p>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.1em] text-ink/40">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16 sm:py-24">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal className="relative order-2 lg:order-1">
            <div className="relative mx-auto max-w-md">
              <div className="overflow-hidden rounded-[26px]">
                <img
                  src={IMAGE.about}
                  alt={t("home.aboutTitle")}
                  className="aspect-[4/4.4] w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="absolute -bottom-8 -right-3 w-[15rem] rounded-2xl border border-gold/25 bg-ink p-5 text-cream shadow-lift sm:-right-7">
                <Quote size={20} className="text-gold" />
                <p className="mt-2.5 font-script text-[1.25rem] leading-snug text-cream/90">
                  {t("home.quote")}
                </p>
                <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-gold-light/60">
                  {t("home.quoteBy")}
                </p>
              </div>
              <div className="absolute -left-4 -top-4 h-24 w-24 rounded-tl-[26px] border-l-2 border-t-2 border-gold/40" />
            </div>
          </Reveal>

          <Reveal delay={80} className="order-1 lg:order-2">
            <SectionHeading
              eyebrow={t("home.aboutEyebrow")}
              title={t("home.aboutTitle")}
              text={t("home.aboutText1")}
            />
            <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-ink/55">
              {t("home.aboutText2")}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-ink/[0.07] bg-white p-4 shadow-soft">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-crimson/10 text-crimson">
                  <HeartHandshake size={17} />
                </span>
                <h3 className="mt-3 font-display text-[15px]">{t("home.missionLabel")}</h3>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink/50">{t("home.missionText")}</p>
              </div>
              <div className="rounded-2xl border border-ink/[0.07] bg-white p-4 shadow-soft">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-gold-dark">
                  <Sparkles size={17} />
                </span>
                <h3 className="mt-3 font-display text-[15px]">{t("home.visionLabel")}</h3>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink/50">{t("home.visionText")}</p>
              </div>
            </div>

            <Button as={Link} to="/about" variant="outline" className="mt-6" iconRight={ArrowUpRight}>
              {t("common.learnMore")}
            </Button>
          </Reveal>
        </div>
      </section>

      {/* Activities */}
      <section id="our-work" className="relative overflow-hidden bg-cream-soft py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 pattern-lines opacity-60" />
        <div className="container-page relative">
          <SectionHeading
            eyebrow={t("home.activityEyebrow")}
            title={t("home.activityTitle")}
            text={t("home.activityText")}
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ACTIVITIES.map((activity, index) => (
              <Reveal key={activity.key} delay={index * 60}>
                <div className="group relative h-full overflow-hidden rounded-3xl border border-ink/[0.07] bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <span className="absolute right-5 top-4 font-display text-[3.2rem] leading-none text-ink/[0.045]">
                    0{index + 1}
                  </span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold-dark transition group-hover:bg-gold group-hover:text-ink">
                    <activity.icon size={21} strokeWidth={1.7} />
                  </span>
                  <h3 className="mt-5 font-display text-[1.25rem] leading-tight">
                    {t(`home.${activity.key}.title`)}
                  </h3>
                  <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink/50">
                    {t(`home.${activity.key}.text`)}
                  </p>
                  <span className="mt-5 inline-flex h-px w-10 bg-gold/60 transition-all duration-300 group-hover:w-16" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* News */}
      <section className="py-16 sm:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow={t("home.newsEyebrow")}
            title={t("home.newsTitle")}
            text={t("home.newsText")}
            action={
              <Button as={Link} to="/news" variant="outline" iconRight={ArrowRight}>
                {t("home.viewAllNews")}
              </Button>
            }
          />
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="overflow-hidden rounded-2xl border border-ink/[0.06] bg-white">
                    <div className="aspect-[16/10] animate-pulse bg-ink/[0.06]" />
                    <div className="space-y-2.5 p-5">
                      <div className="h-2.5 w-1/3 animate-pulse rounded bg-ink/[0.06]" />
                      <div className="h-4 w-5/6 animate-pulse rounded bg-ink/[0.06]" />
                      <div className="h-2.5 w-full animate-pulse rounded bg-ink/[0.05]" />
                    </div>
                  </div>
                ))
              : news.map((item) => <NewsCard key={item._id} item={item} compact />)}
          </div>
          {!loading && news.length === 0 && (
            <p className="mt-8 rounded-2xl border border-dashed border-ink/10 py-10 text-center text-[13px] text-ink/40">
              {t("home.newsEmpty")}
            </p>
          )}
        </div>
      </section>

      {/* Gallery */}
      <section className="pb-16 sm:pb-24">
        <div className="container-page">
          <SectionHeading
            eyebrow={t("home.galleryEyebrow")}
            title={t("home.galleryTitle")}
            text={t("home.galleryText")}
            action={
              <Button as={Link} to="/gallery" variant="outline" iconRight={ArrowRight}>
                {t("home.openGallery")}
              </Button>
            }
          />
          <div className="mt-9">
            {loading ? (
              <GallerySkeleton />
            ) : photos.length ? (
              <div className="grid auto-rows-[180px] grid-cols-2 gap-3 md:grid-cols-4">
                {photos.slice(0, 5).map((photo, index) => (
                  <button
                    key={photo._id}
                    type="button"
                    onClick={() => setLightbox(index)}
                    className={`group relative overflow-hidden rounded-2xl ${
                      index === 0 ? "col-span-2 row-span-2" : "col-span-1"
                    }`}
                  >
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                    <span className="absolute inset-x-0 bottom-0 translate-y-3 p-4 text-left opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <span className="block text-[9px] uppercase tracking-[0.14em] text-gold-light">{photo.album}</span>
                      <span className="mt-1 block font-display text-sm text-cream">{photo.title}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-ink/10 py-10 text-center text-[13px] text-ink/40">
                {t("home.galleryEmpty")}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="container-page pb-16 sm:pb-24">
        <div className="relative overflow-hidden rounded-[30px] bg-ink px-6 py-14 text-cream sm:px-12 lg:px-16">
          <div className="pointer-events-none absolute inset-0 pattern-dots opacity-40" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <span className="eyebrow-light">
                <span className="h-px w-8 bg-gold/70" />
                {t("home.joinEyebrow")}
              </span>
              <h2 className="mt-4 max-w-2xl font-display text-3xl leading-[1.08] tracking-[-0.025em] sm:text-[2.7rem]">
                {t("home.joinTitle")}
              </h2>
              <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-cream/50">
                {t("home.joinText")}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button as={Link} to="/join" size="lg" iconRight={ArrowRight}>
                  {t("home.heroPrimary")}
                </Button>
                <Button as={Link} to="/contact" variant="outline-light" size="lg">
                  {t("common.contactUs")}
                </Button>
              </div>
              <p className="mt-4 text-[10.5px] text-cream/25">{t("home.joinNote")}</p>
            </div>
            <div className="hidden justify-end lg:flex">
              <div className="relative flex h-44 w-44 items-center justify-center">
                <span className="absolute inset-0 rounded-full border border-gold/20" />
                <span className="absolute inset-5 rounded-full border border-gold/15" />
                <span className="absolute inset-10 rounded-full bg-gold/[0.07]" />
                <HeartHandshake size={56} strokeWidth={1.1} className="relative text-gold-light" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="border-y border-ink/[0.06] bg-cream-soft py-14">
        <div className="container-page flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="eyebrow">
              <span className="h-1 w-1 rounded-full bg-crimson" />
              {t("home.contactEyebrow")}
            </span>
            <h2 className="mt-2.5 max-w-xl font-display text-2xl leading-tight tracking-[-0.02em] sm:text-3xl">
              {t("home.contactTitle")}
            </h2>
            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-ink/45">
              <MapPin size={13} className="text-gold-dark" /> {settings.address}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button as={Link} to="/contact" variant="dark" iconRight={ArrowUpRight}>
              {t("common.contactUs")}
            </Button>
            <Button as={Link} to="/members" variant="outline">
              {t("home.meetCommunity")}
            </Button>
          </div>
        </div>
      </section>

      {lightbox !== null && (
        <Lightbox
          items={photos}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndex={setLightbox}
        />
      )}
    </div>
  );
}
