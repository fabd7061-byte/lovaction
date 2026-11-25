import { useLanguage } from "../../context/LanguageContext.jsx";

export default function LangSwitch({ dark = true, className = "" }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-full border p-0.5 ${
        dark ? "border-white/12 bg-white/[0.04]" : "border-ink/10 bg-ink/[0.035]"
      } ${className}`}
      role="group"
      aria-label="Language"
    >
      {["en", "rw"].map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
              active
                ? "bg-gold text-ink shadow-sm"
                : dark
                  ? "text-cream/45 hover:text-cream"
                  : "text-ink/45 hover:text-ink"
            }`}
            aria-pressed={active}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
