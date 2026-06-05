import { Outlet } from "react-router-dom";
import { Grain } from "@/components/cinema";

/**
 * The cinema shell. Just the dark auditorium and the grain — every screen owns
 * its own chrome (top bars, back links), so there is no global nav header.
 */
export function AppLayout() {
  return (
    <div className="relative min-h-screen bg-night text-paper">
      <Grain />
      <Outlet />
    </div>
  );
}
