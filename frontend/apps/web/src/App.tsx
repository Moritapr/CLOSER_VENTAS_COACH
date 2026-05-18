import { useState } from "react"
import { UploadZone } from "@/components/UploadZone"
import { LoadingState } from "@/components/LoadingState"
import { AnalysisReport, type AnalysisResult } from "@/components/AnalysisReport"

type AppState = "idle" | "loading" | "done"

const MOCK_RESULT: AnalysisResult = {
  score: 74,
  duration: "12:34",
  summary: "Buena apertura y rapport, pero la presentación de beneficios IUL fue débil y no se cerró correctamente.",
  phases: [
    { name: "Apertura y rapport", passed: true, feedback: "Excelente conexión inicial con el prospecto." },
    { name: "Calificación", passed: true, feedback: "Identificó correctamente el perfil financiero." },
    { name: "Presentación del problema", passed: true, feedback: "Explicó bien el problema de los seguros tradicionales." },
    { name: "Presentación IUL", passed: false, feedback: "No explicó los beneficios del índice claramente." },
    { name: "Manejo de objeciones", passed: false, feedback: "No respondió la objeción de precio con el 3-step." },
    { name: "Cierre", passed: false, feedback: "No intentó el cierre directo al final de la llamada." },
    { name: "Seguimiento", passed: true, feedback: "Agendó correctamente el follow-up." },
  ],
  strengths: [
    "Tono de voz seguro y profesional durante toda la llamada",
    "Buen manejo del silencio post-pregunta",
    "Rapport natural y fluido en los primeros 3 minutos",
  ],
  weaknesses: [
    "No usó analogías para explicar el crecimiento indexado",
    "Habló de precio antes de establecer valor",
    "No aplicó el cierre de 3 opciones al final",
  ],
  objections: [
    { type: "Es muy caro", handled: false },
    { type: "Necesito pensarlo", handled: true },
    { type: "Ya tengo seguro", handled: true },
    { type: "No confío en seguros", handled: false },
  ],
}

export function App() {
  const [state, setState] = useState<AppState>("idle")
  const [fileName, setFileName] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)

  async function handleFileSelect(file: File) {
    setFileName(file.name)
    setState("loading")

    // TODO: replace with real API call to backend /analyze
    await new Promise((r) => setTimeout(r, 3000))
    setResult(MOCK_RESULT)
    setState("done")
  }

  function handleReset() {
    setState("idle")
    setFileName("")
    setResult(null)
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Closer Ventas Coach</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analizá tu llamada IUL con IA y mejorá tu script
          </p>
        </div>

        {/* Content */}
        {state === "idle" && (
          <UploadZone onFileSelect={handleFileSelect} />
        )}

        {state === "loading" && (
          <LoadingState fileName={fileName} />
        )}

        {state === "done" && result && (
          <AnalysisReport
            result={result}
            fileName={fileName}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  )
}
