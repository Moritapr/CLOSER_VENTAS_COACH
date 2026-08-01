import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { Library, Trash2 } from "lucide-react"
import { UploadZone } from "@/components/UploadZone"
import { API_BASE, authHeaders, mensajeDeError } from "@/lib/api"

interface ConteoPatrones {
  objeciones: number
  manejoPrecio: number
  frasesClave: number
  controlConversacion: number
  transiciones: number
}

interface ReferenciaListItem {
  id: string
  date: string
  fileName: string
  duration: string
  conteo: ConteoPatrones
}

interface BibliotecaProps {
  session: Session | null
  onSessionExpired: () => void
}

const GLASS = {
  background: "rgba(255, 255, 255, 0.03)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(217, 119, 6, 0.18)",
  borderRadius: 16,
} as const

function resumenConteo(c: ConteoPatrones): string {
  const partes = [
    c.objeciones > 0 && `${c.objeciones} objeciones`,
    c.frasesClave > 0 && `${c.frasesClave} frases clave`,
    c.manejoPrecio > 0 && `${c.manejoPrecio} de precio`,
    c.transiciones > 0 && `${c.transiciones} transiciones`,
    c.controlConversacion > 0 && `${c.controlConversacion} de control`,
  ].filter(Boolean) as string[]
  return partes.length > 0 ? partes.join(" · ") : "Sin patrones extraídos"
}

function EmptyBiblioteca() {
  return (
    <div className="p-10 text-center space-y-5" style={{ ...GLASS, boxShadow: "0 0 40px rgba(217,119,6,0.1)" }}>
      <div
        className="mx-auto flex items-center justify-center"
        style={{
          width: 64, height: 64, borderRadius: 20,
          background: "linear-gradient(135deg, rgba(217,119,6,0.25), rgba(180,83,9,0.15))",
          border: "1px solid rgba(217,119,6,0.3)",
          boxShadow: "0 0 30px rgba(217,119,6,0.2)",
        }}
      >
        <Library size={28} color="#fbbf24" strokeWidth={1.7} />
      </div>
      <div className="space-y-1.5">
        <p className="font-black text-lg" style={{ color: "#f5ede0" }}>Acá vas a ver tus referencias</p>
        <p className="text-sm max-w-sm mx-auto leading-relaxed" style={{ color: "rgba(245,237,224,0.5)" }}>
          Subí la llamada de un productor top y la IA va a sacar sus objeciones mejor resueltas, sus
          frases clave y cómo maneja el precio — para que los tengas a mano cuando los necesites.
        </p>
      </div>
    </div>
  )
}

function ReferenciaCard({
  referencia, onDelete, eliminando,
}: {
  referencia: ReferenciaListItem
  onDelete: () => void
  eliminando: boolean
}) {
  return (
    <div
      className="rounded-xl p-3 transition-all duration-200"
      style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.12)" }}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: "#f5ede0" }}>{referencia.fileName}</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(245,237,224,0.38)" }}>
            {referencia.date} · {referencia.duration}
          </p>
          <p className="text-xs mt-1" style={{ color: "#fbbf24" }}>
            {resumenConteo(referencia.conteo)}
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={eliminando}
          aria-label="Eliminar referencia"
          className="shrink-0 flex items-center justify-center rounded-lg transition-all duration-200"
          style={{
            width: 32, height: 32,
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
            cursor: eliminando ? "not-allowed" : "pointer",
            opacity: eliminando ? 0.5 : 1,
          }}
        >
          <Trash2 size={14} color="#f87171" />
        </button>
      </div>
    </div>
  )
}

