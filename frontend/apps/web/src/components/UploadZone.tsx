import { useRef, useState } from "react"

interface UploadZoneProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
}

export function UploadZone({ onFileSelect, disabled }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file: File) {
    if (file.type === "audio/mpeg" || file.name.endsWith(".mp3")) onFileSelect(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className="animate-fade-slide-up"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        borderRadius: "20px",
        padding: "64px 32px",
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.25s ease",
        background: dragging
          ? "rgba(124, 58, 237, 0.12)"
          : "rgba(255, 255, 255, 0.025)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: dragging
          ? "2px dashed rgba(167, 139, 250, 0.7)"
          : "2px dashed rgba(139, 92, 246, 0.25)",
        boxShadow: dragging
          ? "0 0 60px rgba(124, 58, 237, 0.25), inset 0 0 40px rgba(124, 58, 237, 0.05)"
          : "0 0 20px rgba(139, 92, 246, 0.08)",
      }}
    >
      {/* Icon */}
      <div
        className="flex h-20 w-20 items-center justify-center rounded-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          boxShadow: "0 0 30px rgba(124, 58, 237, 0.2)",
        }}
      >
        <svg className="h-9 w-9" style={{ color: "#a78bfa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </div>

      {/* Text */}
      <div className="space-y-1">
        <p className="text-lg font-bold" style={{ color: "#ede9fe" }}>Subí tu grabación</p>
        <p className="text-sm" style={{ color: "rgba(237,233,254,0.45)" }}>
          Arrastrá un MP3 o hacé clic para seleccionar
        </p>
      </div>

      {/* Button */}
      <button
        disabled={disabled}
        className="rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200"
        style={{
          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          color: "#fff",
          boxShadow: "0 0 25px rgba(124,58,237,0.35)",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        Seleccionar MP3
      </button>

      <p className="text-xs" style={{ color: "rgba(237,233,254,0.3)" }}>Solo archivos .mp3</p>

      <input ref={inputRef} type="file" accept=".mp3,audio/mpeg" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        disabled={disabled} />
    </div>
  )
}
