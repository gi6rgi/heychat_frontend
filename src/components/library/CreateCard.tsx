import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useLocalePath, useT } from "@/i18n";

/**
 * The final cell on the poster wall: not an image, an empty frame that invites
 * the user into the creation flow. Same 2:3 footprint as a poster. Hover
 * brightens the hairline to amber. Links to /create.
 */
export function CreateCard() {
  const t = useT();
  const lp = useLocalePath();
  return (
    <Link
      to={lp("/create")}
      className="group block aspect-[2/3] border border-hairline transition-colors duration-300 ease-[var(--ease-cinema)] hover:border-amber"
    >
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <Plus
          aria-hidden
          className="h-7 w-7 text-amber"
          strokeWidth={1.25}
        />
        <span className="px-4 text-center font-label text-[13px] font-medium uppercase tracking-[0.16em] text-amber">
          {t.library.createYourOwn}
        </span>
      </div>
    </Link>
  );
}
