interface LogoProps {
  size?: number
}

// Monograma tipográfico "CVC" — reemplaza el ícono de nota musical, que no
// tenía relación con coaching de ventas. Un solo componente compartido entre
// el nav (chico) y la landing/login (grande) para que ambos usos queden
// siempre en sync.
export function Logo({ size = 32 }: LogoProps) {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
        boxShadow: `0 0 ${Math.round(size * 0.35)}px rgba(124,58,237,0.5)`,
      }}
    >
      <span
        style={{
          color: "#fff",
          fontWeight: 900,
          fontSize: Math.round(size * 0.36),
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        CVC
      </span>
    </div>
  )
}
