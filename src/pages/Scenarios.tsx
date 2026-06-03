import { useScenarios } from '@/hooks/useScenarios'
import { ScenarioCard } from '@/components/ScenarioCard'

export default function Scenarios() {
  const { data: scenarios, isLoading, isError } = useScenarios()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Practice <span className="text-brand-light">conversations</span> out loud
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Pick a scenario and talk to an AI partner with your voice. A safe space
          to rehearse and build confidence.
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-white/[0.06] bg-card/50" />
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
    </div>
  )
}
