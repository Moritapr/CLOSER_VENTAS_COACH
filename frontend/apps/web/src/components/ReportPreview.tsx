import { GLASS, DOMINIO_PENALTIES, FRICCION_TIPO_STYLES } from "@/components/AnalysisReport"

// Preview decorativo y estático del producto para la landing — mismos
// estilos que AnalysisReport.tsx (GLASS, penalizaciones, badge de fricción),
// pero con datos inventados. No es interactivo ni recibe datos reales.
const SCORE = 45
const PENALTIES = DOMINIO_PENALTIES.filter(
  (p) => p.key === "cliente_domino" || p.key === "objecion_mal_resuelta"
)
const FRICCION = FRICCION_TIPO_STYLES.desconfianza

function scoreHue(s: number) {
  return s <= 50 ? s * 0.9 : 45 + (s - 50) * 1.5
}

export function ReportPreview() {
  const hue = scoreHue(SCORE)
  const scoreColor = `hsl(${hue}, 85%, 65%)`
  const glowColor = `hsl(${hue}, 80%, 50%)`

  return (
    <div
      aria-hidden="true"
      style={{
        width: "100%",
        maxWidth: 400,
        transform: "perspective(1400px) rotateY(-9deg) rotateX(4deg) scale(0.97)",
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className="p-6 space-y-4"
        style={{
          ...GLASS,
          background: "radial-gradient(ellipse 70% 55% at 50% 25%, rgba(217,119,6,0.12) 0%, rgba(20,14,8,0.6) 100%)",
          boxShadow: "0 40px 90px rgba(0,0,0,0.55), 0 0 60px rgba(217,119,6,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Header falso */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: "#f5ede0" }}>llamada_martes.mp3</p>
            <p className="text-[11px]" style={{ color: "rgba(245,237,224,0.4)" }}>12:04</p>
          </div>
          <span
            className="text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0"
            style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171" }}
          >
            Perdida
          </span>
        </div>

        <div className="gradient-sep" />

        {/* Score */}
        <div className="text-center py-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(245,237,224,0.5)" }}>
            Score general
          </p>
          <p
            className="font-black leading-none"
            style={{ fontSize: 56, color: scoreColor, textShadow: `0 0 30px ${glowColor}80` }}
          >
            {SCORE}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "rgba(245,237,224,0.35)" }}>/ 100</p>
        </div>

        {/* Penalizaciones */}
        <div className="space-y-1.5">
          {PENALTIES.map((p) => (
            <div
              key={p.key}
              className="flex items-center justify-between gap-3 text-xs rounded-lg px-3 py-1.5"
              style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)" }}
            >
              <span style={{ color: "rgba(245,237,224,0.65)" }}>{p.label}</span>
              <span className="font-bold shrink-0" style={{ color: "#f87171" }}>−{p.weight}</span>
            </div>
          ))}
        </div>

        <div className="gradient-sep" />

        {/* Mapa de fricción */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold" style={{ color: "#f5ede0" }}>Mapa de fricción</p>
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs flex-1 italic" style={{ color: "rgba(245,237,224,0.8)" }}>
              "la verdad no sé, lo tengo que pensar con mi esposa"
            </p>
            <span
              className="text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0"
              style={{ background: FRICCION.bg, border: `1px solid ${FRICCION.border}`, color: FRICCION.color }}
            >
              {FRICCION.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
