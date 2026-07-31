interface LogoProps {
  size?: number
}

// Monograma tipográfico "CVC" — reemplaza el ícono de nota musical, que no
// tenía relación con coaching de ventas. Un solo componente compartido entre
// el nav (chico) y la landing/login (grande) para que ambos usos queden
// siempre en sync. Borde fino en vez de relleno sólido y letras espaciadas
// para un acabado más editorial que de ícono de app.
export function Logo({ size = 32 }: LogoProps) {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        border: `1px solid rgba(217,119,6,0.55)`,
        background: "rgba(217,119,6,0.06)",
        boxShadow: `0 0 ${Math.round(size * 0.3)}px rgba(217,119,6,0.22)`,
      }}
    >
      <span
        style={{
          color: "#fbbf24",
          fontWeight: 500,
          fontSize: Math.round(size * 0.3),
          letterSpacing: Math.round(size * 0.045),
          lineHeight: 1,
          paddingLeft: Math.round(size * 0.045),
        }}
      >
        CVC
      </span>
    </div>
  )
}
