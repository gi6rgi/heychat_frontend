import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * THE primary action treatment — amber small-caps text with a 1px underline and
 * a trailing arrow. There are no filled pill buttons in this design; this is how
 * every "do it" affordance reads: `START SCENE →`, `RETRY SCENE →`, `UNLOCK`.
 *
 * Renders as a router <Link> when `to` is given, else a <button>. `tone="dim"`
 * is for secondary actions (paper, not amber); `arrow={false}` drops the →.
 */
type Common = {
  children: React.ReactNode;
  className?: string;
  arrow?: boolean;
  tone?: "amber" | "dim";
  size?: "md" | "lg";
};

function inner(children: React.ReactNode, arrow: boolean) {
  return (
    <>
      <span className="border-b border-current pb-1">{children}</span>
      {arrow && <span aria-hidden className="pb-1 not-italic">→</span>}
    </>
  );
}

function classes({ tone = "amber", size = "md", className }: Common) {
  return cn(
    "group inline-flex items-center gap-2.5 font-label font-medium uppercase",
    "tracking-[0.16em] transition-colors duration-300 ease-[var(--ease-cinema)]",
    size === "lg" ? "text-[16px]" : "text-[13.5px]",
    tone === "amber"
      ? "text-amber hover:text-paper"
      : "text-paper-dim hover:text-paper",
    className,
  );
}

export function AmberAction(
  props: Common &
    (
      | ({ to: string } & Omit<React.ComponentProps<typeof Link>, "to" | "className">)
      | ({ to?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
    ),
) {
  const { children, className, arrow = true, tone, size, ...rest } = props;
  const cls = classes({ children, className, tone, size });
  if ("to" in rest && rest.to) {
    const { to, ...linkRest } = rest as { to: string };
    return (
      <Link to={to} className={cls} {...linkRest}>
        {inner(children, arrow)}
      </Link>
    );
  }
  return (
    <button className={cls} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {inner(children, arrow)}
    </button>
  );
}
