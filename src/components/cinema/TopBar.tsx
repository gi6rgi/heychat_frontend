import { Container } from "./Container";
import { Hairline } from "./Hairline";
import { cn } from "@/lib/utils";

/**
 * The one top bar used across screens. Fixed 64px row inside the shared
 * Container with a hairline beneath, so the bar is the exact same height and
 * position on every page and never resizes as you navigate. Children are laid
 * out left to right with justify-between; pass an empty <span /> to hold a side.
 * `divider={false}` drops the hairline (for full-bleed scene screens).
 */
export function TopBar({
  children,
  divider = true,
  className,
}: {
  children: React.ReactNode;
  divider?: boolean;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 bg-night/70 backdrop-blur-md backdrop-saturate-150",
        className,
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-8">
          {children}
        </div>
      </Container>
      {divider && <Hairline />}
    </header>
  );
}
