import { useEffect, useRef } from "react"
import * as THREE from "three"

// ── Vertex shader: full-screen quad, no transform needed ─────────────────────
const VERT = /* glsl */`
void main() {
  gl_Position = vec4(position, 1.0);
}
`

// ── Fragment shader: animated waves + chromatic distortion, purple/indigo ─────
const FRAG = /* glsl */`
precision mediump float;

uniform float uTime;
uniform vec2  uResolution;

// Value noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i),               hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x),
    u.y
  );
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  // correct for aspect ratio
  uv.x *= uResolution.x / uResolution.y;

  float t = uTime * 0.28;

  // ── Chromatic aberration offsets per channel ──────────────────────────────
  vec2 uvR = uv + vec2(sin(t       + uv.y * 3.1) * 0.009, cos(t * 0.7)       * 0.006);
  vec2 uvG = uv + vec2(cos(t * 0.8 + uv.x * 2.4) * 0.005, sin(t + 0.7)       * 0.007);
  vec2 uvB = uv + vec2(sin(t * 1.1 + uv.y * 4.2) * 0.007, cos(t * 0.95)      * 0.008);

  // ── Wave layers ───────────────────────────────────────────────────────────
  float wR = sin(uvR.x * 5.2 + t * 1.3 + uvR.y * 2.8)  * 0.5 + 0.5;
  float wG = sin(uvG.y * 4.1 + t * 0.9 + uvG.x * 3.3)  * 0.5 + 0.5;
  float wB = sin((uvB.x + uvB.y) * 5.8 - t * 0.75)      * 0.5 + 0.5;
  float wN = vnoise(uv * 2.8 + t * 0.18);

  // ── Color palette ─────────────────────────────────────────────────────────
  vec3 base   = vec3(0.027, 0.020, 0.055);  // #07050e
  vec3 purp   = vec3(0.486, 0.227, 0.929);  // #7c3aed
  vec3 indig  = vec3(0.310, 0.275, 0.898);  // #4f46e5
  vec3 violet = vec3(0.545, 0.361, 0.965);  // #8b5cf6
  vec3 fuchsia= vec3(0.600, 0.180, 0.700);  // deep pink-purple

  vec3 col = base;
  col = mix(col, purp,    wR * 0.38);
  col = mix(col, indig,   wG * 0.28);
  col = mix(col, violet,  wB * 0.32);
  col = mix(col, fuchsia, wN * 0.18);

  // ── Radial vignette: darker center so card is legible ────────────────────
  vec2 vc = gl_FragCoord.xy / uResolution.xy - 0.5;
  float vig = 1.0 - dot(vc, vc) * 2.2;
  col *= clamp(vig, 0.0, 1.0);

  gl_FragColor = vec4(col, 1.0);
}
`

export function WebGLShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

    const scene    = new THREE.Scene()
    const camera   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geometry = new THREE.PlaneGeometry(2, 2)
    const uniforms = {
      uTime:       { value: 0 },
      uResolution: { value: new THREE.Vector2() },
    }
    const material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms })
    scene.add(new THREE.Mesh(geometry, material))

    function resize() {
      const w = window.innerWidth
      const h = window.innerHeight
      renderer.setSize(w, h)
      uniforms.uResolution.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio())
    }
    resize()
    window.addEventListener("resize", resize)

    const clock = new THREE.Clock()
    let raf: number
    function tick() {
      raf = requestAnimationFrame(tick)
      uniforms.uTime.value = clock.getElapsedTime()
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        display: "block",
      }}
    />
  )
}
