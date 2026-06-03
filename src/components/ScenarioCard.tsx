import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { Scenario } from '@/types/api'
import { cn } from '@/lib/utils'

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

const DIFFICULTY_CLASS: Record<string, string> = {
  easy: 'bg-emerald-500/15 text-emerald-400',
  medium: 'bg-brand/15 text-brand-light',
  hard: 'bg-destructive/15 text-destructive',
}

export function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const navigate = useNavigate()

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
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            DIFFICULTY_CLASS[scenario.difficulty] ?? DIFFICULTY_CLASS.medium,
          )}
        >
          {DIFFICULTY_LABEL[scenario.difficulty] ?? scenario.difficulty}
        </span>
        <ArrowRight
          size={18}
          className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand-light"
        />
      </div>
      <h3 className="text-lg font-semibold">{scenario.title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{scenario.description}</p>
    </motion.button>
  )
}
