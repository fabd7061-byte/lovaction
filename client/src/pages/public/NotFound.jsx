import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import { LogoMark } from "../../components/ui/Logo.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import usePageMeta from "../../utils/usePageMeta.js";

export default function NotFound() {
  const { t } = useLanguage();
  usePageMeta(t("common.notFoundTitle"));

  return (
    <div className="relative overflow-hidden bg-ink py-24 text-cream sm:py-32">
      <div className="pointer-events-none absolute inset-0 pattern-dots opacity-30" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.07] blur-3xl" />
      <div className="container-page relative text-center">
        <div className="mx-auto mb-6 w-fit">
          <LogoMark size={58} />
        </div>
        <p className="font-display text-[6rem] leading-none tracking-[-0.06em] text-gold-light/25 sm:text-[9rem]">404</p>
        <h1 className="mt-2 font-display text-3xl leading-tight tracking-[-0.025em] sm:text-5xl">
          {t("common.notFoundTitle")}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[13.5px] leading-relaxed text-cream/40">
          {t("common.notFoundText")}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          <Button as={Link} to="/" icon={Home}>
            {t("common.backHome")}
          </Button>
          <Button as={Link} to="/contact" variant="outline-light" icon={ArrowLeft}>
            {t("common.contactUs")}
          </Button>
        </div>
      </div>
    </div>
  );
}
