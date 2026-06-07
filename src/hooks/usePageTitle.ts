import { useEffect } from "react";

/** The static tab title from index.html, restored on pages with no override. */
const DEFAULT_TITLE = "HeyScenes · step into a scene with your AI companion";

/**
 * Browser tab title per page, set verbatim: "Lena · Live". Pass undefined
 * (data still loading, or no override) to show the default brand title.
 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title || DEFAULT_TITLE;
  }, [title]);
}
