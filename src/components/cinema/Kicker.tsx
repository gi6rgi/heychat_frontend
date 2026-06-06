import { cn } from "@/lib/utils";

/**
 * Small-caps Archivo label — kickers like `SCENE 02 — DATING`, `RAPPORT`,
 * `DEBRIEF`. Wide tracking, 11–13px. Never serif, never sentence case.
 */
export function Kicker({
  children,
  className,
  as: Tag = "span",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3";
}) {
  return (
    <Tag
      className={cn(
        "font-label text-[13px] font-medium uppercase tracking-[0.14em] text-paper-dim",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
