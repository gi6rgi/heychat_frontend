import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Target } from "lucide-react";
import type { Scenario } from "@/types/api";

export function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const navigate = useNavigate();
  const personal = scenario.user_id !== null;

  return (
    <motion.button
      type="button"
      onClick={() => navigate(`/session/${scenario.id}`)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
      className="group flex w-full flex-col gap-3 rounded-2xl border border-white/[0.08] bg-card/80 p-5 text-left transition-colors hover:border-brand/40"
    >
      <div className="flex items-center justify-between">
        {personal ? (
          <span className="flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-medium text-brand-light">
            <Sparkles size={11} />
            Made for you
          </span>
        ) : (
          <span />
        )}
        <ArrowRight
          size={18}
          className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand-light"
        />
      </div>
      <h3 className="text-lg font-semibold">{scenario.title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {scenario.description}
      </p>
      {scenario.goal && (
        <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full border border-brand/25 bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand-light">
          <Target size={12} />
          {scenario.goal}
        </span>
      )}
    </motion.button>
  );
}
