import { useState, useEffect } from "react"
import { HeroUpload } from "@/components/HeroUpload"
import { LoadingState } from "@/components/LoadingState"
import {
  AnalysisReport,
  type AnalysisResult,
  type FriccionTipo,
  type EnergiaCloser,
  type AsertividadCloser,
  type TermometroCliente,
  type EvaluacionDominio,
} from "@/components/AnalysisReport"
import { LoginScreen } from "@/components/LoginScreen"
import { Logo } from "@/components/Logo"
import { Dashboard, type DashboardData, type PatronesData } from "@/components/Dashboard"
import { useAuth } from "@/hooks/useAuth"

type AppState = "idle" | "loading" | "done"
type Tab = "analizar" | "dashboard"

const API_BASE = "https://closer-ventas-coach.onrender.com"

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

interface BackendFriccionMomento {
  fragmento: string
  tipo: FriccionTipo
  explicacion: string
  que_hacer: string
}

interface BackendAnalysis {
  es_llamada_de_ventas?: boolean
  puntaje_general: number | null
  resultado?: string
  paso_a_videollamada?: boolean
  fases: Record<typeof FASE_KEYS[number], BackendPhase>
  objeciones_detectadas?: BackendObjecion[]
  mapa_friccion?: BackendFriccionMomento[]
  energia_closer?: EnergiaCloser
  asertividad_closer?: AsertividadCloser
  termometro_cliente?: TermometroCliente
  evaluacion_dominio?: EvaluacionDominio
  fortalezas: string[]
  areas_de_mejora: string[]
  consejo_principal: string
}

function authHeaders(token: string | undefined): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function firstName(user: { user_metadata?: { full_name?: string }; email?: string }): string {
  const fullName = user.user_metadata?.full_name?.trim()
  if (fullName) return fullName.split(/\s+/)[0]
  return user.email?.split("@")[0] ?? ""
}

