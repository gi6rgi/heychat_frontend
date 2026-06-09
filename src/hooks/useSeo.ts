import { useEffect } from "react";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n";

/**
 * Per-page <head> management for the SPA. index.html ships static homepage
 * meta; this hook overrides title / description / canonical / Open Graph /
 * Twitter / robots / hreflang per route so each page presents its own identity.
 *
 * It owns those tags imperatively (matching the old usePageTitle pattern, no
 * head-management dependency): every run rewrites the COMPLETE managed set —
 * provided values or the brand defaults — so nothing leaks from the previous
 * page when navigating (e.g. a scene's canonical must not survive onto /live).
 *
 * CAVEAT: these updates run in JS. Googlebot renders JS and sees them, but
 * social/link scrapers (Twitterbot, facebookexternalhit, Slack, iMessage) and
 * other non-JS crawlers read the raw index.html only — so per-scene SHARE
 * previews still need prerendering. This hook fixes Google indexing, not the
 * social card on a shared scene link.
 */

const ORIGIN = "https://heyscenes.com";
const DEFAULT_TITLE = "HeyScenes · step into a scene with your AI companion";
const DEFAULT_DESCRIPTION =
  "Live voice conversations with AI characters: a first date, a job interview, a red-eye flight. You talk, they talk back, and you get a debrief after the scene.";
const DEFAULT_IMAGE = `${ORIGIN}/og-preview.png`;

// schema.org Open Graph locale codes for our supported languages.
const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  de: "de_DE",
  ru: "ru_RU",
};

export type SeoInput = {
  /** Full document title (used for <title> and og:title). */
  title?: string;
  /** Meta description / og:description (<=160 chars reads best). */
  description?: string;
  /**
   * Locale-agnostic app path, e.g. "/" or "/scene/first-date". Drives the
   * canonical URL (for the current locale) and the hreflang alternates (all
   * locales). Omit on app screens that should not advertise a canonical.
   */
  path?: string;
  /** Active locale; defaults to English. */
  locale?: Locale;
  /** Absolute image URL for og:image / twitter:image. */
  image?: string;
  /** Keep the page out of the index (session/app screens). */
  noindex?: boolean;
};

/** Build the absolute URL for `path` under `locale` (English stays bare). */
function localeUrl(locale: Locale, path: string): string {
  const suffix = path === "/" ? "" : path;
  return locale === DEFAULT_LOCALE
    ? `${ORIGIN}${path}`
    : `${ORIGIN}/${locale}${suffix}`;
}

function upsertMeta(key: "name" | "property", value: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${value}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(key, value);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSeo({
  title,
  description,
  path,
  locale = DEFAULT_LOCALE,
  image,
  noindex,
}: SeoInput) {
  useEffect(() => {
    const resolvedTitle = title || DEFAULT_TITLE;
    const resolvedDescription = description || DEFAULT_DESCRIPTION;
    const resolvedImage = image || DEFAULT_IMAGE;
    // Canonical/og:url: the current page when it has a path, else the home URL.
    const url = path ? localeUrl(locale, path) : `${ORIGIN}/`;

    document.title = resolvedTitle;
    document.documentElement.lang = locale;

    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    upsertMeta("name", "description", resolvedDescription);
    upsertLink("canonical", url);

    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:title", resolvedTitle);
    upsertMeta("property", "og:description", resolvedDescription);
    upsertMeta("property", "og:image", resolvedImage);
    upsertMeta("property", "og:locale", OG_LOCALE[locale]);

    upsertMeta("name", "twitter:title", resolvedTitle);
    upsertMeta("name", "twitter:description", resolvedDescription);
    upsertMeta("name", "twitter:image", resolvedImage);

    // hreflang + og:locale:alternate are multi-valued: clear the set this hook
    // owns and rebuild it for the current path (skip on path-less app screens).
    document.head
      .querySelectorAll("[data-seo-alt]")
      .forEach((el) => el.remove());
    if (path) {
      for (const loc of LOCALES) {
        const link = document.createElement("link");
        link.setAttribute("rel", "alternate");
        link.setAttribute("hreflang", loc);
        link.setAttribute("href", localeUrl(loc, path));
        link.setAttribute("data-seo-alt", "");
        document.head.appendChild(link);
        if (loc !== locale) {
          const meta = document.createElement("meta");
          meta.setAttribute("property", "og:locale:alternate");
          meta.setAttribute("content", OG_LOCALE[loc]);
          meta.setAttribute("data-seo-alt", "");
          document.head.appendChild(meta);
        }
      }
      const xDefault = document.createElement("link");
      xDefault.setAttribute("rel", "alternate");
      xDefault.setAttribute("hreflang", "x-default");
      xDefault.setAttribute("href", localeUrl(DEFAULT_LOCALE, path));
      xDefault.setAttribute("data-seo-alt", "");
      document.head.appendChild(xDefault);
    }
  }, [title, description, path, locale, image, noindex]);
}
