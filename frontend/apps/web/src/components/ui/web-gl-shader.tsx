import { useEffect, useRef } from "react"
import * as THREE from "three"

const VERT = /* glsl */`
void main() {
  gl_Position = vec4(position, 1.0);
}
`

const FRAG = /* glsl */`
precision mediump float;

uniform float time;
uniform vec2  resolution;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float vnoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1,0)), u.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float aspect = resolution.x / resolution.y;
  vec2 uvA = vec2(uv.x * aspect, uv.y);

  float t = time;

  vec2 uvR = uvA + vec2(sin(t        + uvA.y * 3.2) * 0.012, cos(t * 0.7)  * 0.008);
  vec2 uvG = uvA + vec2(cos(t * 0.8  + uvA.x * 2.6) * 0.008, sin(t + 0.8)  * 0.010);
  vec2 uvB = uvA + vec2(sin(t * 1.1  + uvA.y * 4.0) * 0.010, cos(t * 0.95) * 0.009);

  float wR = sin(uvR.x * 4.8 + t * 1.4 + uvR.y * 2.6) * 0.5 + 0.5;
  float wG = sin(uvG.y * 3.8 + t * 1.0 + uvG.x * 3.1) * 0.5 + 0.5;
  float wB = sin((uvB.x + uvB.y) * 5.5  - t * 0.8)    * 0.5 + 0.5;
  float wN = vnoise(uvA * 2.5 + t * 0.20);

  /* Combine wave layers into one driving value */
  float wave = clamp((wR * 0.55 + wG * 0.40 + wB * 0.45 + wN * 0.22) * 0.55, 0.0, 1.0);

  /* Purple / indigo palette: r=0.3*wave, g=0.1*wave, b=1.0*wave */
  vec3 base = vec3(0.06, 0.03, 0.14);
  vec3 col  = base + vec3(0.3 * wave, 0.1 * wave, 1.0 * wave);

  /* Light vignette */
  vec2 vc  = uv - 0.5;
  float vig = 1.0 - dot(vc, vc) * 1.2;
  col *= clamp(vig, 0.3, 1.0);

  gl_FragColor = vec4(col, 1.0);
}
`

export function WebGLShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false })
    } catch (e) {
      console.error("[WebGLShader] WebGL init failed:", e)
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

    const scene    = new THREE.Scene()
    const camera   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geometry = new THREE.PlaneGeometry(2, 2)
    const uniforms = {
      time:       { value: 0 },
      resolution: { value: new THREE.Vector2() },
    }
    const material = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      uniforms,
    })
    scene.add(new THREE.Mesh(geometry, material))

    function resize() {
      const w = window.innerWidth
      const h = window.innerHeight
      renderer.setSize(w, h)
      uniforms.resolution.value.set(
        w * renderer.getPixelRatio(),
        h * renderer.getPixelRatio(),
      )
    }
    resize()
    window.addEventListener("resize", resize)

    let raf: number
    function tick() {
      raf = requestAnimationFrame(tick)
      uniforms.time.value += 0.01
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
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        display: "block",
        pointerEvents: "none",
      }}
    />
  )
}
