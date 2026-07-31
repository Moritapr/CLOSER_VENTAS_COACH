import { useEffect, useState } from "react"
import { TrendingUp, ArrowUp, ArrowDown, Minus } from "lucide-react"
import { DOMINIO_PENALTIES } from "@/components/AnalysisReport"

export interface PatronRepetido {
  criterio: string
  veces: number
  de: number
  porcentaje: number
}

export interface PatronesData {
  total_llamadas_analizadas: number
  patrones: PatronRepetido[]
}

export interface CallRecord {
  id: string
  date: string
  fileName: string
  duration: string
  score: number
  weakestPhase: string
}

export interface DashboardData {
  calls: CallRecord[]
  weeklyScores: { label: string; score: number }[]
  phaseFails: { name: string; failCount: number; total: number }[]
  topObjections: { type: string; count: number; handledCount: number }[]
}

interface DashboardProps {
  data: DashboardData
  patrones: PatronesData
  onViewCall: (id: string) => void
  onGoToAnalyze: () => void
}

const GLASS = {
  background: "rgba(255, 255, 255, 0.03)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(217, 119, 6, 0.18)",
  borderRadius: 16,
} as const

function scoreHue(s: number) { return s <= 50 ? s * 0.9 : 45 + (s - 50) * 1.5 }

function labelCriterio(criterio: string): string {
  return DOMINIO_PENALTIES.find((p) => p.key === criterio)?.label ?? criterio
}

