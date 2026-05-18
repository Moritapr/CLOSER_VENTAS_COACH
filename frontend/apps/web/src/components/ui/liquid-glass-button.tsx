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
  const id        = useId().replace(/:/g, "")
  const filterId  = `liquid-${id}`
  const turbRef   = useRef<SVGFETurbulenceElement>(null)
  const rafRef    = useRef<number>(0)
  const freqRef   = useRef(0.012)

  // Animate turbulence baseFrequency toward a target value
  function animateFreq(target: number) {
    cancelAnimationFrame(rafRef.current)
    function step() {
      const curr = freqRef.current
      const diff = target - curr
      if (Math.abs(diff) < 0.0002) {
        freqRef.current = target
        turbRef.current?.setAttribute("baseFrequency", String(target))
        return
      }
      freqRef.current = curr + diff * 0.12
      turbRef.current?.setAttribute("baseFrequency", String(freqRef.current))
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }

  const active = !disabled

  return (
    <>
      {/* SVG filter definition — invisible, zero-size */}
      <svg
        aria-hidden
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      >
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence
              ref={turbRef}
              type="fractalNoise"
              baseFrequency="0.012"
              numOctaves="3"
              seed="8"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={active ? "10" : "0"}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            {/* Subtle edge blur for the glass rim */}
            <feGaussianBlur in="displaced" stdDeviation="0.4" result="blurred" />
            <feComposite in="blurred" in2="SourceGraphic" operator="atop" />
          </filter>
        </defs>
      </svg>

      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => active && animateFreq(0.028)}
        onMouseLeave={() => active && animateFreq(0.012)}
        style={{
          position: "relative",
          width: fullWidth ? "100%" : undefined,
          padding: "12px 24px",
          borderRadius: 12,
          border: "none",
          cursor: active ? "pointer" : "not-allowed",
          overflow: "hidden",
          // Apply liquid filter to the whole button
          filter: active ? `url(#${filterId})` : undefined,
          // Glass background
          background: active
            ? "linear-gradient(135deg, rgba(124,58,237,0.85) 0%, rgba(79,70,229,0.85) 100%)"
            : "rgba(139,92,246,0.18)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          // Border as inset box-shadow to survive the filter
          boxShadow: active
            ? "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.2), 0 0 28px rgba(124,58,237,0.45), 0 0 60px rgba(124,58,237,0.18)"
            : "inset 0 1px 0 rgba(255,255,255,0.06)",
          transition: "background 0.3s ease, box-shadow 0.3s ease, opacity 0.2s ease",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {/* Inner glass highlight */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: "10%",
            right: "10%",
            height: "40%",
            background: "linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)",
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
            letterSpacing: "0.01em",
            color: active ? "#fff" : "rgba(237,233,254,0.35)",
          }}
        >
          {children}
        </span>
      </button>
    </>
  )
}
