import { useEffect, useState } from "react"

const STEPS = [
  "Subiendo archivo...",
  "Transcribiendo audio con Whisper...",
  "Analizando llamada con Claude...",
  "Generando reporte...",
]

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-muted ${className}`} />
  )
}

interface LoadingStateProps {
  fileName: string
}

export function LoadingState({ fileName }: LoadingStateProps) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const intervals = [800, 1800, 2600]
    const timers = intervals.map((delay, i) =>
      setTimeout(() => setStep(i + 1), delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* File indicator */}
      <div className="text-center space-y-1">
        <p className="font-semibold">Analizando llamada</p>
        <p className="text-sm text-muted-foreground truncate max-w-xs mx-auto">{fileName}</p>
      </div>

      {/* Steps */}
      <div className="w-full max-w-sm mx-auto space-y-2">
        {STEPS.map((s, i) => {
          const done = i < step
          const active = i === step
          return (
            <div key={s} className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full shrink-0 transition-colors duration-500
                ${done ? "bg-primary" : active ? "bg-primary animate-pulse" : "bg-muted"}`}
              />
              <p className={`text-sm transition-colors duration-500
                ${done || active ? "text-foreground" : "text-muted-foreground"}`}>
                {s}
              </p>
              {done && <span className="text-xs text-primary ml-auto">✓</span>}
            </div>
          )
        })}
      </div>

      {/* Skeleton preview — simula el layout del reporte */}
      <div className="space-y-4 pt-2">
        {/* Score card skeleton */}
        <div className="rounded-xl border p-6 space-y-3 text-center">
          <Skeleton className="h-3 w-24 mx-auto" />
          <Skeleton className="h-16 w-20 mx-auto" />
          <Skeleton className="h-3 w-8 mx-auto" />
          <Skeleton className="h-4 w-3/4 mx-auto mt-2" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>

        {/* Phases skeleton */}
        <div className="rounded-xl border p-5 space-y-3">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-2.5 w-2/3" />
              </div>
            </div>
          ))}
        </div>

        {/* Strengths / weaknesses skeleton */}
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((j) => (
            <div key={j} className="rounded-xl border p-5 space-y-2">
              <Skeleton className="h-4 w-24" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
