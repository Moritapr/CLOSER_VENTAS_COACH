interface LoadingStateProps {
  fileName: string
}

const STEPS = [
  "Subiendo archivo...",
  "Transcribiendo audio con Whisper...",
  "Analizando llamada con Claude...",
  "Generando reporte...",
]

export function LoadingState({ fileName }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </div>

      <div className="text-center">
        <p className="font-semibold text-lg">Analizando llamada</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          {fileName}
        </p>
      </div>

      <div className="w-full max-w-sm space-y-2">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full shrink-0 ${i === 0 ? "bg-primary animate-pulse" : "bg-muted"}`} />
            <p className={`text-sm ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}>
              {step}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
