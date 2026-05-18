import { useRef, useState } from "react"
import { Button } from "@workspace/ui/components/button"

interface UploadZoneProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
}

export function UploadZone({ onFileSelect, disabled }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file: File) {
    if (file.type === "audio/mpeg" || file.name.endsWith(".mp3")) {
      onFileSelect(file)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`
        flex flex-col items-center justify-center gap-4
        rounded-2xl border-2 border-dashed p-12 text-center transition-colors
        ${dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
        ${disabled ? "pointer-events-none opacity-50" : "cursor-pointer"}
      `}
      onClick={() => inputRef.current?.click()}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </div>

      <div>
        <p className="text-lg font-semibold">Sube tu grabación</p>
        <p className="text-sm text-muted-foreground mt-1">
          Arrastrá un archivo MP3 o hacé clic para seleccionar
        </p>
      </div>

      <Button variant="outline" size="sm" disabled={disabled}>
        Seleccionar MP3
      </Button>

      <p className="text-xs text-muted-foreground">Solo archivos .mp3</p>

      <input
        ref={inputRef}
        type="file"
        accept=".mp3,audio/mpeg"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  )
}
