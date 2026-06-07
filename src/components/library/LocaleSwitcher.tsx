import { Link } from "react-router-dom";
import { LOCALES, useLocale, useSwitchLocaleHref } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * EN / DE language toggle, styled like the genre filter row: small-caps,
 * active locale in amber. Switching swaps the URL's locale prefix in place,
 * so the user stays on the page they're looking at.
 */
export function LocaleSwitcher() {
  const current = useLocale();
  const switchHref = useSwitchLocaleHref();

  return (
    <nav
      aria-label="Language"
      className="flex items-center font-label text-[13px] font-medium tracking-[0.14em]"
    >
      {LOCALES.map((locale, i) => (
        <span key={locale} className="flex items-center">
          {i > 0 && <span className="px-2 text-paper-faint">/</span>}
          <Link
            to={switchHref(locale)}
            aria-current={current === locale ? "true" : undefined}
            className={cn(
              "uppercase transition-colors duration-300 ease-[var(--ease-cinema)]",
              current === locale
                ? "text-amber"
                : "text-paper-dim hover:text-paper",
            )}
          >
            {locale}
          </Link>
        </span>
      ))}
    </nav>
  );
}
