import { useEffect, useState } from "react"
import { useCountUp } from "@/hooks/useCountUp"

export interface PhaseResult {
  name: string
  passed: boolean
  feedback: string
  fragmento?: string
  queDebioDecir?: string
}

export interface ObjecionResult {
  objecion: string
  respuestaDada: string
  queDebioDecir: string
}

export interface AnalysisResult {
  score: number
  duration: string
  summary: string
  resultado?: string
  pasoAVideollamada?: boolean
  phases: PhaseResult[]
  objeciones?: ObjecionResult[]
  strengths: string[]
  weaknesses: string[]
  objections?: { type: string; handled: boolean }[]
}

interface AnalysisReportProps {
  result: AnalysisResult
  fileName: string
  onReset: () => void
}

// hue: 0 (red) → 45 (yellow) → 120 (green)
function scoreHue(s: number) { return s <= 50 ? s * 0.9 : 45 + (s - 50) * 1.5 }

const GLASS = {
  background: "rgba(255, 255, 255, 0.03)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(139, 92, 246, 0.18)",
  borderRadius: "16px",
} as const

const RESULTADO_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CERRADA:               { label: "Cerrada",               color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.3)"  },
  VIDEOLLAMADA_AGENDADA: { label: "Videollamada agendada", color: "#818cf8", bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)"  },
  EN_PROCESO:            { label: "En proceso",            color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)"  },
  PERDIDA:               { label: "Perdida",               color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
}

function ResultadoBadge({ resultado }: { resultado: string }) {
  const s = RESULTADO_STYLES[resultado] ?? RESULTADO_STYLES["EN_PROCESO"]
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {s.label}
    </span>
  )
}

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div className="animate-fade-slide-up" style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}>
      {children}
    </div>
  )
}

