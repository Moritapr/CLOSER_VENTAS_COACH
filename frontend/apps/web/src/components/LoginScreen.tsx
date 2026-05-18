import { useState } from "react"
import { WebGLShader } from "@/components/ui/web-gl-shader"
import { LiquidButton } from "@/components/ui/liquid-glass-button"

interface LoginScreenProps {
  onLogin: (password: string) => boolean
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState("")
  const [error, setError]       = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || loading) return
    setLoading(true)
    setError(false)
    await new Promise((r) => setTimeout(r, 400))
    const ok = onLogin(password)
    if (!ok) { setError(true); setPassword("") }
    setLoading(false)
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

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Password input */}
            <div>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false) }}
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 12,
                  fontSize: 14,
                  outline: "none",
                  background: "rgba(139, 92, 246, 0.1)",
                  border: error
                    ? "1px solid rgba(248, 113, 113, 0.65)"
                    : "1px solid rgba(139, 92, 246, 0.28)",
                  color: "#ede9fe",
                  boxShadow: error ? "0 0 20px rgba(248,113,113,0.18)" : undefined,
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  boxSizing: "border-box",
                }}
              />
              {error && (
                <p style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>
                  Contraseña incorrecta. Intentá de nuevo.
                </p>
              )}
            </div>

            {/* Liquid glass button */}
            <LiquidButton
              type="submit"
              disabled={!password || loading}
              fullWidth
            >
              {loading ? "Verificando..." : "Entrar"}
            </LiquidButton>
          </form>
        </div>
      </div>
    </div>
  )
}
