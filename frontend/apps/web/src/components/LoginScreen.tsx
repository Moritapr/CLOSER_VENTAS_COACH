import { useState } from "react"
import { WebGLShader } from "@/components/ui/web-gl-shader"

interface LoginScreenProps {
  onSignInWithGoogle: () => void | Promise<void>
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

export function LoginScreen({ onSignInWithGoogle }: LoginScreenProps) {
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
      // y este componente se desmonta. Si llegamos acá sin error, la
      // redirección no ocurrió — lo tratamos como falla para no dejar el
      // botón colgado en "Conectando...".
      setLoading(false)
    } catch {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>

      {/* ── WebGL animated background ── */}
      <WebGLShader />

      {/* ── Login card — sits above the shader ── */}
      <div
        className="animate-fade-slide-up"
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        {/* Logo + title */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 64, height: 64,
              borderRadius: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              boxShadow: "0 0 40px rgba(124,58,237,0.55), 0 0 80px rgba(124,58,237,0.25)",
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>

          <div>
            <h1 style={{
              fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #c4b5fd, #818cf8, #a78bfa)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              margin: 0,
            }}>
              Closer Ventas Coach
            </h1>
            <p style={{ color: "rgba(237,233,254,0.45)", fontSize: 13, marginTop: 4 }}>
              Análisis de llamadas con IA
            </p>
          </div>
        </div>

        {/* Glass card */}
        <div
          style={{
            background: "rgba(10, 6, 28, 0.65)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            border: "1px solid rgba(139, 92, 246, 0.25)",
            borderRadius: 20,
            padding: "28px 24px",
            boxShadow: "0 0 40px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.07)",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Gradient separator */}
          <div className="gradient-sep" />

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              type="button"
              onClick={handleClick}
              disabled={loading}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                width: "100%",
                height: 44,
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
                No pudimos conectar con Google. Intentá de nuevo.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
