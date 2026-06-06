import { motion } from 'motion/react'
import { ArrowRight, CheckCircle2, ChevronDown, Quote, Sparkles, TriangleAlert } from 'lucide-react'
import type { AdviceItem, FeedbackReport, MetricScore } from '@/types/api'
import { cn } from '@/lib/utils'

// --- score → color / label helpers ---------------------------------------

function barColor(score: number): string {
  if (score < 4) return 'bg-destructive'
  if (score < 7) return 'bg-brand'
  return 'bg-emerald-500'
}

function chipColor(score: number): string {
  if (score < 4) return 'bg-destructive/15 text-destructive'
  if (score < 7) return 'bg-brand/15 text-brand-light'
  return 'bg-emerald-500/15 text-emerald-400'
}

type Band = { label: string; ring: string; text: string }

function band(score: number): Band {
  if (score < 4) return { label: 'Needs work', ring: 'text-destructive', text: 'text-destructive' }
  if (score < 7) return { label: 'Getting there', ring: 'text-brand', text: 'text-brand-light' }
  if (score < 9) return { label: 'Solid', ring: 'text-emerald-500', text: 'text-emerald-400' }
  return { label: 'Strong', ring: 'text-emerald-500', text: 'text-emerald-400' }
}

// --- circular score gauge --------------------------------------------------

function ScoreRing({ score }: { score: number }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const { ring } = band(score)
  return (
    <div className="relative size-20 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-white/[0.08]" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          className={cn('stroke-current', ring)}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - score / 10) }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold leading-none">{score}</span>
        <span className="text-[10px] text-muted-foreground">/ 10</span>
      </div>
    </div>
  )
}

// --- improvement delta vs a previous attempt ------------------------------

function DeltaBadge({ diff, suffix = '' }: { diff: number; suffix?: string }) {
  if (diff === 0) {
    return <span className="text-xs font-medium text-muted-foreground">±0{suffix}</span>
  }
  const up = diff > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums',
        up ? 'text-emerald-400' : 'text-destructive',
      )}
    >
      {up ? '▲' : '▼'}
      {up ? '+' : ''}
      {diff}
      {suffix}
    </span>
  )
}

// --- one metric row (expandable explanation) ------------------------------

function MetricRow({ metric, prevScore }: { metric: MetricScore; prevScore?: number }) {
  return (
    <details className="group rounded-lg border border-white/[0.06] bg-white/[0.02] open:bg-white/[0.04]">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
        <span className="flex-1 truncate text-sm font-medium">{metric.name}</span>
        {prevScore != null && <DeltaBadge diff={metric.score - prevScore} />}
        <span
          className={cn(
            'rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums',
            chipColor(metric.score),
          )}
        >
          {metric.score}
        </span>
        <ChevronDown
          size={14}
          className="text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="px-3 pb-3">
        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={cn('h-full rounded-full', barColor(metric.score))}
            style={{ width: `${(metric.score / 10) * 100}%` }}
          />
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{metric.explanation}</p>
      </div>
    </details>
  )
}

function MetricColumn({
  title,
  icon,
  accent,
  metrics,
  prevByName,
  emptyText,
}: {
  title: string
  icon: React.ReactNode
  accent: string
  metrics: MetricScore[]
  prevByName: Map<string, number>
  emptyText: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3
        className={cn(
          'flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide',
          accent,
        )}
      >
        {icon}
        {title}
      </h3>
      {metrics.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground/70">{emptyText}</p>
      ) : (
        metrics.map((m) => <MetricRow key={m.name} metric={m} prevScore={prevByName.get(m.name)} />)
      )}
    </div>
  )
}

// --- advice card -----------------------------------------------------------

function AdviceCard({ item, index }: { item: AdviceItem; index: number }) {
  return (
    <li className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/20 text-[11px] font-semibold text-brand-light">
        {index + 1}
      </span>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm leading-relaxed">{item.text}</p>
        {item.quote && (
          <p className="flex gap-1.5 rounded-md bg-white/[0.03] px-2.5 py-1.5 text-xs italic leading-relaxed text-muted-foreground">
            <Quote size={12} className="mt-0.5 shrink-0 opacity-60" />
            <span>“{item.quote}”</span>
          </p>
        )}
      </div>
    </li>
  )
}

// --- panel -----------------------------------------------------------------

export function FeedbackPanel({
  report,
  previous,
}: {
  report: FeedbackReport
  previous?: FeedbackReport
}) {
  const b = band(report.overall_score)
  const strengths = report.metrics
    .filter((m) => m.kind === 'strength')
    .sort((a, b) => b.score - a.score)
  const focus = report.metrics
    .filter((m) => m.kind === 'improvement')
    .sort((a, b) => a.score - b.score)
  const prevByName = new Map((previous?.metrics ?? []).map((m) => [m.name, m.score]))

  const examples = report.example_answers ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Model answers — concrete examples to use in the next attempt. */}
      {examples.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-brand/25 bg-brand/[0.07] p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-light">
            <Sparkles size={16} /> Model answers to use next time
          </h3>
          <div className="flex flex-col gap-2.5">
            {examples.map((ex, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                <p className="text-sm font-semibold">{ex.question}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{ex.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero: score + verdict */}
      <div className="flex items-center gap-5 rounded-2xl border border-white/[0.08] bg-card/60 p-5">
        <ScoreRing score={report.overall_score} />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-semibold uppercase tracking-wide', b.text)}>
              {b.label}
            </span>
            {previous && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <DeltaBadge diff={report.overall_score - previous.overall_score} suffix=" vs last" />
              </>
            )}
          </div>
          <h2 className="text-lg font-bold leading-snug">{report.headline}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{report.summary}</p>
        </div>
      </div>

      {/* Strengths / Focus areas */}
      {report.metrics.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          <MetricColumn
            title="Strengths"
            icon={<CheckCircle2 size={14} />}
            accent="text-emerald-400"
            metrics={strengths}
            prevByName={prevByName}
            emptyText="No clear strengths this time. Focus on the areas at right."
          />
          <MetricColumn
            title="Focus areas"
            icon={<TriangleAlert size={14} />}
            accent="text-brand-light"
            metrics={focus}
            prevByName={prevByName}
            emptyText="Nothing major to fix. Nice work."
          />
        </div>
      )}

      {/* Next steps */}
      {report.advice.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ArrowRight size={16} className="text-brand-light" /> Next steps
          </h3>
          <ul className="flex flex-col gap-2">
            {report.advice.map((item, i) => (
              <AdviceCard key={i} item={item} index={i} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
