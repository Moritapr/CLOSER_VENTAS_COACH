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

export type FriccionTipo = "incomodidad" | "desconfianza" | "desinteres" | "perdida_control"

export interface FriccionMomento {
  fragmento: string
  tipo: FriccionTipo
  explicacion: string
  queHacer: string
}

export type NivelEnergia = "alta" | "media" | "baja"

export interface EnergiaCloser {
  inicio: NivelEnergia
  medio: NivelEnergia
  final: NivelEnergia
  observacion: string
}

export type NivelTermometro = "interesado" | "neutral" | "frio" | "hostil"

export interface TermometroCliente {
  inicio: NivelTermometro
  medio: NivelTermometro
  final: NivelTermometro
  observacion: string
}

export interface EvaluacionDominio {
  cliente_domino?: boolean
  objecion_mal_resuelta?: boolean
  genero_mas_dudas?: boolean
  perdio_control_tema?: boolean
  piloto_automatico?: boolean
  explico_confuso?: boolean
  no_confirmo_compromiso?: boolean
}

export interface AnalysisResult {
  score: number
  duration: string
  summary: string
  resultado?: string
  pasoAVideollamada?: boolean
  phases: PhaseResult[]
  objeciones?: ObjecionResult[]
  mapaFriccion?: FriccionMomento[]
  energiaCloser?: EnergiaCloser
  termometroCliente?: TermometroCliente
  evaluacionDominio?: EvaluacionDominio
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

const DOMINIO_PENALTIES: { key: keyof EvaluacionDominio; label: string; weight: number }[] = [
  { key: "cliente_domino",          label: "El cliente dominó la conversación",              weight: 30 },
  { key: "objecion_mal_resuelta",   label: "Una objeción importante quedó mal resuelta",      weight: 20 },
  { key: "genero_mas_dudas",        label: "Generaste más dudas en vez de aclarar",           weight: 20 },
  { key: "perdio_control_tema",     label: "Perdiste el control del tema ante las objeciones", weight: 15 },
  { key: "piloto_automatico",       label: "Respondiste en piloto automático",                weight: 10 },
  { key: "explico_confuso",         label: "Explicaste de forma confusa o muy técnica",        weight: 10 },
  { key: "no_confirmo_compromiso",  label: "Avanzaste sin confirmar el compromiso",           weight: 10 },
]

const FRICCION_TIPO_STYLES: Record<FriccionTipo, { label: string; color: string; bg: string; border: string }> = {
  incomodidad:     { label: "Incomodidad",        color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)"  },
  desconfianza:    { label: "Desconfianza",       color: "#fb923c", bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.3)"  },
  desinteres:      { label: "Desinterés",         color: "#818cf8", bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)"  },
  perdida_control: { label: "Pérdida de control", color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
}

const ENERGIA_STYLES: Record<NivelEnergia, { label: string; color: string }> = {
  alta:  { label: "Alta",  color: "#34d399" },
  media: { label: "Media", color: "#fbbf24" },
  baja:  { label: "Baja",  color: "#f87171" },
}

const TERMOMETRO_STYLES: Record<NivelTermometro, { label: string; color: string }> = {
  interesado: { label: "Interesado", color: "#34d399" },
  neutral:    { label: "Neutral",    color: "#fbbf24" },
  frio:       { label: "Frío",       color: "#818cf8" },
  hostil:     { label: "Hostil",     color: "#f87171" },
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

function EvolutionTrack<T extends string>({
  levels, styles,
}: {
  levels: [T, T, T]
  styles: Record<T, { label: string; color: string }>
}) {
  const stepNames = ["Inicio", "Medio", "Final"]
  return (
    <div className="flex items-start">
      {levels.map((level, i) => {
        const color = styles[level]?.color ?? "#818cf8"
        return (
          <div key={i} className="flex items-start" style={{ flex: i < levels.length - 1 ? 1 : "0 0 auto" }}>
            <div className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: 68 }}>
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(237,233,254,0.35)" }}>
                {stepNames[i]}
              </span>
              <div
                className="h-3.5 w-3.5 rounded-full shrink-0"
                style={{ background: color, boxShadow: `0 0 10px ${color}99`, border: "2px solid rgba(255,255,255,0.15)" }}
              />
              <span className="text-xs font-bold text-center" style={{ color }}>{styles[level]?.label ?? level}</span>
            </div>
            {i < levels.length - 1 && (
              <div
                className="h-px flex-1 mt-[23px]"
                style={{ background: `linear-gradient(to right, ${color}, ${styles[levels[i + 1]]?.color ?? "#818cf8"})` }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function EvolutionCard<T extends string>({
  title, levels, styles, observacion,
}: {
  title: string
  levels: [T, T, T]
  styles: Record<T, { label: string; color: string }>
  observacion: string
}) {
  return (
    <div className="p-5 space-y-4" style={GLASS}>
      <p className="font-bold text-sm" style={{ color: "#ede9fe" }}>{title}</p>
      <div className="gradient-sep" />
      <EvolutionTrack levels={levels} styles={styles} />
      <p className="text-xs leading-relaxed" style={{ color: "rgba(237,233,254,0.55)" }}>{observacion}</p>
    </div>
  )
}

function ScoreBreakdown({ evaluacionDominio }: { evaluacionDominio: EvaluacionDominio }) {
  const applied = DOMINIO_PENALTIES.filter((p) => evaluacionDominio[p.key])

  if (applied.length === 0) {
    return (
      <div
        className="mt-1 mb-4 max-w-sm mx-auto text-xs text-center rounded-lg px-3 py-2"
        style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.18)", color: "#34d399" }}
      >
        Sin errores graves detectados
      </div>
    )
  }

  return (
    <div className="mt-1 mb-4 max-w-sm mx-auto text-left space-y-1.5">
      {applied.map((p) => (
        <div
          key={p.key}
          className="flex items-center justify-between gap-3 text-xs rounded-lg px-3 py-1.5"
          style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)" }}
        >
          <span style={{ color: "rgba(237,233,254,0.65)" }}>{p.label}</span>
          <span className="font-bold shrink-0" style={{ color: "#f87171" }}>−{p.weight}</span>
        </div>
      ))}
    </div>
  )
}

function ScoreCard({ score, summary, evaluacionDominio }: { score: number; summary: string; evaluacionDominio?: EvaluacionDominio }) {
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
      <p className="text-xs mt-1 mb-1" style={{ color: "rgba(237,233,254,0.35)" }}>/ 100</p>
      {evaluacionDominio && <ScoreBreakdown evaluacionDominio={evaluacionDominio} />}
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
      <Section delay={80}>
        <ScoreCard score={result.score} summary={result.summary} evaluacionDominio={result.evaluacionDominio} />
      </Section>

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

      {/* Mapa de fricción */}
      {result.mapaFriccion && result.mapaFriccion.length > 0 && (
        <Section delay={440}>
          <div className="p-5 space-y-4" style={GLASS}>
            <p className="font-bold text-sm" style={{ color: "#ede9fe" }}>Mapa de fricción</p>
            <div className="gradient-sep" />
            <div className="space-y-4">
              {result.mapaFriccion.map((momento, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-xs font-semibold flex-1 min-w-[140px]" style={{ color: "rgba(237,233,254,0.85)" }}>
                      "{momento.fragmento}"
                    </p>
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold shrink-0"
                      style={{
                        background: FRICCION_TIPO_STYLES[momento.tipo]?.bg,
                        border: `1px solid ${FRICCION_TIPO_STYLES[momento.tipo]?.border}`,
                        color: FRICCION_TIPO_STYLES[momento.tipo]?.color,
                      }}
                    >
                      {FRICCION_TIPO_STYLES[momento.tipo]?.label ?? momento.tipo}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "rgba(237,233,254,0.55)" }}>{momento.explicacion}</p>
                  <div className="rounded-lg px-3 py-2" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: "#fbbf24" }}>Qué hacer:</p>
                    <p className="text-xs italic" style={{ color: "rgba(251,191,36,0.85)" }}>"{momento.queHacer}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Energía del closer + Termómetro del cliente */}
      {(result.energiaCloser || result.termometroCliente) && (
        <Section delay={520}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.energiaCloser && (
              <EvolutionCard
                title="Energía del closer"
                levels={[result.energiaCloser.inicio, result.energiaCloser.medio, result.energiaCloser.final]}
                styles={ENERGIA_STYLES}
                observacion={result.energiaCloser.observacion}
              />
            )}
            {result.termometroCliente && (
              <EvolutionCard
                title="Termómetro del cliente"
                levels={[result.termometroCliente.inicio, result.termometroCliente.medio, result.termometroCliente.final]}
                styles={TERMOMETRO_STYLES}
                observacion={result.termometroCliente.observacion}
              />
            )}
          </div>
        </Section>
      )}

    </div>
  )
}
