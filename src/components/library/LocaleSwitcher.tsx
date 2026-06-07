import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import {
  LOCALES,
  saveLocale,
  useLocale,
  useSwitchLocaleHref,
  type Locale,
} from "@/i18n";
import { cn } from "@/lib/utils";

/** Native-language labels — intentionally never translated. */
const NAMES: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  ru: "Русский",
};

/**
 * Language switcher: a globe icon in the same square affordance as the help
 * "?", dropping a small locale menu under the bar. Switching swaps the URL's
 * locale prefix in place, so the user stays on the page they're looking at.
 * The click also persists the choice — an explicit pick must beat the
 * first-visit auto-detection (switching to EN would otherwise bounce straight
 * back off the saved/browser language).
 */
export function LocaleSwitcher() {
  const current = useLocale();
  const switchHref = useSwitchLocaleHref();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Close on Escape (like the help dialog) and on any press outside.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPress = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPress);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPress);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label="Language"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-7 w-7 items-center justify-center border transition-colors duration-300 ease-[var(--ease-cinema)]",
          open
            ? "border-amber text-amber"
            : "border-hairline text-paper-dim hover:border-paper-dim hover:text-paper",
        )}
      >
        <Globe aria-hidden className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>

      {open && (
        <nav
          aria-label="Language"
          className="absolute right-0 top-full z-30 mt-2 flex w-36 flex-col border border-hairline bg-night py-1"
        >
          {LOCALES.map((locale) => (
            <Link
              key={locale}
              to={switchHref(locale)}
              onClick={() => {
                saveLocale(locale);
                setOpen(false);
              }}
              aria-current={current === locale ? "true" : undefined}
              className={cn(
                "px-4 py-2 font-label text-[13px] font-medium uppercase tracking-[0.14em] transition-colors duration-300 ease-[var(--ease-cinema)]",
                current === locale
                  ? "text-amber"
                  : "text-paper-dim hover:text-paper",
              )}
            >
              {NAMES[locale]}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