function secondsToDuration(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, "0")}`
}

function adaptAnalysis(analysis: BackendAnalysis, duracion_segundos: number): AnalysisResult {
  return {
    // Sin score cuando no es llamada de ventas — analysis.puntaje_general
    // viene null y el reporte completo ni se renderiza en ese caso.
    score: analysis.puntaje_general != null ? Math.round(analysis.puntaje_general) : 0,
    esLlamadaDeVentas: analysis.es_llamada_de_ventas ?? true,
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
    mapaFriccion: analysis.mapa_friccion?.map((m) => ({
      fragmento: m.fragmento,
      tipo: m.tipo,
      explicacion: m.explicacion,
      queHacer: m.que_hacer,
    })),
    energiaCloser: analysis.energia_closer,
    asertividadCloser: analysis.asertividad_closer,
    termometroCliente: analysis.termometro_cliente,
    evaluacionDominio: analysis.evaluacion_dominio,
    strengths: analysis.fortalezas,
    weaknesses: analysis.areas_de_mejora,
  }
}

const EMPTY_DASHBOARD: DashboardData = {
  calls: [], weeklyScores: [], phaseFails: [], topObjections: [],
}

const EMPTY_PATRONES: PatronesData = {
  total_llamadas_analizadas: 0, patrones: [],
}

export function App() {
  const { user, loading: authLoading, signInWithGoogle, signOut, session } = useAuth()
  const [tab, setTab] = useState<Tab>("analizar")
  const [state, setState] = useState<AppState>("idle")
  const [fileName, setFileName] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData>(EMPTY_DASHBOARD)
  const [patronesData, setPatronesData] = useState<PatronesData>(EMPTY_PATRONES)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  function handleSessionExpired() {
    setSessionExpired(true)
    setState("idle")
    setFileName("")
    setResult(null)
    setApiError(null)
    signOut()
  }

  useEffect(() => {
    // Se dispara al loguearse (para tener el conteo de llamadas disponible
    // para el saludo en la pestaña Analizar) y cada vez que se visita la
    // pestaña Dashboard (para refrescar). El spinner solo se muestra en esta
    // segunda situación — en la primera la carga es silenciosa.
    if (!session) return
    const esVisitaADashboard = tab === "dashboard"
    const token = session?.access_token
    if (esVisitaADashboard) setDashboardLoading(true)
    Promise.allSettled([
      fetch(`${API_BASE}/api/dashboard`, { headers: authHeaders(token) }).then((r) => {
        if (r.status === 401) throw new Error("SESSION_EXPIRED")
        if (!r.ok) throw new Error()
        return r.json()
      }),
      fetch(`${API_BASE}/api/patrones`, { headers: authHeaders(token) }).then((r) => {
        if (r.status === 401) throw new Error("SESSION_EXPIRED")
        if (!r.ok) throw new Error()
        return r.json()
      }),
    ])
      .then(([dashboardResult, patronesResult]) => {
        if (dashboardResult.status === "fulfilled") setDashboardData(dashboardResult.value as DashboardData)
        if (patronesResult.status === "fulfilled") setPatronesData(patronesResult.value as PatronesData)

        const expiró = [dashboardResult, patronesResult].some(
          (r) => r.status === "rejected" && r.reason instanceof Error && r.reason.message === "SESSION_EXPIRED"
        )
        if (expiró) handleSessionExpired()
      })
      .finally(() => { if (esVisitaADashboard) setDashboardLoading(false) })
  }, [tab, session])

  async function handleFileSelect(file: File) {
    setFileName(file.name)
    setApiError(null)
    setState("loading")

    const token = session?.access_token

    try {
      // Step 1: upload MP3, get transcription
      const form = new FormData()
      form.append("archivo", file)
      const uploadRes = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        headers: authHeaders(token),
        body: form,
      })
      if (uploadRes.status === 401) { handleSessionExpired(); return }
      if (!uploadRes.ok) throw new Error(`El servidor rechazó el archivo (${uploadRes.status}).`)
      const { transcripcion, duracion_segundos } = await uploadRes.json()

      // Step 2: analyze transcription
      const analyzeRes = await fetch(`${API_BASE}/api/analizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ transcripcion, nombre_archivo: file.name, duracion_segundos }),
      })
      if (analyzeRes.status === 401) { handleSessionExpired(); return }
      if (!analyzeRes.ok) throw new Error(`Error al analizar la llamada (${analyzeRes.status}).`)
      const {
        analisis: analysis,
        promedio_historico,
        diferencia_vs_promedio,
        total_llamadas_previas,
      }: {
        analisis: BackendAnalysis
        promedio_historico?: number | null
        diferencia_vs_promedio?: number | null
        total_llamadas_previas?: number | null
      } = await analyzeRes.json()

      setResult({
        ...adaptAnalysis(analysis, duracion_segundos),
        promedioHistorico: promedio_historico ?? null,
        diferenciaVsPromedio: diferencia_vs_promedio ?? null,
        totalLlamadasPrevias: total_llamadas_previas ?? null,
      })
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

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(245,237,224,0.38)", fontSize: 14 }}>Verificando sesión...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onSignInWithGoogle={signInWithGoogle} sessionExpired={sessionExpired} />
  }

  return (
    <div className="min-h-svh">
      {/* Nav — glass */}
      <header
        className="sticky top-0 z-10"
        style={{
          background: "rgba(12, 10, 9, 0.72)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(217, 119, 6, 0.15)",
        }}
      >
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="sm:hidden font-black text-sm tracking-tight" style={{ color: "#f5ede0" }}>CVC</span>
            <span className="hidden sm:inline font-black text-sm tracking-tight" style={{ color: "#f5ede0" }}>Closer Ventas Coach</span>
          </div>

          {/* Tabs + logout */}
          <div className="flex items-center gap-1">
            {(["analizar", "dashboard"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  background: tab === t ? "rgba(217,119,6,0.2)" : "transparent",
                  color: tab === t ? "#fcd34d" : "rgba(245,237,224,0.45)",
                  border: tab === t ? "1px solid rgba(217,119,6,0.3)" : "1px solid transparent",
                  boxShadow: tab === t ? "0 0 15px rgba(217,119,6,0.2)" : undefined,
                }}
              >
                {t === "analizar" ? "Analizar" : "Dashboard"}
              </button>
            ))}
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                referrerPolicy="no-referrer"
                className="h-6 w-6 rounded-full ml-1"
                style={{ border: "1px solid rgba(217,119,6,0.3)" }}
              />
            )}
            <span
              className="hidden sm:inline text-xs max-w-[140px] truncate"
              style={{ color: "rgba(245,237,224,0.42)" }}
            >
              {user.user_metadata?.full_name || user.email}
            </span>
            <button
              onClick={signOut}
              className="ml-1 text-xs px-2 py-1 rounded-lg transition-all duration-200"
              style={{ color: "rgba(245,237,224,0.3)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,237,224,0.7)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,237,224,0.3)" }}
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
                  <HeroUpload
                    onFileSelect={handleFileSelect}
                    greetingName={user ? firstName(user) : undefined}
                    hasCalls={dashboardData.calls.length > 0}
                  />
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
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(245,237,224,0.38)", fontSize: 14 }}>
                Cargando dashboard...
              </div>
            ) : (
              <Dashboard
                data={dashboardData}
                patrones={patronesData}
                onViewCall={(id) => console.log("view call", id)}
                onGoToAnalyze={() => setTab("analizar")}
              />
            )
          )}
        </div>
      </main>
    </div>
  )
}
