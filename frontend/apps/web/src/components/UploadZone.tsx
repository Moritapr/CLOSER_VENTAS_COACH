import { useRef, useState } from "react"
import { Mic } from "lucide-react"

interface UploadZoneProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
  title?: string
  subtitle?: string
}

export function UploadZone({
  onFileSelect,
  disabled,
  title = "Sube tu grabación",
  subtitle = "Arrastra un archivo de audio o haz clic para seleccionar",
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file: File) {
    if (file.type.startsWith("audio/") || file.type.startsWith("video/")) onFileSelect(file)
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
          ? "rgba(217, 119, 6, 0.12)"
          : "rgba(255, 255, 255, 0.025)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: dragging
          ? "2px dashed rgba(251, 191, 36, 0.7)"
          : "2px dashed rgba(217, 119, 6, 0.25)",
        boxShadow: dragging
          ? "0 0 60px rgba(217, 119, 6, 0.25), inset 0 0 40px rgba(217, 119, 6, 0.05)"
          : "0 0 20px rgba(217, 119, 6, 0.08)",
      }}
    >
      {/* Icon */}
      <div
        className="flex h-20 w-20 items-center justify-center rounded-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(217,119,6,0.3), rgba(180,83,9,0.2))",
          border: "1px solid rgba(217, 119, 6, 0.3)",
          boxShadow: "0 0 30px rgba(217, 119, 6, 0.2)",
        }}
      >
        <Mic size={36} color="#fbbf24" strokeWidth={1.5} />
      </div>

      {/* Text */}
      <div className="space-y-1">
        <p className="text-lg font-bold" style={{ color: "#f5ede0" }}>{title}</p>
        <p className="text-sm" style={{ color: "rgba(245,237,224,0.45)" }}>
          {subtitle}
        </p>
      </div>

      {/* Button */}
      <button
        disabled={disabled}
        className="rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200"
        style={{
          background: "linear-gradient(135deg, #d97706, #b45309)",
          color: "#fff",
          boxShadow: "0 0 25px rgba(217,119,6,0.35)",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        Seleccionar archivo
      </button>

      <p className="text-xs" style={{ color: "rgba(245,237,224,0.3)" }}>MP3, WAV, M4A, MP4, OGG</p>

      <input ref={inputRef} type="file" accept="audio/*,video/mp4" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        disabled={disabled} />
    </div>
  )
}
