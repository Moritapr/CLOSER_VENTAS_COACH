import { useState, useEffect } from "react"
import { HeroUpload } from "@/components/HeroUpload"
import { LoadingState } from "@/components/LoadingState"
import { AnalysisReport, type AnalysisResult } from "@/components/AnalysisReport"
import { LoginScreen } from "@/components/LoginScreen"
import { Dashboard, type DashboardData } from "@/components/Dashboard"
import { useAuth } from "@/hooks/useAuth"

type AppState = "idle" | "loading" | "done"
type Tab = "analizar" | "dashboard"

const API_BASE = "https://closerventascoach-production.up.railway.app"

const PHASE_NAMES = [
  "Introducción",
  "Descubrimiento",
  "Licencia",
  "Calificación",
  "Oferta IUL",
  "Finanzas",
  "Cierre",
] as const

const FASE_KEYS = [
  "fase_1_introduccion",
  "fase_2_descubrimiento",
  "fase_3_licencia",
  "fase_4_calificacion",
  "fase_5_oferta",
  "fase_6_finanzas",
  "fase_7_cierre",
] as const

interface BackendPhase {
  puntaje: number
  realizado: boolean
  feedback: string
  fragmento?: string | null
  que_debio_decir?: string | null
}

interface BackendObjecion {
  objecion: string
  respuesta_del_closer: string
  que_debio_decir: string
}

interface BackendAnalysis {
  puntaje_general: number
  resultado?: string
  paso_a_videollamada?: boolean
  fases: Record<typeof FASE_KEYS[number], BackendPhase>
  objeciones_detectadas?: BackendObjecion[]
  fortalezas: string[]
  areas_de_mejora: string[]
  consejo_principal: string
}

function secondsToDuration(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, "0")}`
}

function adaptAnalysis(analysis: BackendAnalysis, duracion_segundos: number): AnalysisResult {
  return {
    score: Math.round(analysis.puntaje_general * 10),
    duration: secondsToDuration(duracion_segundos),
    summary: analysis.consejo_principal,
    resultado: analysis.resultado,
    pasoAVideollamada: analysis.paso_a_videollamada,
    phases: FASE_KEYS.map((key, i) => ({
      name: PHASE_NAMES[i],
      passed: analysis.fases[key].realizado,
      feedback: analysis.fases[key].feedback,
      fragmento: analysis.fases[key].fragmento ?? undefined,
      queDebioDecir: analysis.fases[key].que_debio_decir ?? undefined,
    })),
    objeciones: analysis.objeciones_detectadas?.map((o) => ({
      objecion: o.objecion,
      respuestaDada: o.respuesta_del_closer,
      queDebioDecir: o.que_debio_decir,
    })),
    strengths: analysis.fortalezas,
    weaknesses: analysis.areas_de_mejora,
  }
}

const EMPTY_DASHBOARD: DashboardData = {
  calls: [], weeklyScores: [], phaseFails: [], topObjections: [],
}

export function App() {
  const { isAuthenticated, login, logout } = useAuth()
  const [tab, setTab] = useState<Tab>("analizar")
  const [state, setState] = useState<AppState>("idle")
  const [fileName, setFileName] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData>(EMPTY_DASHBOARD)
  const [dashboardLoading, setDashboardLoading] = useState(false)

  useEffect(() => {
    if (tab !== "dashboard") return
    setDashboardLoading(true)
    fetch(`${API_BASE}/api/dashboard`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data: DashboardData) => setDashboardData(data))
      .catch(() => {})
      .finally(() => setDashboardLoading(false))
  }, [tab])

  async function handleFileSelect(file: File) {
    setFileName(file.name)
    setApiError(null)
    setState("loading")

    try {
      // Step 1: upload MP3, get transcription
      const form = new FormData()
      form.append("archivo", file)
      const uploadRes = await fetch(`${API_BASE}/api/upload`, { method: "POST", body: form })
      if (!uploadRes.ok) throw new Error(`El servidor rechazó el archivo (${uploadRes.status}).`)
      const { transcripcion, duracion_segundos } = await uploadRes.json()

      // Step 2: analyze transcription
      const analyzeRes = await fetch(`${API_BASE}/api/analizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcripcion, nombre_archivo: file.name, duracion_segundos }),
      })
      if (!analyzeRes.ok) throw new Error(`Error al analizar la llamada (${analyzeRes.status}).`)
      const { analisis: analysis }: { analisis: BackendAnalysis } = await analyzeRes.json()

      setResult(adaptAnalysis(analysis, duracion_segundos))
      setState("done")
    } catch (err) {
      console.error("[API]", err)
      setApiError(err instanceof Error ? err.message : "No se pudo conectar con el servidor.")
      setState("idle")
    }
  }

  function handleReset() {
    setState("idle")
    setFileName("")
    setResult(null)
    setApiError(null)
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />
  }

  return (
    <div className="min-h-svh">
      {/* Nav — glass */}
      <header
        className="sticky top-0 z-10"
        style={{
          background: "rgba(7, 5, 14, 0.72)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(139, 92, 246, 0.15)",
        }}
      >
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 12px rgba(124,58,237,0.5)" }}
            >
              <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <span className="sm:hidden font-black text-sm tracking-tight" style={{ color: "#ede9fe" }}>CVC</span>
            <span className="hidden sm:inline font-black text-sm tracking-tight" style={{ color: "#ede9fe" }}>Closer Ventas Coach</span>
          </div>

          {/* Tabs + logout */}
          <div className="flex items-center gap-1">
            {(["analizar", "dashboard"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  background: tab === t ? "rgba(139,92,246,0.2)" : "transparent",
                  color: tab === t ? "#c4b5fd" : "rgba(237,233,254,0.45)",
                  border: tab === t ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent",
                  boxShadow: tab === t ? "0 0 15px rgba(139,92,246,0.2)" : undefined,
                }}
              >
                {t === "analizar" ? "Analizar" : "Dashboard"}
              </button>
            ))}
            <button
              onClick={logout}
              className="ml-1 text-xs px-2 py-1 rounded-lg transition-all duration-200"
              style={{ color: "rgba(237,233,254,0.3)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(237,233,254,0.7)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(237,233,254,0.3)" }}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Content — wider when showing the hero to fit side widgets */}
      <main
        className="mx-auto px-4 py-8"
        style={{ maxWidth: tab === "analizar" && state === "idle" ? 900 : 672 }}
      >
        <div key={tab} className="animate-fade-slide-up">
          {tab === "analizar" && (
            <>
              {state === "idle" && (
                <>
                  <HeroUpload onFileSelect={handleFileSelect} />
                  {apiError && (
                    <div style={{
                      marginTop: 16,
                      padding: "12px 16px",
                      borderRadius: 12,
                      background: "rgba(248, 113, 113, 0.08)",
                      border: "1px solid rgba(248, 113, 113, 0.28)",
                      color: "#f87171",
                      fontSize: 13,
                      textAlign: "center",
                    }}>
                      {apiError}
                    </div>
                  )}
                </>
              )}
              {state === "loading" && <LoadingState fileName={fileName} />}
              {state === "done" && result && (
                <AnalysisReport result={result} fileName={fileName} onReset={handleReset} />
              )}
            </>
          )}

          {tab === "dashboard" && (
            dashboardLoading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(237,233,254,0.38)", fontSize: 14 }}>
                Cargando dashboard...
              </div>
            ) : (
              <Dashboard
                data={dashboardData}
                onViewCall={(id) => console.log("view call", id)}
              />
            )
          )}
        </div>
      </main>
    </div>
  )
}