export function Biblioteca({ session, onSessionExpired }: BibliotecaProps) {
  const [referencias, setReferencias] = useState<ReferenciaListItem[]>([])
  const [cargandoLista, setCargandoLista] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function cargarReferencias() {
    setCargandoLista(true)
    const token = session?.access_token
    try {
      const res = await fetch(`${API_BASE}/api/referencias`, { headers: authHeaders(token) })
      if (res.status === 401) { onSessionExpired(); return }
      if (!res.ok) return
      const data = await res.json()
      setReferencias(data.referencias ?? [])
    } catch {
      // Silencioso: si falla el refresco de la lista no es crítico, el
      // usuario puede reintentar subiendo o recargando la pestaña.
    } finally {
      setCargandoLista(false)
    }
  }

  useEffect(() => {
    cargarReferencias()
  }, [])

  async function handleFileSelect(file: File) {
    setError(null)
    setSubiendo(true)
    const token = session?.access_token

    try {
      const form = new FormData()
      form.append("archivo", file)
      const uploadRes = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        headers: authHeaders(token),
        body: form,
      })
      if (uploadRes.status === 401) { onSessionExpired(); return }
      if (!uploadRes.ok) {
        throw new Error(await mensajeDeError(uploadRes, `El servidor rechazó el archivo (${uploadRes.status}).`))
      }
      const { transcripcion, duracion_segundos } = await uploadRes.json()

      const refRes = await fetch(`${API_BASE}/api/referencias`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ transcripcion, nombre_archivo: file.name, duracion_segundos }),
      })
      if (refRes.status === 401) { onSessionExpired(); return }
      if (!refRes.ok) {
        throw new Error(await mensajeDeError(refRes, `Error al extraer los patrones (${refRes.status}).`))
      }

      await cargarReferencias()
    } catch (err) {
      console.error("[Biblioteca]", err)
      if (err instanceof TypeError) {
        setError("La conexión se interrumpió. Si la llamada es muy larga, puede tardar varios minutos — intenta de nuevo.")
      } else {
        setError(err instanceof Error ? err.message : "No se pudo conectar con el servidor.")
      }
    } finally {
      setSubiendo(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar esta referencia? No se puede deshacer.")) return
    setError(null)
    setEliminandoId(id)
    const token = session?.access_token
    try {
      const res = await fetch(`${API_BASE}/api/referencias/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      })
      if (res.status === 401) { onSessionExpired(); return }
      if (!res.ok) {
        throw new Error(await mensajeDeError(res, `No se pudo eliminar (${res.status}).`))
      }
      setReferencias((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error("[Biblioteca] delete", err)
      setError(err instanceof Error ? err.message : "No se pudo eliminar la referencia.")
    } finally {
      setEliminandoId(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-black" style={{ color: "#f5ede0" }}>Biblioteca de referencia</h2>
        <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: "rgba(245,237,224,0.5)" }}>
          Subí llamadas de productores top de tu comunidad. La IA extrae cómo manejan objeciones,
          precio y cierres — para que los tengas de referencia.
        </p>
      </div>

      {/* Upload */}
      <UploadZone
        onFileSelect={handleFileSelect}
        disabled={subiendo}
        title="Sube una llamada de referencia"
        subtitle="La grabación de un productor top — no una llamada tuya"
      />

      {subiendo && (
        <div
          className="rounded-2xl p-5 text-center space-y-1.5 animate-fade-in"
          style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.18)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "#fbbf24" }}>Extrayendo patrones de la llamada...</p>
          <p className="text-xs" style={{ color: "rgba(245,237,224,0.4)" }}>
            Puede tardar varios minutos si la grabación es larga.
          </p>
        </div>
      )}

      {error && (
        <div style={{
          padding: "12px 16px",
          borderRadius: 12,
          background: "rgba(248, 113, 113, 0.08)",
          border: "1px solid rgba(248, 113, 113, 0.28)",
          color: "#f87171",
          fontSize: 13,
          textAlign: "center",
        }}>
          {error}
        </div>
      )}

      {/* Lista */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(245,237,224,0.5)" }}>
          Tus referencias
        </p>
        {cargandoLista ? (
          <p className="text-sm text-center py-6" style={{ color: "rgba(245,237,224,0.35)" }}>
            Cargando...
          </p>
        ) : referencias.length === 0 ? (
          <EmptyBiblioteca />
        ) : (
          <div className="space-y-2">
            {referencias.map((ref) => (
              <ReferenciaCard
                key={ref.id}
                referencia={ref}
                onDelete={() => handleDelete(ref.id)}
                eliminando={eliminandoId === ref.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
