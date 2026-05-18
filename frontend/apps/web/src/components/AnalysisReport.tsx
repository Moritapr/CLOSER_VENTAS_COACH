import { useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { useCountUp } from "@/hooks/useCountUp"

export interface PhaseResult {
  name: string
  passed: boolean
  feedback: string
}

export interface AnalysisResult {
  score: number
  duration: string
  phases: PhaseResult[]
  strengths: string[]
  weaknesses: string[]
  objections: { type: string; handled: boolean }[]
  summary: string
}

interface AnalysisReportProps {
  result: AnalysisResult
  fileName: string
  onReset: () => void
}

function scoreHue(score: number) {
  // 0→0 (red), 50→45 (yellow), 100→120 (green)
  return score <= 50 ? score * 0.9 : 45 + (score - 50) * 1.5
}

function ScoreGradient({ score, summary }: { score: number; summary: string }) {
  const displayed = useCountUp(score, 1200)
  const hue = scoreHue(score)
  const color = `hsl(${hue}, 72%, 40%)`
  const bgFrom = `hsl(${hue}, 80%, 97%)`
  const borderColor = `hsl(${hue}, 60%, 82%)`

  return (
    <div
      className="rounded-xl border p-6 text-center"
      style={{ background: `linear-gradient(145deg, ${bgFrom}, white)`, borderColor }}
    >
      <p className="text-sm font-medium text-muted-foreground mb-1">Score general</p>
      <p className="text-7xl font-bold tabular-nums" style={{ color }}>
        {displayed}
      </p>
      <p className="text-sm text-muted-foreground mt-1">/ 100</p>
      <p className="text-sm mt-3 max-w-md mx-auto text-foreground/70">{summary}</p>
    </div>
  )
}

function AnimatedPhaseBar({ passed, delay }: { passed: boolean; delay: number }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(100), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${width}%`,
          backgroundColor: passed ? "#16a34a" : "#dc2626",
        }}
      />
    </div>
  )
}

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div
      className="animate-fade-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {children}
    </div>
  )
}

export function AnalysisReport({ result, fileName, onReset }: AnalysisReportProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Section delay={0}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold">Resultado del análisis</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{fileName} · {result.duration}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onReset}>
            Analizar otra llamada
          </Button>
        </div>
      </Section>

      {/* Score */}
      <Section delay={80}>
        <ScoreGradient score={result.score} summary={result.summary} />
      </Section>

      {/* Phases */}
      <Section delay={180}>
        <div className="rounded-xl border p-5 space-y-4">
          <h3 className="font-semibold">Las 7 fases del script IUL</h3>
          <div className="space-y-3">
            {result.phases.map((phase, i) => (
              <div key={phase.name} className="flex items-start gap-3">
                <span className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium mt-0.5
                  ${phase.passed
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  }`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{phase.name}</p>
                    <AnimatedPhaseBar passed={phase.passed} delay={200 + i * 80} />
                  </div>
                  <p className="text-xs text-muted-foreground">{phase.feedback}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Strengths & Weaknesses */}
      <Section delay={300}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border p-5 space-y-2 hover:border-green-300 dark:hover:border-green-700 transition-colors">
            <h3 className="font-semibold text-green-700 dark:text-green-400">Fortalezas</h3>
            <ul className="space-y-1.5">
              {result.strengths.map((s) => (
                <li key={s} className="text-sm flex items-start gap-2">
                  <span className="text-green-500 shrink-0 mt-0.5">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border p-5 space-y-2 hover:border-red-300 dark:hover:border-red-700 transition-colors">
            <h3 className="font-semibold text-red-700 dark:text-red-400">A mejorar</h3>
            <ul className="space-y-1.5">
              {result.weaknesses.map((w) => (
                <li key={w} className="text-sm flex items-start gap-2">
                  <span className="text-red-500 shrink-0 mt-0.5">−</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Objections */}
      <Section delay={400}>
        <div className="rounded-xl border p-5 space-y-3">
          <h3 className="font-semibold">Objeciones detectadas</h3>
          <div className="flex flex-wrap gap-2">
            {result.objections.map((obj) => (
              <span key={obj.type} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border
                transition-transform hover:scale-105 cursor-default
                ${obj.handled
                  ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300"
                  : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300"
                }`}>
                <span>{obj.handled ? "✓" : "✗"}</span>
                {obj.type}
              </span>
            ))}
          </div>
        </div>
      </Section>
    </div>
  )
}

