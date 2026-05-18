import { Button } from "@workspace/ui/components/button"

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

const SCORE_COLOR = (score: number) => {
  if (score >= 80) return "text-green-600 dark:text-green-400"
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
  return "text-red-600 dark:text-red-400"
}

const SCORE_BG = (score: number) => {
  if (score >= 80) return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
  if (score >= 60) return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
  return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
}

export function AnalysisReport({ result, fileName, onReset }: AnalysisReportProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">Resultado del análisis</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{fileName} · {result.duration}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onReset}>
          Analizar otra llamada
        </Button>
      </div>

      {/* Score */}
      <div className={`rounded-xl border p-6 text-center ${SCORE_BG(result.score)}`}>
        <p className="text-sm font-medium text-muted-foreground mb-1">Score general</p>
        <p className={`text-6xl font-bold ${SCORE_COLOR(result.score)}`}>{result.score}</p>
        <p className="text-sm text-muted-foreground mt-1">/ 100</p>
        <p className="text-sm mt-3 max-w-md mx-auto">{result.summary}</p>
      </div>

      {/* Phases */}
      <div className="rounded-xl border p-5 space-y-3">
        <h3 className="font-semibold">Las 7 fases del script IUL</h3>
        <div className="space-y-2">
          {result.phases.map((phase, i) => (
            <div key={phase.name} className="flex items-start gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
                  ${phase.passed
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  }`}>
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{phase.name}</p>
                  <p className="text-xs text-muted-foreground">{phase.feedback}</p>
                </div>
              </div>
              <span className="shrink-0 text-lg">{phase.passed ? "✓" : "✗"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border p-5 space-y-2">
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
        <div className="rounded-xl border p-5 space-y-2">
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

      {/* Objections */}
      <div className="rounded-xl border p-5 space-y-3">
        <h3 className="font-semibold">Objeciones detectadas</h3>
        <div className="flex flex-wrap gap-2">
          {result.objections.map((obj) => (
            <span key={obj.type} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border
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
    </div>
  )
}
