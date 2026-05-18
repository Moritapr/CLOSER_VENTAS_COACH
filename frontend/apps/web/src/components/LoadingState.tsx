import { useEffect, useState } from "react"

const STEPS = [
  "Subiendo archivo...",
  "Transcribiendo audio con Whisper...",
  "Analizando llamada con Claude...",
  "Generando reporte...",
]

function DarkSkeleton({ w = "100%", h = "12px" }: { w?: string; h?: string }) {
  return <div className="skeleton-dark" style={{ width: w, height: h }} />
}

interface LoadingStateProps {
  fileName: string
}

export function LoadingState({ fileName }: LoadingStateProps) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timers = [800, 1800, 2600].map((delay, i) =>
      setTimeout(() => setStep(i + 1), delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Steps panel */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{
          background: "rgba(10, 6, 25, 0.55)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(139, 92, 246, 0.22)",
        }}
      >
        <div className="text-center space-y-0.5">
          <p className="font-bold" style={{ color: "#ede9fe" }}>Analizando llamada</p>
          <p className="text-xs truncate" style={{ color: "rgba(237,233,254,0.42)" }}>{fileName}</p>
        </div>

        <div className="gradient-sep" />

        <div className="space-y-3">
          {STEPS.map((s, i) => {
            const done = i < step
            const active = i === step
            return (
              <div key={s} className="flex items-center gap-3">
                <div
                  className="h-2 w-2 rounded-full shrink-0 transition-all duration-500"
                  style={{
                    background: done || active ? "#a78bfa" : "rgba(139,92,246,0.2)",
                    boxShadow: active ? "0 0 10px rgba(167,139,250,0.8)" : undefined,
                    animation: active ? "pulse 1s ease-in-out infinite" : undefined,
                  }}
                />
                <p
                  className="text-sm transition-colors duration-500 flex-1"
                  style={{ color: done || active ? "#ede9fe" : "rgba(237,233,254,0.35)" }}
                >
                  {s}
                </p>
                {done && <span className="text-xs" style={{ color: "#a78bfa" }}>✓</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Skeleton preview */}
      <div className="space-y-4">
        {/* Score skeleton */}
        <div
          className="rounded-2xl p-6 space-y-3 text-center"
          style={{
            background: "rgba(139, 92, 246, 0.05)",
            border: "1px solid rgba(139, 92, 246, 0.15)",
          }}
        >
          <DarkSkeleton w="96px" h="10px" />
          <div className="flex justify-center"><DarkSkeleton w="80px" h="64px" /></div>
          <DarkSkeleton w="32px" h="10px" />
          <DarkSkeleton w="260px" h="12px" />
          <DarkSkeleton w="180px" h="12px" />
        </div>

        {/* Phases skeleton */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(139,92,246,0.15)" }}
        >
          <DarkSkeleton w="160px" h="14px" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <DarkSkeleton w="24px" h="24px" />
              <div className="flex-1 space-y-2">
                <DarkSkeleton w="35%" h="11px" />
                <DarkSkeleton w="65%" h="9px" />
              </div>
            </div>
          ))}
        </div>

        {/* Strengths / weaknesses skeleton */}
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((j) => (
            <div key={j} className="rounded-2xl p-5 space-y-3"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(139,92,246,0.15)" }}>
              <DarkSkeleton w="96px" h="13px" />
              {Array.from({ length: 3 }).map((_, i) => (
                <DarkSkeleton key={i} w="100%" h="10px" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
