/**
 * Post-build prerender for SEO + social share previews.
 *
 * The app is a client-rendered SPA, so the served index.html carries only the
 * homepage's <head>, and scene content isn't in the raw HTML. Googlebot renders
 * JS and sees the per-route meta that useSeo sets at runtime, but social/link
 * scrapers (Twitterbot, facebookexternalhit, Slack, iMessage, WhatsApp,
 * LinkedIn) and non-JS crawlers (Bing) read the raw HTML only.
 *
 * This script runs after `vite build` and writes a static HTML file per catalog
 * route (home, create, and each scene, across en/de/ru) — a copy of the built
 * index.html with the homepage <head> replaced by the route's own title /
 * description / canonical / Open Graph / Twitter / hreflang, plus a small
 * <h1>+logline snippet in the body for non-JS crawlers. The live SPA hydrates
 * over it unchanged. Vercel serves these files filesystem-first; the existing
 * catch-all rewrite still covers non-prerendered routes (user-created scenes).
 *
 * Scene copy is vendored in catalog-meta.json (no build-time network); the head
 * values mirror what src/hooks/useSeo.ts produces at runtime. Keep the two in
 * sync, and regenerate catalog-meta.json when catalog scene copy changes.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(HERE, "../dist");

const meta = JSON.parse(await readFile(join(HERE, "catalog-meta.json"), "utf-8"));
const { origin, imageBase, scenes } = meta;

const LOCALES = ["en", "de", "ru"];
const OG_LOCALE = { en: "en_US", de: "de_DE", ru: "ru_RU" };
const DEFAULT_IMAGE = `${origin}/og-preview.png`;
const DEFAULT_DESCRIPTION =
  "Live voice conversations with AI characters: a first date, a job interview, a red-eye flight. You talk, they talk back, and you get a debrief after the scene.";

// Localized home + create titles, mirroring src/i18n/messages.ts (titles.*).
const HOME_TITLE = {
  en: "HeyScenes · step into a scene with your AI companion",
  de: "HeyScenes · tritt in eine Szene mit deinem KI-Partner ein",
  ru: "HeyScenes · войди в сцену со своим ИИ-партнёром",
};
const CREATE_TITLE = {
  en: "Create your scene · HeyScenes",
  de: "Erstelle deine Szene · HeyScenes",
  ru: "Создай свою сцену · HeyScenes",
};

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Absolute URL for a locale-agnostic app path (English stays bare). */
function localeUrl(locale, path) {
  const suffix = path === "/" ? "" : path;
  return locale === "en" ? `${origin}${path}` : `${origin}/${locale}${suffix}`;
}

/** dist-relative output dir for a (locale, path) pair. */
function outDir(locale, path) {
  const localePart = locale === "en" ? "" : `/${locale}`;
  const pathPart = path === "/" ? "" : path;
  return join(DIST, `.${localePart}${pathPart}`);
}

/** Build the managed <head> block for a route. */
function headBlock({ locale, path, title, description, image, isOgPreview }) {
  const url = localeUrl(locale, path);
  const lines = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<link rel="canonical" href="${url}" />`,
  ];
  for (const loc of LOCALES) {
    lines.push(
      `<link rel="alternate" hreflang="${loc}" href="${localeUrl(loc, path)}" />`,
    );
  }
  lines.push(
    `<link rel="alternate" hreflang="x-default" href="${localeUrl("en", path)}" />`,
  );
  lines.push(
    `<meta property="og:site_name" content="HeyScenes" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:alt" content="${esc(title)}" />`,
  );
  // The brand preview is a known 1200x630 PNG; scene art dimensions vary, so we
  // declare type/size only for the brand image and let scrapers infer the rest.
  if (isOgPreview) {
    lines.push(
      `<meta property="og:image:type" content="image/png" />`,
      `<meta property="og:image:width" content="1200" />`,
      `<meta property="og:image:height" content="630" />`,
    );
  }
  lines.push(`<meta property="og:locale" content="${OG_LOCALE[locale]}" />`);
  for (const loc of LOCALES) {
    if (loc !== locale) {
      lines.push(
        `<meta property="og:locale:alternate" content="${OG_LOCALE[loc]}" />`,
      );
    }
  }
  lines.push(
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  );
  return lines.join("\n    ");
}

/** Strip the homepage-only SEO tags from the built template so we can rebuild. */
function stripManagedHead(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<meta[^>]*\bname="description"[^>]*>\s*/gi, "")
    .replace(/<link[^>]*\brel="canonical"[^>]*>\s*/gi, "")
    .replace(/<meta[^>]*\bproperty="og:[^"]*"[^>]*>\s*/gi, "")
    .replace(/<meta[^>]*\bname="twitter:[^"]*"[^>]*>\s*/gi, "");
}

/** Produce a route's full HTML from the stripped template. */
function renderRoute(template, opts) {
  const heading = opts.heading ?? opts.title;
  const snippet =
    `<div id="root"><div id="seo-prerender">` +
    `<h1>${esc(heading)}</h1><p>${esc(opts.description)}</p></div></div>`;
  return template
    .replace(/<html lang="[^"]*"/i, `<html lang="${opts.locale}"`)
    .replace(/(\n?\s*)<\/head>/i, `\n    ${headBlock(opts)}$1</head>`)
    .replace(/<div id="root">\s*<\/div>/i, snippet);
}

async function emit(locale, path, opts) {
  const html = renderRoute(template, { locale, path, ...opts });
  const dir = outDir(locale, path);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "index.html"), html, "utf-8");
  return localeUrl(locale, path);
}

const rawTemplate = await readFile(join(DIST, "index.html"), "utf-8");
const template = stripManagedHead(rawTemplate);

const written = [];
for (const locale of LOCALES) {
  written.push(
    await emit(locale, "/", {
      title: HOME_TITLE[locale],
      heading: "HeyScenes",
      description: DEFAULT_DESCRIPTION,
      image: DEFAULT_IMAGE,
      isOgPreview: true,
    }),
  );
  written.push(
    await emit(locale, "/create", {
      title: CREATE_TITLE[locale],
      heading: CREATE_TITLE[locale].split(" · ")[0],
      description: DEFAULT_DESCRIPTION,
      image: DEFAULT_IMAGE,
      isOgPreview: true,
    }),
  );
  for (const scene of scenes) {
    const title = scene.title[locale] ?? scene.title.en;
    const logline = scene.logline[locale] ?? scene.logline.en;
    written.push(
      await emit(locale, `/scene/${scene.slug}`, {
        title: `${title} · HeyScenes`,
        heading: title,
        description: logline,
        image: scene.image ? `${imageBase}/${scene.image}` : DEFAULT_IMAGE,
        isOgPreview: !scene.image,
      }),
    );
  }
}

console.log(`prerendered ${written.length} routes:`);
for (const u of written) console.log("  ", u);
