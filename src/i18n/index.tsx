/**
 * Locale plumbing. The selected language lives in the URL: English is the
 * default and stays unprefixed (/scene/x), every other locale gets a path
 * prefix (/de/scene/x). The backend mirrors this with ?lang= — scenario
 * content arrives already localized, this module only resolves the locale
 * and serves the chrome dictionary.
 */
import { useCallback } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { de, en, ru, type Messages } from "./messages";

export const LOCALES = ["en", "de", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

const MESSAGES: Record<Locale, Messages> = { en, de, ru };

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

// The user's language, remembered across visits. Written on an explicit
// switcher click and by the one-time first-visit detection — an explicit
// choice always beats re-detection.
const STORAGE_KEY = "heyscenes.locale";

export function getSavedLocale(): Locale | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY) ?? undefined;
    return isLocale(value) ? value : null;
  } catch {
    return null; // storage blocked (private mode, iframe) — detect each visit
  }
}

export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* storage blocked — nothing to persist */
  }
}

/** Best supported match for the browser's preferred languages ("de-AT" → de). */
export function detectLocale(): Locale {
  for (const lang of navigator.languages ?? [navigator.language]) {
    const base = lang?.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

/**
 * First-visit language routing, mounted in the app layout. Acts ONLY on the
 * bare root `/`: deep links open exactly as shared, and locale-prefixed pages
 * are already explicit. Priority: saved choice → browser language (saved so
 * detection runs once per browser) → English.
 */
export function AutoLocaleRedirect() {
  const { pathname, search } = useLocation();
  if (pathname !== "/") return null;
  // Resolved synchronously during render — a useEffect redirect would flash
  // the English wall first. The localStorage write is idempotent, so React
  // re-running the render (StrictMode) is harmless.
  let locale = getSavedLocale();
  if (!locale) {
    locale = detectLocale();
    saveLocale(locale);
  }
  if (locale === DEFAULT_LOCALE) return null;
  return <Navigate to={{ pathname: `/${locale}`, search }} replace />;
}

/** The active locale, derived from the route's :locale segment. */
export function useLocale(): Locale {
  const { locale } = useParams<{ locale?: string }>();
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
}

/** The UI string dictionary for the active locale. */
export function useT(): Messages {
  return MESSAGES[useLocale()];
}

/** Prefix an absolute app path with the active locale (en stays bare). */
export function useLocalePath(): (path: string) => string {
  const locale = useLocale();
  return useCallback(
    (path: string) =>
      locale === DEFAULT_LOCALE ? path : `/${locale}${path === "/" ? "" : path}`,
    [locale],
  );
}

/** The same location with its locale prefix swapped for `target`. */
export function useSwitchLocaleHref(): (target: Locale) => string {
  const current = useLocale();
  const { pathname, search } = useLocation();
  return useCallback(
    (target: Locale) => {
      const bare =
        current === DEFAULT_LOCALE
          ? pathname
          : pathname.replace(new RegExp(`^/${current}(?=/|$)`), "") || "/";
      const prefixed =
        target === DEFAULT_LOCALE ? bare : `/${target}${bare === "/" ? "" : bare}`;
      return `${prefixed}${search}`;
    },
    [current, pathname, search],
  );
}

/** Catch-all target that keeps the active locale: /de/nope → /de, /nope → /. */
export function LocaleHomeRedirect() {
  const lp = useLocalePath();
  return <Navigate to={lp("/")} replace />;
}

/**
 * Route guard for the /:locale branch. Rejects unknown prefixes (so /garbage
 * doesn't render the library with a phantom locale) and canonicalizes an
 * explicit /en/... to the bare path.
 */
export function LocaleGate() {
  const { locale } = useParams<{ locale?: string }>();
  const { pathname, search } = useLocation();

  if (locale === DEFAULT_LOCALE) {
    const bare = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
    return <Navigate to={`${bare}${search}`} replace />;
  }
  if (!isLocale(locale)) return <Navigate to="/" replace />;
  return <Outlet />;
}
