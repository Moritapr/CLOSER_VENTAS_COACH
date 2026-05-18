import { useState } from "react"
import { Button } from "@workspace/ui/components/button"

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
    if (!ok) {
      setError(true)
      setPassword("")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary mx-auto">
            <svg className="h-7 w-7 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Closer Ventas Coach</h1>
          <p className="text-sm text-muted-foreground">Ingresá la contraseña para continuar</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false) }}
              autoFocus
              className={`w-full rounded-lg border px-4 py-2.5 text-sm bg-background outline-none transition-colors
                focus:ring-2 focus:ring-primary/30 focus:border-primary
                ${error ? "border-red-500 focus:ring-red-500/30 focus:border-red-500" : "border-input"}`}
            />
            {error && (
              <p className="text-xs text-red-500">Contraseña incorrecta. Intentá de nuevo.</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={!password || loading}>
            {loading ? "Verificando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  )
}
