import { useState } from "react"
import { ChevronDown, Check, X } from "lucide-react"
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

// Mismo shape que EnergiaCloser — energia_closer medía tono de voz (no
// observable en texto) y se reemplazó por asertividad_closer, que mide
// comportamiento verbal concreto. Se mantiene EnergiaCloser para los
// análisis viejos que todavía la traen.
export type AsertividadCloser = EnergiaCloser

export type NivelTermometro = "interesado" | "neutral" | "frio" | "hostil"

export interface TermometroCliente {
  inicio: NivelTermometro
  medio: NivelTermometro
  final: NivelTermometro
  observacion: string
}

// Formato nuevo del backend: cada criterio es un objeto con evidencia citada.
export interface CriterioDominio {
  ocurrio: boolean
  evidencia?: string | null
}

// Formato viejo (análisis previos a que el backend exigiera evidencia):
// booleano suelto. Se acepta cualquiera de los dos por criterio.
type ValorCriterioDominio = boolean | CriterioDominio

export interface EvaluacionDominio {
  cliente_domino?: ValorCriterioDominio
  objecion_mal_resuelta?: ValorCriterioDominio
  genero_mas_dudas?: ValorCriterioDominio
  perdio_control_tema?: ValorCriterioDominio
  piloto_automatico?: ValorCriterioDominio
  explico_confuso?: ValorCriterioDominio
  no_confirmo_compromiso?: ValorCriterioDominio
}

function criterioOcurrio(valor: ValorCriterioDominio | undefined): boolean {
  if (typeof valor === "boolean") return valor
  if (valor && typeof valor === "object") return Boolean(valor.ocurrio)
  return false
}

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0
}