function PatronesRepetidos({ patrones }: { patrones: PatronesData }) {
  return (
    <div
      className="p-5 space-y-4"
      style={{ ...GLASS, boxShadow: "0 0 25px rgba(217,119,6,0.18), 0 0 50px rgba(217,119,6,0.07)" }}
    >
      <p className="font-bold text-sm" style={{ color: "#f5ede0" }}>Tu patrón repetido</p>
      <div className="gradient-sep" />
      {patrones.patrones.length === 0 ? (
        <p className="text-sm text-center py-2" style={{ color: "rgba(245,237,224,0.35)" }}>
          Necesitas más llamadas analizadas para detectar patrones.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {patrones.patrones.map((p) => (
            <li key={p.criterio} className="text-sm flex items-start gap-2" style={{ color: "rgba(245,237,224,0.75)" }}>
              <span className="shrink-0 mt-0.5 font-bold" style={{ color: "#fbbf24" }}>!</span>
              <span>
                <strong style={{ color: "#f5ede0" }}>{labelCriterio(p.criterio)}</strong> apareció en{" "}
                {p.veces} de tus últimas {p.de} llamadas ({p.porcentaje}%).
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ScorePill({ score }: { score: number }) {
  const hue = scoreHue(score)
  const color = `hsl(${hue}, 80%, 62%)`
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(score), 100); return () => clearTimeout(t) }, [score])

  return (
    <div className="flex items-center gap-2 shrink-0 w-24">
      <div style={{ flex: 1, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${w}%`, borderRadius: 999,
          background: color,
          boxShadow: `0 0 8px ${color}88`,
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
      <span className="text-xs font-bold tabular-nums w-6 text-right" style={{ color }}>{score}</span>
    </div>
  )
}

// Compara contra la llamada anterior (cronológicamente) — data.calls viene
// ordenado más reciente primero, así que "anterior" es null solo cuando es
// la primera llamada que el usuario analizó.
function TrendIndicator({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null) {
    return (
      <span className="flex items-center justify-center shrink-0" style={{ width: 34, color: "rgba(245,237,224,0.25)" }}>
        <Minus size={13} strokeWidth={2.5} />
      </span>
    )
  }
  const diff = current - previous
  if (diff === 0) {
    return (
      <span className="flex items-center justify-center shrink-0" style={{ width: 34, color: "rgba(245,237,224,0.25)" }}>
        <Minus size={13} strokeWidth={2.5} />
      </span>
    )
  }
  const subio = diff > 0
  const color = subio ? "#34d399" : "#f87171"
  return (
    <span className="flex items-center justify-center gap-0.5 shrink-0 text-xs font-bold tabular-nums" style={{ width: 34, color }}>
      {subio ? <ArrowUp size={12} strokeWidth={2.5} /> : <ArrowDown size={12} strokeWidth={2.5} />}
      {Math.abs(diff)}
    </span>
  )
}

function WeeklyChart({ data }: { data: { label: string; score: number }[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 150); return () => clearTimeout(t) }, [])
  const maxH = 72

  return (
    <div className="flex items-end gap-2 pt-2" style={{ height: 100 }}>
      {data.map(({ label, score }, i) => {
        const hue = scoreHue(score)
        const color = `hsl(${hue}, 80%, 62%)`
        const barH = mounted ? (score / 100) * maxH : 0
        return (
          <div key={label} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-xs font-bold tabular-nums" style={{ color }}>
              {mounted ? score : ""}
            </span>
            <div style={{ height: maxH, width: "100%", display: "flex", alignItems: "flex-end" }}>
              <div
                style={{
                  width: "100%",
                  height: barH,
                  borderRadius: "6px 6px 2px 2px",
                  background: `linear-gradient(to top, ${color}cc, ${color}44)`,
                  boxShadow: mounted ? `0 0 12px ${color}55` : undefined,
                  transition: `height 0.6s cubic-bezier(0.4,0,0.2,1) ${i * 80}ms`,
                }}
              />
            </div>
            <span className="text-xs" style={{ color: "rgba(245,237,224,0.38)" }}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

// Estado vacío global — reemplaza el dashboard entero cuando el usuario
// todavía no tiene llamadas analizadas, en vez de mostrar cada sección
// (patrones, fases, objeciones, historial) vacía por separado.
function EmptyDashboard({ onGoToAnalyze }: { onGoToAnalyze: () => void }) {
  return (
    <div className="p-10 text-center space-y-5" style={{ ...GLASS, boxShadow: "0 0 40px rgba(217,119,6,0.1)" }}>
      <div
        className="mx-auto flex items-center justify-center"
        style={{
          width: 64, height: 64, borderRadius: 20,
          background: "linear-gradient(135deg, rgba(217,119,6,0.25), rgba(180,83,9,0.15))",
          border: "1px solid rgba(217,119,6,0.3)",
          boxShadow: "0 0 30px rgba(217,119,6,0.2)",
        }}
      >
        <TrendingUp size={28} color="#fbbf24" strokeWidth={1.7} />
      </div>
      <div className="space-y-1.5">
        <p className="font-black text-lg" style={{ color: "#f5ede0" }}>Aquí verás tu progreso</p>
        <p className="text-sm max-w-sm mx-auto leading-relaxed" style={{ color: "rgba(245,237,224,0.5)" }}>
          Score por semana, las fases donde más fallás, tus objeciones frecuentes y el
          historial de cada llamada — todo va a aparecer acá apenas analices tu primera grabación.
        </p>
      </div>
      <button
        onClick={onGoToAnalyze}
        className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200"
        style={{
          background: "linear-gradient(135deg, #d97706, #b45309)",
          color: "#fff",
          boxShadow: "0 0 25px rgba(217,119,6,0.35)",
          border: "none",
        }}
      >
        Analizar mi primera llamada
      </button>
    </div>
  )
}

export function Dashboard({ data, patrones, onViewCall, onGoToAnalyze }: DashboardProps) {
  if (data.calls.length === 0) {
    return (
      <div className="animate-fade-slide-up">
        <EmptyDashboard onGoToAnalyze={onGoToAnalyze} />
      </div>
    )
  }

  const avgScore = data.calls.length
    ? Math.round(data.calls.reduce((a, c) => a + c.score, 0) / data.calls.length)
    : 0
  const worstPhase = data.phaseFails[0]
  const bestWeek = Math.max(...data.weeklyScores.map((w) => w.score))

  const stats = [
    { label: "Llamadas", value: String(data.calls.length), glow: false },
    { label: "Score promedio", value: String(avgScore), glow: true },
    { label: "Mejor semana", value: String(bestWeek), glow: true },
    { label: "Fase más débil", value: worstPhase?.name.split(" ")[0] ?? "—", glow: false, small: true },
  ]

  return (
    <div className="space-y-5 animate-fade-slide-up">

      {/* Tu patrón repetido — destacado arriba de todo */}
      <PatronesRepetidos patrones={patrones} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, glow, small }) => (
          <div
            key={label}
            className="p-4 space-y-1 transition-all duration-200 cursor-default"
            style={{
              ...GLASS,
              boxShadow: glow ? "0 0 25px rgba(217,119,6,0.18), 0 0 50px rgba(217,119,6,0.07)" : undefined,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 35px rgba(217,119,6,0.32), 0 0 70px rgba(217,119,6,0.14)"
              ;(e.currentTarget as HTMLDivElement).style.borderColor = "rgba(217,119,6,0.38)"
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = ""
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = glow ? "0 0 25px rgba(217,119,6,0.18), 0 0 50px rgba(217,119,6,0.07)" : ""
              ;(e.currentTarget as HTMLDivElement).style.borderColor = "rgba(217,119,6,0.18)"
            }}
          >
            <p className="text-xs" style={{ color: "rgba(245,237,224,0.42)" }}>{label}</p>
            <p
              className={`font-black ${small ? "text-base leading-tight" : "text-3xl"}`}
              style={{
                color: glow ? "#fcd34d" : "#f5ede0",
                textShadow: glow ? "0 0 20px rgba(251,191,36,0.5)" : undefined,
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      <div className="p-5 space-y-3" style={GLASS}>
        <p className="font-bold text-sm" style={{ color: "#f5ede0" }}>Progreso semanal</p>
        <div className="gradient-sep" />
        <WeeklyChart data={data.weeklyScores} />
      </div>

      {/* Phase fails + Objections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 space-y-4" style={GLASS}>
          <p className="font-bold text-sm" style={{ color: "#f5ede0" }}>Fases donde más fallás</p>
          <div className="gradient-sep" />
          <div className="space-y-4">
            {data.phaseFails.map((p) => {
              const pct = (p.failCount / p.total) * 100
              return (
                <div key={p.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "rgba(245,237,224,0.55)" }}>{p.name}</span>
                    <span className="font-bold" style={{ color: "#f87171" }}>{p.failCount}/{p.total}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${pct}%`, borderRadius: 999,
                      background: "linear-gradient(to right, #f87171, #fbbf24)",
                      boxShadow: "0 0 8px rgba(248,113,113,0.4)",
                      transition: "width 0.7s ease",
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-5 space-y-4" style={GLASS}>
          <p className="font-bold text-sm" style={{ color: "#f5ede0" }}>Objeciones frecuentes</p>
          <div className="gradient-sep" />
          <div className="space-y-3">
            {data.topObjections.map((obj) => (
              <div key={obj.type} className="flex items-center justify-between gap-2">
                <span className="text-sm truncate" style={{ color: "rgba(245,237,224,0.55)" }}>{obj.type}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-semibold" style={{ color: "#34d399" }}>{obj.handledCount}✓</span>
                  <span className="text-xs" style={{ color: "rgba(245,237,224,0.25)" }}>/</span>
                  <span className="text-xs font-bold" style={{ color: "#f5ede0" }}>{obj.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call history */}
      <div className="p-5 space-y-4" style={GLASS}>
        <p className="font-bold text-sm" style={{ color: "#f5ede0" }}>Historial de llamadas</p>
        <div className="gradient-sep" />
        {data.calls.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "rgba(245,237,224,0.35)" }}>
            Todavía no analizaste ninguna llamada.
          </p>
        ) : (
          <div className="space-y-2">
            {data.calls.map((call, i) => (
              <button
                key={call.id}
                onClick={() => onViewCall(call.id)}
                className="w-full text-left rounded-xl p-3 transition-all duration-200 cursor-pointer"
                style={{
                  background: "rgba(217,119,6,0.06)",
                  border: "1px solid rgba(217,119,6,0.12)",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.background = "rgba(217,119,6,0.12)"
                  el.style.borderColor = "rgba(217,119,6,0.28)"
                  el.style.transform = "translateY(-2px)"
                  el.style.boxShadow = "0 0 20px rgba(217,119,6,0.18)"
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.background = "rgba(217,119,6,0.06)"
                  el.style.borderColor = "rgba(217,119,6,0.12)"
                  el.style.transform = ""
                  el.style.boxShadow = ""
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: "#f5ede0" }}>{call.fileName}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(245,237,224,0.38)" }}>
                      {call.date} · {call.duration} · Falla: {call.weakestPhase}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <TrendIndicator current={call.score} previous={data.calls[i + 1]?.score ?? null} />
                    <ScorePill score={call.score} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
