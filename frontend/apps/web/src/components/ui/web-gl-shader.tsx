import { useEffect, useRef } from "react"

const VERT = /* glsl */`
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
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
    mix(hash(i),            hash(i + vec2(1,0)), u.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
    u.y);
}

void main() {
  vec2 uv  = gl_FragCoord.xy / uResolution.xy;
  float aspect = uResolution.x / uResolution.y;
  vec2 uvA = vec2(uv.x * aspect, uv.y);

  float t = uTime * 0.30;

  vec2 uvR = uvA + vec2(sin(t        + uvA.y * 3.2) * 0.012, cos(t * 0.70)  * 0.008);
  vec2 uvG = uvA + vec2(cos(t * 0.8  + uvA.x * 2.6) * 0.008, sin(t + 0.80)  * 0.010);
  vec2 uvB = uvA + vec2(sin(t * 1.1  + uvA.y * 4.0) * 0.010, cos(t * 0.95)  * 0.009);

  float wR = sin(uvR.x * 4.8 + t * 1.4 + uvR.y * 2.6) * 0.5 + 0.5;
  float wG = sin(uvG.y * 3.8 + t * 1.0 + uvG.x * 3.1) * 0.5 + 0.5;
  float wB = sin((uvB.x + uvB.y) * 5.5  - t * 0.8)     * 0.5 + 0.5;
  float wN = vnoise(uvA * 2.5 + t * 0.20);

  vec3 base   = vec3(0.06, 0.03, 0.14);
  vec3 purp   = vec3(0.60, 0.22, 1.00);
  vec3 indig  = vec3(0.35, 0.28, 1.00);
  vec3 violet = vec3(0.70, 0.40, 1.00);
  vec3 rose   = vec3(0.72, 0.18, 0.82);

  vec3 col = base;
  col = mix(col, purp,   wR * 0.55);
  col = mix(col, indig,  wG * 0.40);
  col = mix(col, violet, wB * 0.45);
  col = mix(col, rose,   wN * 0.22);

  vec2 vc  = uv - 0.5;
  float vig = 1.0 - dot(vc, vc) * 1.2;
  col *= clamp(vig, 0.3, 1.0);

  gl_FragColor = vec4(col, 1.0);
}
`

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("[WebGLShader]", gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export function WebGLShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const glOrNull = canvas.getContext("webgl")
    if (!glOrNull) { console.error("[WebGLShader] WebGL not supported"); return }
    const gl = glOrNull  // non-nullable from here; preserves type inside closures

    const vert = compileShader(gl, gl.VERTEX_SHADER,   VERT)
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vert || !frag) return

    const program = gl.createProgram()!
    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("[WebGLShader] Link error:", gl.getProgramInfoLog(program))
      return
    }
    gl.useProgram(program)

    // Full-screen quad (two triangles)
    const buf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,   1, -1,  -1,  1,
      -1,  1,   1, -1,   1,  1,
    ]), gl.STATIC_DRAW)

    const posLoc = gl.getAttribLocation(program, "a_position")
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    const uTimeLoc = gl.getUniformLocation(program, "uTime")
    const uResLoc  = gl.getUniformLocation(program, "uResolution")

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 1.5)
      canvas.width  = window.innerWidth  * dpr
      canvas.height = window.innerHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uResLoc, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener("resize", resize)

    let raf: number
    function tick() {
      gl.uniform1f(uTimeLoc, performance.now() / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      gl.deleteBuffer(buf)
      gl.deleteShader(vert)
      gl.deleteShader(frag)
      gl.deleteProgram(program)
    }
  }, [])

  return (
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
