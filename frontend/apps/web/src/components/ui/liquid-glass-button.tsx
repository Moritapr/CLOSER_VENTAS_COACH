import { useId, useRef } from "react"

interface LiquidButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  fullWidth?: boolean
}

export function LiquidButton({
  children,
  onClick,
  disabled,
  type = "button",
  fullWidth,
}: LiquidButtonProps) {
  // useId returns e.g. ":r0:" — strip colons for a valid SVG id
  const rawId   = useId()
  const filterId = "lq" + rawId.replace(/:/g, "")
  const turbRef  = useRef<SVGFETurbulenceElement>(null)
  const rafRef   = useRef<number>(0)
  const freqRef  = useRef(0.010)

  function animateTo(target: number) {
    cancelAnimationFrame(rafRef.current)
    const step = () => {
      const curr = freqRef.current
      const delta = target - curr
      if (Math.abs(delta) < 0.0003) {
        freqRef.current = target
        turbRef.current?.setAttribute("baseFrequency", target.toFixed(4))
        return
      }
      freqRef.current = curr + delta * 0.14
      turbRef.current?.setAttribute("baseFrequency", freqRef.current.toFixed(4))
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }

  const active = !disabled

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        width: fullWidth ? "100%" : undefined,
      }}
    >
      {/* ── SVG filter (zero-size, outside paint tree but in DOM) ── */}
      <svg
        aria-hidden="true"
        focusable="false"
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
      >
        <defs>
          <filter
            id={filterId}
            x="-15%"
            y="-15%"
            width="130%"
            height="130%"
            colorInterpolationFilters="sRGB"
          >
            {/* Organic noise source */}
            <feTurbulence
              ref={turbRef}
              type="fractalNoise"
              baseFrequency="0.010"
              numOctaves="4"
              seed="5"
              result="noise"
            />
            {/* Displace the button pixels using noise — this IS the liquid effect */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="14"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* ── The actual button ── */}
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => active && animateTo(0.030)}
        onMouseLeave={() => active && animateTo(0.010)}
        style={{
          position: "relative",
          width: fullWidth ? "100%" : undefined,
          padding: "13px 28px",
          borderRadius: 12,
          border: "none",
          cursor: active ? "pointer" : "not-allowed",
          userSelect: "none",
          // Apply liquid distortion only when active
          filter: active ? `url(#${filterId})` : undefined,
          // Glass gradient background
          background: active
            ? "linear-gradient(140deg, rgba(147,51,234,0.90) 0%, rgba(79,70,229,0.90) 100%)"
            : "rgba(139,92,246,0.18)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          boxShadow: active
            ? [
                "inset 0 1px 0 rgba(255,255,255,0.28)",
                "inset 0 -1px 0 rgba(0,0,0,0.18)",
                "0 0 32px rgba(124,58,237,0.50)",
                "0 0 70px rgba(124,58,237,0.20)",
              ].join(", ")
            : "inset 0 1px 0 rgba(255,255,255,0.06)",
          transition: [
            "background 0.25s ease",
            "box-shadow 0.25s ease",
            "opacity 0.2s ease",
          ].join(", "),
          opacity: disabled ? 0.45 : 1,
        }}
      >
        {/* Top-edge glass highlight — simulates refraction rim */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 1,
            left: "12%",
            right: "12%",
            height: "38%",
            background: "linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)",
            borderRadius: "0 0 50% 50%",
            pointerEvents: "none",
          }}
        />
        {/* Label */}
        <span
          style={{
            position: "relative",
            zIndex: 1,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.02em",
            color: active ? "#fff" : "rgba(237,233,254,0.35)",
          }}
        >
          {children}
        </span>
      </button>
    </div>
  )
}
