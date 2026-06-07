import { Outlet } from "react-router-dom";
import { Grain } from "@/components/cinema";
import { AutoLocaleRedirect } from "@/i18n";

/**
 * The cinema shell. Just the dark auditorium and the grain — every screen owns
 * its own chrome (top bars, back links), so there is no global nav header.
 */
export function AppLayout() {
  return (
    <div className="relative min-h-screen bg-night text-paper">
      {/* Bare root `/` only: saved choice → browser language → English. */}
      <AutoLocaleRedirect />
      <Grain />
      <Outlet />
    </div>
  );
}
