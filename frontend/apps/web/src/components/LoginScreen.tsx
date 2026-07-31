import { useState } from "react"
import { ListChecks, AlertTriangle, MessageSquareText } from "lucide-react"
import { WebGLShader } from "@/components/ui/web-gl-shader"
import { Logo } from "@/components/Logo"

interface LoginScreenProps {
  onSignInWithGoogle: () => void | Promise<void>
  sessionExpired?: boolean
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.48-1.13 2.73-2.4 3.58v2.98h3.86c2.26-2.08 3.59-5.15 3.59-8.8z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.92l-3.86-2.98c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09C3.25 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.28A11.96 11.96 0 000 12c0 1.94.47 3.77 1.28 5.38l3.99-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.62l3.99 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  )
}

interface Beneficio {
  icon: React.ReactNode
  title: string
  description: string
}

const BENEFICIOS: Beneficio[] = [
  {
    icon: <ListChecks size={17} color="#a78bfa" strokeWidth={1.8} />,
    title: "Análisis de las 7 fases del script",
    description: "Dónde estuviste bien y dónde no.",
  },
  {
    icon: <AlertTriangle size={17} color="#a78bfa" strokeWidth={1.8} />,
    title: "Mapa de fricción",
    description: "El momento exacto donde el cliente se enfrió.",
  },
  {
    icon: <MessageSquareText size={17} color="#a78bfa" strokeWidth={1.8} />,
    title: "Frases listas para usar",
    description: "Qué decir la próxima vez.",
  },
]

function BeneficioRow({ icon, title, description }: Beneficio) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div
        style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(139,92,246,0.14)",
          border: "1px solid rgba(139,92,246,0.28)",
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ color: "#ede9fe", fontSize: 13.5, fontWeight: 700, lineHeight: 1.35 }}>{title}</p>
        <p style={{ color: "rgba(237,233,254,0.48)", fontSize: 12.5, lineHeight: 1.4, marginTop: 2 }}>{description}</p>
      </div>
    </div>
  )
}

export function LoginScreen({ onSignInWithGoogle, sessionExpired }: LoginScreenProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [btnHover, setBtnHover] = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)
    setError(false)
    try {
      await onSignInWithGoogle()
      // En el flujo normal, signInWithGoogle redirige el navegador a Google
      // y este componente se desmonta. Si llegamos hasta acá sin error, la
      // redirección no ocurrió — lo tratamos como falla para no dejar el
      // botón colgado en "Conectando...".
      setLoading(false)
    } catch {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>

      {/* ── WebGL animated background ── */}
      <WebGLShader />

      {/* ── Landing + login — sits above the shader ── */}
      <div
        className="animate-fade-slide-up"
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 420,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <Logo size={36} />
          <span style={{ color: "#ede9fe", fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em" }}>
            Closer Ventas Coach
          </span>
        </div>

        {/* Headline + subhead */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "clamp(22px, 5.5vw, 30px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              background: "linear-gradient(135deg, #c4b5fd 0%, #818cf8 45%, #a78bfa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              margin: 0,
            }}
          >
            Deja de adivinar por qué no cerraste.
          </h1>
          <p style={{ color: "rgba(237,233,254,0.55)", fontSize: 14, lineHeight: 1.5, marginTop: 10 }}>
            Sube la grabación de tu llamada. La IA te dice exactamente dónde perdiste
            al cliente y qué debiste decir.
          </p>
        </div>

        {sessionExpired && (
          <div style={{
            textAlign: "center",
            padding: "10px 14px",
            borderRadius: 12,
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.25)",
            color: "#fbbf24",
            fontSize: 12.5,
          }}>
            Tu sesión expiró. Vuelve a iniciar sesión.
          </div>
        )}

        {/* Glass card */}
        <div
          style={{
            background: "rgba(10, 6, 28, 0.65)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            border: "1px solid rgba(139, 92, 246, 0.25)",
            borderRadius: 20,
            padding: "22px 22px 20px",
            boxShadow: "0 0 40px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.07)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {BENEFICIOS.map((b) => (
              <BeneficioRow key={b.title} {...b} />
            ))}
          </div>

          <div className="gradient-sep" />

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              type="button"
              onClick={handleClick}
              disabled={loading}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                width: "100%",
                height: 46,
                borderRadius: 8,
                border: "1px solid rgba(139, 92, 246, 0.22)",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                background: btnHover && !loading ? "rgba(245,245,250,1)" : "#fff",
                color: "#1f1f1f",
                fontSize: 14,
                fontWeight: 700,
                opacity: loading ? 0.6 : 1,
                transition: "background 0.2s ease, opacity 0.2s ease",
              }}
            >
              <GoogleIcon />
              {loading ? "Conectando..." : "Continuar con Google"}
            </button>

            {error && (
              <p style={{ color: "#f87171", fontSize: 12, textAlign: "center" }}>
                No pudimos conectar con Google. Intenta de nuevo.
              </p>
            )}

            <p style={{ color: "rgba(237,233,254,0.32)", fontSize: 11, textAlign: "center" }}>
              Tus grabaciones son privadas y solo tú las ves.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
