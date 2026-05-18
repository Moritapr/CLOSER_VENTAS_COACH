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

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#ca8a04" : "#dc2626"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium tabular-nums w-7 text-right" style={{ color }}>{score}</span>
    </div>
  )
}

function WeeklyChart({ data }: { data: { label: string; score: number }[] }) {
  const max = 100
  const h = 80

  return (
    <div className="flex items-end gap-2 h-24 pt-4">
      {data.map(({ label, score }) => (
        <div key={label} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xs text-muted-foreground tabular-nums">{score}</span>
          <div className="w-full rounded-t-sm bg-primary/20 relative" style={{ height: h }}>
            <div
              className="absolute bottom-0 w-full rounded-t-sm bg-primary transition-all"
              style={{ height: `${(score / max) * h}px` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  )
}

export function Dashboard({ data, onViewCall }: DashboardProps) {
  const avgScore = data.calls.length
    ? Math.round(data.calls.reduce((a, c) => a + c.score, 0) / data.calls.length)
    : 0

  const worstPhase = data.phaseFails.reduce(
    (worst, p) => (p.failCount > worst.failCount ? p : worst),
    data.phaseFails[0]
  )

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Llamadas", value: data.calls.length },
          { label: "Score promedio", value: avgScore },
          { label: "Mejor semana", value: Math.max(...data.weeklyScores.map((w) => w.score)) },
          { label: "Fase más débil", value: worstPhase?.name.split(" ")[0] ?? "—", small: true },
        ].map(({ label, value, small }) => (
          <div key={label} className="rounded-xl border p-4 space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`font-bold ${small ? "text-base leading-tight" : "text-2xl"}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      <div className="rounded-xl border p-5 space-y-2">
        <h3 className="font-semibold text-sm">Progreso semanal</h3>
        <WeeklyChart data={data.weeklyScores} />
      </div>

      {/* Phase fails + Objections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border p-5 space-y-3">
          <h3 className="font-semibold text-sm">Fases donde más fallás</h3>
          <div className="space-y-3">
            {data.phaseFails.map((p) => (
              <div key={p.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{p.name}</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {p.failCount}/{p.total}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-500"
                    style={{ width: `${(p.failCount / p.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border p-5 space-y-3">
          <h3 className="font-semibold text-sm">Objeciones frecuentes</h3>
          <div className="space-y-2">
            {data.topObjections.map((obj) => (
              <div key={obj.type} className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground truncate">{obj.type}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-green-600 dark:text-green-400">
                    {obj.handledCount}✓
                  </span>
                  <span className="text-xs text-muted-foreground">/</span>
                  <span className="text-xs font-medium">{obj.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call history */}
      <div className="rounded-xl border p-5 space-y-3">
        <h3 className="font-semibold text-sm">Historial de llamadas</h3>
        {data.calls.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Todavía no analizaste ninguna llamada.
          </p>
        ) : (
          <div className="space-y-2">
            {data.calls.map((call) => (
              <button
                key={call.id}
                onClick={() => onViewCall(call.id)}
                className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{call.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {call.date} · {call.duration} · Falla: {call.weakestPhase}
                    </p>
                  </div>
                  <ScoreBar score={call.score} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