function AnimatedPhaseBar({ passed, delay }: { passed: boolean; delay: number }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(100), delay); return () => clearTimeout(t) }, [delay])
  const color = passed ? "#34d399" : "#f87171"
  return (
    <div style={{ height: 3, width: 56, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${w}%`, borderRadius: 999,
        background: color,
        boxShadow: `0 0 8px ${color}88`,
        transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  )
}

function ScoreCard({ score, summary }: { score: number; summary: string }) {
  const displayed = useCountUp(score, 1300)
  const hue = scoreHue(score)
  const scoreColor = `hsl(${hue}, 85%, 65%)`
  const glowColor = `hsl(${hue}, 80%, 50%)`

  return (
    <div
      className="p-6 text-center"
      style={{
        ...GLASS,
        background: `radial-gradient(ellipse 70% 60% at 50% 50%, rgba(139,92,246,0.12) 0%, rgba(255,255,255,0.02) 100%)`,
        boxShadow: `0 0 60px rgba(139,92,246,0.30), 0 0 120px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.07)`,
        border: "1px solid rgba(139, 92, 246, 0.30)",
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(237,233,254,0.5)" }}>
        Score general
      </p>
      <p
        className="font-black tabular-nums leading-none"
        style={{
          fontSize: 96,
          color: scoreColor,
          textShadow: `0 0 40px ${glowColor}80, 0 0 80px ${glowColor}40`,
          lineHeight: 1,
        }}
      >
        {displayed}
      </p>
      <p className="text-xs mt-1 mb-4" style={{ color: "rgba(237,233,254,0.35)" }}>/ 100</p>
      <div className="gradient-sep" />
      <p className="text-sm mt-4 max-w-sm mx-auto leading-relaxed" style={{ color: "rgba(237,233,254,0.65)" }}>
        {summary}
      </p>
    </div>
  )
}

export function AnalysisReport({ result, fileName, onReset }: AnalysisReportProps) {
  return (
    <div className="space-y-5">

      {/* Header */}
      <Section delay={0}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h2 className="text-xl font-black" style={{ color: "#ede9fe" }}>Resultado del análisis</h2>
            <p className="text-sm" style={{ color: "rgba(237,233,254,0.42)" }}>
              {fileName} · {result.duration}
            </p>
            {result.resultado && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <ResultadoBadge resultado={result.resultado} />
                {result.pasoAVideollamada && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8" }}>
                    ✓ Pasó a videollamada
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onReset}
            className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
            style={{
              background: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.25)",
              color: "#c4b5fd",
            }}
          >
            Analizar otra llamada
          </button>
        </div>
      </Section>

      {/* Score */}
      <Section delay={80}><ScoreCard score={result.score} summary={result.summary} /></Section>

      {/* Phases */}
      <Section delay={180}>
        <div className="p-5 space-y-4" style={GLASS}>
          <p className="font-bold text-sm" style={{ color: "#ede9fe" }}>Las 7 fases del script IUL</p>
          <div className="gradient-sep" />
          <div className="space-y-4">
            {result.phases.map((phase, i) => (
              <div key={phase.name} className="flex items-start gap-3">
                <span
                  className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold mt-0.5"
                  style={{
                    background: phase.passed ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
                    color: phase.passed ? "#34d399" : "#f87171",
                    border: `1px solid ${phase.passed ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
                  }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold" style={{ color: "#ede9fe" }}>{phase.name}</p>
                    <AnimatedPhaseBar passed={phase.passed} delay={250 + i * 80} />
                  </div>
                  <p className="text-xs" style={{ color: "rgba(237,233,254,0.42)" }}>{phase.feedback}</p>
                  {phase.queDebioDecir && (
                    <div className="mt-1.5 rounded-lg px-3 py-2" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: "#fbbf24" }}>Debiste decir:</p>
                      <p className="text-xs italic" style={{ color: "rgba(251,191,36,0.85)" }}>"{phase.queDebioDecir}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Strengths & Weaknesses */}
      <Section delay={280}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: "Fortalezas", items: result.strengths, color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.18)", symbol: "+" },
            { title: "A mejorar", items: result.weaknesses, color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.18)", symbol: "−" },
          ].map(({ title, items, color, bg, border, symbol }) => (
            <div
              key={title}
              className="p-5 space-y-3 transition-all duration-200"
              style={{
                background: bg,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: `1px solid ${border}`,
                borderRadius: 16,
              }}
            >
              <p className="font-bold text-sm" style={{ color }}>{title}</p>
              <div className="gradient-sep" style={{ background: `linear-gradient(to right, transparent, ${color}55, transparent)` }} />
              <ul className="space-y-2">
                {items.map((s) => (
                  <li key={s} className="text-sm flex items-start gap-2" style={{ color: "rgba(237,233,254,0.72)" }}>
                    <span className="shrink-0 mt-0.5 font-bold" style={{ color }}>{symbol}</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Objeciones detectadas */}
      {result.objeciones && result.objeciones.length > 0 && (
        <Section delay={360}>
          <div className="p-5 space-y-4" style={GLASS}>
            <p className="font-bold text-sm" style={{ color: "#ede9fe" }}>Objeciones detectadas</p>
            <div className="gradient-sep" />
            <div className="space-y-4">
              {result.objeciones.map((obj, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-xs font-semibold" style={{ color: "#f87171" }}>
                    "{obj.objecion}"
                  </p>
                  <div className="pl-3 border-l-2 space-y-1.5" style={{ borderColor: "rgba(139,92,246,0.3)" }}>
                    <div>
                      <p className="text-xs font-medium" style={{ color: "rgba(237,233,254,0.45)" }}>Lo que dijiste:</p>
                      <p className="text-xs" style={{ color: "rgba(237,233,254,0.65)" }}>{obj.respuestaDada}</p>
                    </div>
                    <div className="rounded-lg px-3 py-2" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: "#fbbf24" }}>Debiste decir:</p>
                      <p className="text-xs italic" style={{ color: "rgba(251,191,36,0.85)" }}>"{obj.queDebioDecir}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

    </div>
  )
}
