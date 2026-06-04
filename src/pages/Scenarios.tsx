import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useScenarios } from "@/hooks/useScenarios";
import { ScenarioCard } from "@/components/ScenarioCard";
import { MatchFlowModal } from "@/components/match/MatchFlowModal";
import { Button } from "@/components/ui/button";

export default function Scenarios() {
  const { data: scenarios, isLoading, isError } = useScenarios();
  // The match flow greets the user on every visit to the catalog - it's the
  // primary entry point; "Browse characters" / Esc drops to the grid behind.
  const [matchOpen, setMatchOpen] = useState(true);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Step into a <span className="text-brand-light">scene</span> and say
            it out loud
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Pick a ready-made scene with a goal to chase - or create your own
            companion and the place you meet. Real voice, zero judgment.
          </p>
        </div>
        <Button
          size="lg"
          variant="outline"
          onClick={() => setMatchOpen(true)}
          disabled={!scenarios}
        >
          <Sparkles size={16} className="text-brand-light" />
          Find my match
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-white/[0.06] bg-card/50"
            />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          Failed to load scenarios. Make sure the backend is running.
        </p>
      )}

      {scenarios && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      )}

      <MatchFlowModal
        open={matchOpen}
        scenarios={scenarios ?? []}
        onClose={() => setMatchOpen(false)}
      />
    </div>
  );
}
