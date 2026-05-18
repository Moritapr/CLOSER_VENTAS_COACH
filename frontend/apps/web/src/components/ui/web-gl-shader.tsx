import { useEffect, useRef } from "react"
import * as THREE from "three"

const VERT = /* glsl */`
void main() {
  gl_Position = vec4(position, 1.0);
}
`

const FRAG = /* glsl */`
precision mediump float;

uniform float uTime;
uniform vec2  uResolution;

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
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float aspect = uResolution.x / uResolution.y;
  vec2 uvA = vec2(uv.x * aspect, uv.y);

  float t = uTime * 0.30;

  /* Per-channel chromatic offsets */
  vec2 uvR = uvA + vec2(sin(t        + uvA.y * 3.2) * 0.012, cos(t * 0.7)        * 0.008);
  vec2 uvG = uvA + vec2(cos(t * 0.8  + uvA.x * 2.6) * 0.008, sin(t + 0.8)        * 0.010);
  vec2 uvB = uvA + vec2(sin(t * 1.1  + uvA.y * 4.0) * 0.010, cos(t * 0.95)       * 0.009);

  /* Wave layers */
  float wR = sin(uvR.x * 4.8 + t * 1.4 + uvR.y * 2.6) * 0.5 + 0.5;
  float wG = sin(uvG.y * 3.8 + t * 1.0 + uvG.x * 3.1) * 0.5 + 0.5;
  float wB = sin((uvB.x + uvB.y) * 5.5 - t * 0.8)      * 0.5 + 0.5;
  float wN = vnoise(uvA * 2.5 + t * 0.20);

  /* Purple / indigo palette — bright enough to see over dark body */
  vec3 base   = vec3(0.06,  0.03,  0.14);   /* deep purple-black      */
  vec3 purp   = vec3(0.60,  0.22,  1.00);   /* #9938ff vivid purple   */
  vec3 indig  = vec3(0.35,  0.28,  1.00);   /* #5a47ff vivid indigo   */
  vec3 violet = vec3(0.70,  0.40,  1.00);   /* #b366ff bright violet  */
  vec3 rose   = vec3(0.72,  0.18,  0.82);   /* deep pink-purple       */

  vec3 col = base;
  col = mix(col, purp,   wR * 0.55);
  col = mix(col, indig,  wG * 0.40);
  col = mix(col, violet, wB * 0.45);
  col = mix(col, rose,   wN * 0.22);

  /* Light vignette — only darkens extreme corners, NOT center */
  vec2 vc = uv - 0.5;
  float vig = 1.0 - dot(vc, vc) * 1.2;
  col *= clamp(vig, 0.3, 1.0);   /* clamp min 0.3 so center stays vivid */

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
      uTime:       { value: 0 },
      uResolution: { value: new THREE.Vector2() },
    }
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
    })
    scene.add(new THREE.Mesh(geometry, material))

    function resize() {
      const w = window.innerWidth
      const h = window.innerHeight
      // setSize also updates canvas.style.width/height to CSS px values
      renderer.setSize(w, h)
      // Resolution in actual framebuffer pixels (device pixels)
      uniforms.uResolution.value.set(
        w * renderer.getPixelRatio(),
        h * renderer.getPixelRatio(),
      )
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
    // Wrapper div is position:fixed — unaffected by any parent stacking context.
    // Canvas fills wrapper 100%. Three.js setSize() also sets canvas style px,
    // which is fine because the wrapper constrains layout.
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  )
}
