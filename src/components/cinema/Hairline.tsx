import { cn } from "@/lib/utils";

/** 1px cream hairline at ~22% — the only structural divider in the design. */
export function Hairline({
  className,
  vertical = false,
}: {
  className?: string;
  vertical?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "bg-hairline shrink-0",
        vertical ? "w-px self-stretch" : "h-px w-full",
        className,
      )}
    />
  );
}