export interface AnalysisResult {
  score: number
  // Ausente en análisis guardados antes de este campo — se trata como true
  // para no romper el historial viejo.
  esLlamadaDeVentas?: boolean
  duration: string
  summary: string
  resultado?: string
  pasoAVideollamada?: boolean
  phases: PhaseResult[]
  objeciones?: ObjecionResult[]
  mapaFriccion?: FriccionMomento[]
  energiaCloser?: EnergiaCloser
  asertividadCloser?: AsertividadCloser
  termometroCliente?: TermometroCliente
  evaluacionDominio?: EvaluacionDominio
  promedioHistorico?: number | null
  diferenciaVsPromedio?: number | null
  totalLlamadasPrevias?: number | null
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

// Exportado para que ReportPreview.tsx (mockup decorativo del login) use
// exactamente el mismo estilo de card que el reporte real.
export const GLASS = {
  background: "rgba(255, 255, 255, 0.03)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(217, 119, 6, 0.18)",
  borderRadius: "16px",
} as const

const RESULTADO_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CERRADA:               { label: "Cerrada",               color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.3)"  },
  VIDEOLLAMADA_AGENDADA: { label: "Videollamada agendada", color: "#818cf8", bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)"  },
  EN_PROCESO:            { label: "En proceso",            color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)"  },
  PERDIDA:               { label: "Perdida",               color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
}

// Exportado para que Dashboard.tsx reuse el mismo mapeo de nombres legibles
// en "Tu patrón repetido" — una sola fuente de verdad para los labels.
export const DOMINIO_PENALTIES: { key: keyof EvaluacionDominio; label: string; weight: number }[] = [
  { key: "cliente_domino",          label: "El cliente dominó la conversación",              weight: 30 },
  { key: "objecion_mal_resuelta",   label: "Una objeción importante quedó mal resuelta",      weight: 20 },
  { key: "genero_mas_dudas",        label: "Generaste más dudas en vez de aclarar",           weight: 20 },
  { key: "perdio_control_tema",     label: "Perdiste el control del tema ante las objeciones", weight: 15 },
  { key: "piloto_automatico",       label: "Respondiste en piloto automático",                weight: 5 },
  { key: "explico_confuso",         label: "Explicaste de forma confusa o muy técnica",        weight: 5 },
  { key: "no_confirmo_compromiso",  label: "Avanzaste sin confirmar el compromiso",           weight: 5 },
]

export const FRICCION_TIPO_STYLES: Record<FriccionTipo, { label: string; color: string; bg: string; border: string }> = {
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

// Fase colapsable: por defecto solo se ve el título + indicador de si
// estuvo bien o mal. Las que fallaron empiezan expandidas (son las que
// importa leer); las que salieron bien quedan colapsadas para que el
// reporte se pueda escanear en segundos.
function PhaseAccordionItem({ phase, isLast }: { phase: PhaseResult; isLast: boolean }) {
  const [open, setOpen] = useState(!phase.passed)
  const hasDetail = hasText(phase.feedback) || hasText(phase.queDebioDecir)

  return (
    <div style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.06)" }}>
      <button
        type="button"
        onClick={() => hasDetail && setOpen((o) => !o)}
        className="w-full flex items-center gap-3 py-2.5 text-left"
        style={{ background: "transparent", border: "none", padding: "10px 0", cursor: hasDetail ? "pointer" : "default" }}
      >
        <span
          className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full"
          style={{
            background: phase.passed ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
            color: phase.passed ? "#34d399" : "#f87171",
            border: `1px solid ${phase.passed ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
          }}
        >
          {phase.passed ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}
        </span>
        <span className="flex-1 text-sm font-semibold" style={{ color: "#f5ede0" }}>{phase.name}</span>
        {hasDetail && (
          <ChevronDown
            size={16}
            style={{
              color: "rgba(245,237,224,0.35)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              flexShrink: 0,
            }}
          />
        )}
      </button>
      {hasDetail && (
        <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 0.25s ease" }}>
          <div style={{ overflow: "hidden" }}>
            <div className="pl-9 pb-3 space-y-1.5">
              {hasText(phase.feedback) && (
                <p className="text-xs" style={{ color: "rgba(245,237,224,0.42)" }}>{phase.feedback}</p>
              )}
              {hasText(phase.queDebioDecir) && (
                <div className="rounded-lg px-3 py-2" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "#fbbf24" }}>Debiste decir:</p>
                  <p className="text-xs italic" style={{ color: "rgba(251,191,36,0.85)" }}>"{phase.queDebioDecir}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(245,237,224,0.35)" }}>
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
      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(245,237,224,0.5)" }}>{title}</p>
      <div className="gradient-sep" />
      <EvolutionTrack levels={levels} styles={styles} />
      <p className="text-xs leading-relaxed" style={{ color: "rgba(245,237,224,0.5)" }}>{observacion}</p>
    </div>
  )
}

function ScoreBreakdown({ evaluacionDominio }: { evaluacionDominio: EvaluacionDominio }) {
  const applied = DOMINIO_PENALTIES.filter((p) => criterioOcurrio(evaluacionDominio[p.key]))

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
          <span style={{ color: "rgba(245,237,224,0.65)" }}>{p.label}</span>
          <span className="font-bold shrink-0" style={{ color: "#f87171" }}>−{p.weight}</span>
        </div>
      ))}
    </div>
  )
}

function ComparativaHistorica({ diferencia }: { diferencia: number }) {
  const arriba = diferencia >= 0
  const puntos = Math.round(Math.abs(diferencia))
  return (
    <p className="text-xs font-semibold mt-0.5" style={{ color: arriba ? "#34d399" : "#fbbf24" }}>
      {puntos} {puntos === 1 ? "punto" : "puntos"} {arriba ? "sobre" : "bajo"} tu promedio
    </p>
  )
}

function ScoreCard({
  score, summary, evaluacionDominio, diferenciaVsPromedio,
}: {
  score: number
  summary: string
  evaluacionDominio?: EvaluacionDominio
  diferenciaVsPromedio?: number | null
}) {
  const displayed = useCountUp(score, 1300)
  const hue = scoreHue(score)
  const scoreColor = `hsl(${hue}, 85%, 65%)`
  const glowColor = `hsl(${hue}, 80%, 50%)`

  return (
    <div
      className="p-8 text-center"
      style={{
        ...GLASS,
        background: `radial-gradient(ellipse 70% 60% at 50% 50%, rgba(217,119,6,0.12) 0%, rgba(255,255,255,0.02) 100%)`,
        boxShadow: `0 0 70px rgba(217,119,6,0.34), 0 0 140px rgba(217,119,6,0.14), inset 0 1px 0 rgba(255,255,255,0.07)`,
        border: "1px solid rgba(217, 119, 6, 0.34)",
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(245,237,224,0.5)" }}>
        Score general
      </p>
      <p
        className="font-black tabular-nums leading-none"
        style={{
          fontSize: 108,
          color: scoreColor,
          textShadow: `0 0 40px ${glowColor}80, 0 0 90px ${glowColor}50`,
          lineHeight: 1,
        }}
      >
        {displayed}
      </p>
      <p className="text-xs mt-1 mb-1" style={{ color: "rgba(245,237,224,0.35)" }}>/ 100</p>
      {typeof diferenciaVsPromedio === "number" && <ComparativaHistorica diferencia={diferenciaVsPromedio} />}
      {evaluacionDominio && <ScoreBreakdown evaluacionDominio={evaluacionDominio} />}
      <div className="gradient-sep" />
      <p className="text-sm mt-4 max-w-sm mx-auto leading-relaxed" style={{ color: "rgba(245,237,224,0.65)" }}>
        {summary}
      </p>
    </div>
  )
}

export function AnalysisReport({ result, fileName, onReset }: AnalysisReportProps) {
  if (result.esLlamadaDeVentas === false) {
    return (
      <div className="space-y-5">
        <Section delay={0}>
          <div className="p-8 text-center space-y-4" style={GLASS}>
            <p className="text-xs" style={{ color: "rgba(245,237,224,0.42)" }}>
              {fileName} · {result.duration}
            </p>
            <h2 className="text-lg font-black" style={{ color: "#f5ede0" }}>
              Esta grabación no parece una llamada de ventas
            </h2>
            <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: "rgba(245,237,224,0.6)" }}>
              {result.summary}
            </p>
            <button
              onClick={onReset}
              className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
              style={{
                background: "rgba(217,119,6,0.12)",
                border: "1px solid rgba(217,119,6,0.25)",
                color: "#fcd34d",
              }}
            >
              Subir otra grabación
            </button>
          </div>
        </Section>
      </div>
    )
  }

  return (
    <div className="space-y-7">

      {/* Header */}
      <Section delay={0}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h2 className="text-xl font-black" style={{ color: "#f5ede0" }}>Resultado del análisis</h2>
            <p className="text-sm" style={{ color: "rgba(245,237,224,0.42)" }}>
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
              background: "rgba(217,119,6,0.12)",
              border: "1px solid rgba(217,119,6,0.25)",
              color: "#fcd34d",
            }}
          >
            Analizar otra llamada
          </button>
        </div>
      </Section>

      {/* Score */}
      <Section delay={80}>
        <ScoreCard
          score={result.score}
          summary={result.summary}
          evaluacionDominio={result.evaluacionDominio}
          diferenciaVsPromedio={result.diferenciaVsPromedio}
        />
      </Section>

      {/* Phases — colapsables: las que fallaron vienen abiertas por defecto */}
      <Section delay={180}>
        <div className="p-5" style={GLASS}>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(245,237,224,0.5)" }}>
            Las 7 fases del script IUL
          </p>
          <div className="gradient-sep" style={{ margin: "12px 0" }} />
          <div>
            {result.phases.map((phase, i) => (
              <PhaseAccordionItem key={phase.name} phase={phase} isLast={i === result.phases.length - 1} />
            ))}
          </div>
        </div>
      </Section>

      {/* Strengths & Weaknesses */}
      <Section delay={280}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color }}>{title}</p>
              <div className="gradient-sep" style={{ background: `linear-gradient(to right, transparent, ${color}55, transparent)` }} />
              <ul className="space-y-2.5">
                {items.map((s) => (
                  <li key={s} className="text-sm flex items-start gap-2" style={{ color: "rgba(245,237,224,0.62)", fontWeight: 400 }}>
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
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(245,237,224,0.5)" }}>Objeciones detectadas</p>
            <div className="gradient-sep" />
            <div className="space-y-4">
              {result.objeciones.map((obj, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-xs font-semibold" style={{ color: "#f87171" }}>
                    "{obj.objecion}"
                  </p>
                  <div className="pl-3 border-l-2 space-y-1.5" style={{ borderColor: "rgba(217,119,6,0.3)" }}>
                    <div>
                      <p className="text-xs font-medium" style={{ color: "rgba(245,237,224,0.4)" }}>Lo que dijiste:</p>
                      <p className="text-xs" style={{ color: "rgba(245,237,224,0.58)" }}>{obj.respuestaDada}</p>
                    </div>
                    {hasText(obj.queDebioDecir) && (
                      <div className="rounded-lg px-3 py-2" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: "#fbbf24" }}>Debiste decir:</p>
                        <p className="text-xs italic" style={{ color: "rgba(251,191,36,0.85)" }}>"{obj.queDebioDecir}"</p>
                      </div>
                    )}
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
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(245,237,224,0.5)" }}>Mapa de fricción</p>
            <div className="gradient-sep" />
            <div className="space-y-4">
              {result.mapaFriccion.map((momento, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-xs font-semibold flex-1 min-w-[140px]" style={{ color: "rgba(245,237,224,0.8)" }}>
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
                  <p className="text-xs" style={{ color: "rgba(245,237,224,0.5)" }}>{momento.explicacion}</p>
                  {hasText(momento.queHacer) && (
                    <div className="rounded-lg px-3 py-2" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: "#fbbf24" }}>Qué hacer:</p>
                      <p className="text-xs italic" style={{ color: "rgba(251,191,36,0.85)" }}>"{momento.queHacer}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Asertividad del closer (o Energía, en análisis viejos) + Termómetro del cliente */}
      {(() => {
        // asertividad_closer reemplazó a energia_closer (que medía tono de voz,
        // no observable en una transcripción). Análisis viejos solo traen
        // energia_closer — se siguen mostrando, con su título original.
        const closerEvolucion = result.asertividadCloser
          ? { title: "Asertividad del closer", data: result.asertividadCloser }
          : result.energiaCloser
          ? { title: "Energía del closer", data: result.energiaCloser }
          : null

        if (!closerEvolucion && !result.termometroCliente) return null

        return (
          <Section delay={520}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {closerEvolucion && (
                <EvolutionCard
                  title={closerEvolucion.title}
                  levels={[closerEvolucion.data.inicio, closerEvolucion.data.medio, closerEvolucion.data.final]}
                  styles={ENERGIA_STYLES}
                  observacion={closerEvolucion.data.observacion}
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
        )
      })()}

    </div>
  )
}
