import { useEffect, useState } from "react"

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
  onViewCall: (id: string) => void
}

const GLASS = {
  background: "rgba(255, 255, 255, 0.03)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(139, 92, 246, 0.18)",
  borderRadius: 16,
} as const

function scoreHue(s: number) { return s <= 50 ? s * 0.9 : 45 + (s - 50) * 1.5 }

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
            <span className="text-xs" style={{ color: "rgba(237,233,254,0.38)" }}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

export function Dashboard({ data, onViewCall }: DashboardProps) {
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, glow, small }) => (
          <div
            key={label}
            className="p-4 space-y-1 transition-all duration-200 cursor-default"
            style={{
              ...GLASS,
              boxShadow: glow ? "0 0 25px rgba(139,92,246,0.18), 0 0 50px rgba(139,92,246,0.07)" : undefined,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 35px rgba(139,92,246,0.32), 0 0 70px rgba(139,92,246,0.14)"
              ;(e.currentTarget as HTMLDivElement).style.borderColor = "rgba(139,92,246,0.38)"
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = ""
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = glow ? "0 0 25px rgba(139,92,246,0.18), 0 0 50px rgba(139,92,246,0.07)" : ""
              ;(e.currentTarget as HTMLDivElement).style.borderColor = "rgba(139,92,246,0.18)"
            }}
          >
            <p className="text-xs" style={{ color: "rgba(237,233,254,0.42)" }}>{label}</p>
            <p
              className={`font-black ${small ? "text-base leading-tight" : "text-3xl"}`}
              style={{
                color: glow ? "#c4b5fd" : "#ede9fe",
                textShadow: glow ? "0 0 20px rgba(167,139,250,0.5)" : undefined,
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      <div className="p-5 space-y-3" style={GLASS}>
        <p className="font-bold text-sm" style={{ color: "#ede9fe" }}>Progreso semanal</p>
        <div className="gradient-sep" />
        <WeeklyChart data={data.weeklyScores} />
      </div>

      {/* Phase fails + Objections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 space-y-4" style={GLASS}>
          <p className="font-bold text-sm" style={{ color: "#ede9fe" }}>Fases donde más fallás</p>
          <div className="gradient-sep" />
          <div className="space-y-4">
            {data.phaseFails.map((p) => {
              const pct = (p.failCount / p.total) * 100
              return (
                <div key={p.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "rgba(237,233,254,0.55)" }}>{p.name}</span>
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
          <p className="font-bold text-sm" style={{ color: "#ede9fe" }}>Objeciones frecuentes</p>
          <div className="gradient-sep" />
          <div className="space-y-3">
            {data.topObjections.map((obj) => (
              <div key={obj.type} className="flex items-center justify-between gap-2">
                <span className="text-sm truncate" style={{ color: "rgba(237,233,254,0.55)" }}>{obj.type}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-semibold" style={{ color: "#34d399" }}>{obj.handledCount}✓</span>
                  <span className="text-xs" style={{ color: "rgba(237,233,254,0.25)" }}>/</span>
                  <span className="text-xs font-bold" style={{ color: "#ede9fe" }}>{obj.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call history */}
      <div className="p-5 space-y-4" style={GLASS}>
        <p className="font-bold text-sm" style={{ color: "#ede9fe" }}>Historial de llamadas</p>
        <div className="gradient-sep" />
        {data.calls.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "rgba(237,233,254,0.35)" }}>
            Todavía no analizaste ninguna llamada.
          </p>
        ) : (
          <div className="space-y-2">
            {data.calls.map((call) => (
              <button
                key={call.id}
                onClick={() => onViewCall(call.id)}
                className="w-full text-left rounded-xl p-3 transition-all duration-200"
                style={{
                  background: "rgba(139,92,246,0.06)",
                  border: "1px solid rgba(139,92,246,0.12)",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.background = "rgba(139,92,246,0.12)"
                  el.style.borderColor = "rgba(139,92,246,0.28)"
                  el.style.transform = "translateY(-2px)"
                  el.style.boxShadow = "0 0 20px rgba(139,92,246,0.18)"
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.background = "rgba(139,92,246,0.06)"
                  el.style.borderColor = "rgba(139,92,246,0.12)"
                  el.style.transform = ""
                  el.style.boxShadow = ""
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#ede9fe" }}>{call.fileName}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(237,233,254,0.38)" }}>
                      {call.date} · {call.duration} · Falla: {call.weakestPhase}
                    </p>
                  </div>
                  <ScorePill score={call.score} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
