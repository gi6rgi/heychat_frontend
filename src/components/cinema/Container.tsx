import { cn } from "@/lib/utils";

/**
 * The single shared content width for every screen — keeps the left/right
 * gutters identical across the Library, Detail, Live, Debrief and Create pages
 * so the app reads as one piece. Full-bleed scene art sits behind this; only the
 * content (top bars, titles, grids, controls) is constrained to it.
 */
export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-6 md:px-10", className)}>
      {children}
    </div>
  );
}
