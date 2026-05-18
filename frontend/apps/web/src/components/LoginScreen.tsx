import { useState } from "react"

interface LoginScreenProps {
  onLogin: (password: string) => boolean
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)
    await new Promise((r) => setTimeout(r, 400))
    const ok = onLogin(password)
    if (!ok) { setError(true); setPassword("") }
    setLoading(false)
  }

  return (
    <div className="min-h-svh flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8 animate-fade-slide-up">

        {/* Logo */}
        <div className="text-center space-y-3">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl mx-auto glow-md"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
          >
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "#ede9fe" }}>
              Closer Ventas Coach
            </h1>
            <p className="text-sm mt-1" style={{ color: "rgba(237,233,254,0.45)" }}>
              Análisis de llamadas con IA
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-dark rounded-2xl p-6 space-y-4 glow-sm">
          <div className="gradient-sep" />

          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false) }}
              autoFocus
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: "rgba(139, 92, 246, 0.1)",
                border: error
                  ? "1px solid rgba(248, 113, 113, 0.6)"
                  : "1px solid rgba(139, 92, 246, 0.25)",
                color: "#ede9fe",
                boxShadow: error ? "0 0 20px rgba(248,113,113,0.15)" : undefined,
              }}
            />
            {error && (
              <p className="text-xs" style={{ color: "#f87171" }}>
                Contraseña incorrecta. Intentá de nuevo.
              </p>
            )}

            <button
              type="submit"
              disabled={!password || loading}
              className="w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200"
              style={{
                background: password && !loading
                  ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                  : "rgba(139, 92, 246, 0.2)",
                color: password && !loading ? "#fff" : "rgba(237,233,254,0.35)",
                boxShadow: password && !loading ? "0 0 25px rgba(124,58,237,0.4)" : undefined,
                cursor: !password || loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Verificando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
