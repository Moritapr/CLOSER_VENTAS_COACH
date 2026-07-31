import { useRef } from "react"
import { UploadZone } from "@/components/UploadZone"

// ── Particle config (static — no runtime random to avoid rerenders) ──────────
const PARTICLES = [
  { x:  4, y: 12, s: 3, dur: 9,  del: 0.0, c: "#d97706" },
  { x: 12, y: 65, s: 2, dur: 13, del: 1.8, c: "#b45309" },
  { x: 22, y: 35, s: 4, dur: 10, del: 0.6, c: "#f59e0b" },
  { x:  8, y: 82, s: 2, dur: 15, del: 3.2, c: "#fbbf24" },
  { x: 18, y: 50, s: 3, dur: 11, del: 2.1, c: "#b45309" },
  { x: 30, y: 20, s: 2, dur: 14, del: 0.9, c: "#d97706" },
  { x: 72, y: 15, s: 3, dur: 12, del: 1.4, c: "#f59e0b" },
  { x: 82, y: 55, s: 2, dur: 10, del: 0.3, c: "#d97706" },
  { x: 90, y: 78, s: 4, dur: 16, del: 2.7, c: "#b45309" },
  { x: 78, y: 35, s: 2, dur: 11, del: 1.1, c: "#fbbf24" },
  { x: 94, y: 30, s: 3, dur: 13, del: 4.0, c: "#f59e0b" },
  { x: 68, y: 70, s: 2, dur:  9, del: 0.5, c: "#d97706" },
  { x: 45, y:  8, s: 3, dur: 14, del: 3.5, c: "#b45309" },
  { x: 55, y: 90, s: 2, dur: 12, del: 1.6, c: "#fbbf24" },
  { x: 35, y: 75, s: 3, dur: 10, del: 2.9, c: "#f59e0b" },
  { x: 62, y: 42, s: 2, dur: 15, del: 0.7, c: "#d97706" },
  { x: 25, y: 92, s: 3, dur: 11, del: 3.8, c: "#b45309" },
  { x: 88, y: 10, s: 2, dur: 13, del: 1.3, c: "#fbbf24" },
]

// ── 3D tilt widget ────────────────────────────────────────────────────────────
interface WidgetProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  delay?: number
}

function FloatingWidget({ icon, title, subtitle, delay = 0 }: WidgetProps) {
  const ref = useRef<HTMLDivElement>(null)

  function onMove(e: React.MouseEvent) {
    const el = ref.current!
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width  - 0.5   // –0.5 → +0.5
    const y = (e.clientY - r.top)  / r.height - 0.5
    el.style.transition = "none"
    el.style.transform  = `perspective(500px) rotateX(${-y * 14}deg) rotateY(${x * 14}deg) translateZ(10px)`
  }

  function onLeave() {
    const el = ref.current!
    el.style.transition = "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)"
    el.style.transform  = "perspective(500px) rotateX(0deg) rotateY(0deg) translateZ(0)"
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="animate-fade-slide-up"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
        cursor: "default",
        willChange: "transform",
        width: 168,
        padding: "16px",
        borderRadius: 16,
        background: "rgba(28, 19, 10, 0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(217, 119, 6, 0.22)",
        boxShadow: "0 0 24px rgba(217,119,6,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
        userSelect: "none",
      }}
    >
      {/* Icon circle */}
      <div
        style={{
          width: 40, height: 40, borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, rgba(217,119,6,0.4), rgba(180,83,9,0.3))",
          border: "1px solid rgba(217,119,6,0.35)",
          boxShadow: "0 0 14px rgba(217,119,6,0.25)",
          marginBottom: 10,
        }}
      >
        {icon}
      </div>
      <p style={{ color: "#f5ede0", fontSize: 13, fontWeight: 700, lineHeight: 1.3, marginBottom: 4 }}>
        {title}
      </p>
      <p style={{ color: "rgba(245,237,224,0.42)", fontSize: 11, lineHeight: 1.4 }}>
        {subtitle}
      </p>
    </div>
  )
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="11" rx="3"/>
    <path d="M5 10a7 7 0 0 0 14 0"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
    <line x1="9" y1="22" x2="15" y2="22"/>
  </svg>
)

const BrainIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
    <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
    <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
    <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
    <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
    <path d="M6 18a4 4 0 0 1-1.967-.516"/>
    <path d="M19.967 17.484A4 4 0 0 1 18 18"/>
  </svg>
)

const TrendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
)

// ── Particles ─────────────────────────────────────────────────────────────────
function Particles() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.s,
            height: p.s,
            borderRadius: "50%",
            background: p.c,
            boxShadow: `0 0 ${p.s * 3}px ${p.c}88`,
            animation: `floatParticle ${p.dur}s ease-in-out infinite`,
            animationDelay: `${p.del}s`,
          }}
        />
      ))}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
interface HeroUploadProps {
  onFileSelect: (file: File) => void
}

export function HeroUpload({ onFileSelect }: HeroUploadProps) {
  return (
    <div style={{ position: "relative", padding: "8px 0 24px" }}>
      <Particles />

      {/* Hero heading */}
      <div className="animate-fade-slide-up" style={{ textAlign: "center", marginBottom: 36, position: "relative", zIndex: 1 }}>
        <h1
          style={{
            fontSize: "clamp(26px, 5vw, 40px)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            background: "linear-gradient(135deg, #fcd34d 0%, #d97706 45%, #fbbf24 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: 10,
          }}
        >
          Tu próximo cierre<br />empieza aquí
        </h1>
        <p style={{ color: "rgba(245,237,224,0.42)", fontSize: 14, lineHeight: 1.6 }}>
          Sube tu grabación · La IA analiza · Tú mejoras
        </p>
      </div>

      {/* 3-column layout */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "1fr",   // mobile: 1 col
          gap: 24,
          alignItems: "center",
          justifyItems: "center",
        }}
        className="hero-grid"
      >
        {/* Left widget — desktop only */}
        <div className="hero-widget-left">
          <FloatingWidget
            icon={<MicIcon />}
            title="Analiza tu llamada"
            subtitle="Transcripción automática con Whisper"
            delay={200}
          />
        </div>

        {/* Center card */}
        <div style={{ width: "100%", maxWidth: 480 }}>
          <UploadZone onFileSelect={onFileSelect} />
        </div>

        {/* Right widgets — desktop only */}
        <div className="hero-widget-right">
          <FloatingWidget
            icon={<BrainIcon />}
            title="IA detecta patrones"
            subtitle="Claude analiza las 7 fases del script IUL"
            delay={300}
          />
          <FloatingWidget
            icon={<TrendIcon />}
            title="Mejora semana a semana"
            subtitle="Sigue tu progreso en el dashboard"
            delay={400}
          />
        </div>
      </div>

      {/* Responsive grid styles injected via style tag */}
      <style>{`
        @media (min-width: 900px) {
          .hero-grid {
            grid-template-columns: 180px 1fr 180px !important;
            justify-items: stretch !important;
          }
          .hero-widget-left,
          .hero-widget-right {
            display: flex !important;
          }
        }
        .hero-widget-left {
          display: none;
          justify-content: flex-end;
          align-items: center;
        }
        .hero-widget-right {
          display: none;
          flex-direction: column;
          gap: 16px;
          justify-content: center;
        }
      `}</style>
    </div>
  )
}
