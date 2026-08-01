export const API_BASE = "https://closer-ventas-coach.onrender.com"

export function authHeaders(token: string | undefined): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// El backend manda errores claros en detail (FastAPI HTTPException) — los
// mostramos tal cual en vez del genérico "rechazó el archivo (500)".
export async function mensajeDeError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    if (body && typeof body.detail === "string" && body.detail.trim()) return body.detail
  } catch {
    // El cuerpo no era JSON — nos quedamos con el mensaje genérico.
  }
  return fallback
}
