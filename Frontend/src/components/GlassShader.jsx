import React, { useEffect, useRef, useState } from 'react';

export default function GlassShader() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoverState, setHoverState] = useState(0); // target hover factor: 0 or 1
  const currentHover = useRef(0); // animated hover factor
  const mousePos = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseEnter = () => setHoverState(1);
    const handleMouseLeave = () => {
      setHoverState(0);
      mousePos.current = { x: 0.5, y: 0.5 };
    };

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height; // WebGL Y is bottom-up
      mousePos.current = { x, y };
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true });
    if (!gl) {
      // Fallback if WebGL is unsupported
      return;
    }

    // Vertex Shader Source
    const vsSource = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment Shader Source
    const fsSource = `
      precision mediump float;
      varying vec2 vUv;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_hover;

      float wave(vec2 uv, float freq, float speed) {
        return sin(uv.x * freq + u_time * speed) * cos(uv.y * freq + u_time * speed);
      }

      void main() {
        vec2 uv = vUv;
        
        // Compute wave noise
        float w1 = wave(uv, 3.5, 0.8);
        float w2 = wave(uv - vec2(0.3), 7.0, 0.5);
        float noise = (w1 + w2) * 0.5;

        // Chromatic aberration shift factor
        float shift = 0.012 * u_hover + 0.003 * sin(u_time * 1.5);
        
        // Red, Green, Blue shifted wave samples
        float r = wave(uv + vec2(shift, 0.0), 5.0, 0.7) * 0.5 + 0.5;
        float g = wave(uv + vec2(0.0, shift), 5.0, 0.7) * 0.5 + 0.5;
        float b = wave(uv - vec2(shift, shift), 5.0, 0.7) * 0.5 + 0.5;

        // Color definitions
        vec3 colBlue = vec3(0.23, 0.51, 0.96);    // #3b82f6
        vec3 colPurple = vec3(0.54, 0.36, 0.96);  // #8b5cf6
        
        // Blend colors
        vec3 col = mix(colBlue, colPurple, noise * 0.5 + 0.5);

        // Apply chromatic channels on hover
        col.r += r * 0.15 * u_hover;
        col.g += g * 0.10 * u_hover;
        col.b += b * 0.18 * u_hover;

        // Mouse glow impact
        float d = distance(uv, u_mouse);
        float glow = smoothstep(0.3, 0.0, d) * 0.22 * u_hover;
        col += vec3(glow * 0.7, glow * 0.5, glow * 1.0);

        // Edge vignetting for card container fit
        float edge = uv.x * (1.0 - uv.x) * uv.y * (1.0 - uv.y) * 16.0;
        float alpha = (0.05 + 0.1 * u_hover) * edge;

        gl_FragColor = vec4(col * alpha, alpha);
      }
    `;

    // Compile Shader helper
    const compileShader = (source, type) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    // Link Program
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Setup Buffers
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const resLoc = gl.getUniformLocation(program, 'u_resolution');
    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const mouseLoc = gl.getUniformLocation(program, 'u_mouse');
    const hoverLoc = gl.getUniformLocation(program, 'u_hover');

    let animFrameId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);
    gl.viewport(0, 0, width, height);

    const resizeObserver = new ResizeObserver(() => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      gl.viewport(0, 0, width, height);
    });
    resizeObserver.observe(canvas);

    const startTime = performance.now();
    let lastTime = startTime;

    // Render loop
    const render = (time) => {
      const elapsed = (time - startTime) * 0.001;
      const delta = (time - lastTime) * 0.001;
      lastTime = time;

      // Animate hover value smoothly (lerp)
      currentHover.current += (hoverState - currentHover.current) * 0.12;

      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Set uniforms
      gl.uniform2f(resLoc, width, height);
      gl.uniform1f(timeLoc, elapsed);
      gl.uniform2f(mouseLoc, mousePos.current.x, mousePos.current.y);
      gl.uniform1f(hoverLoc, currentHover.current);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
    };
  }, [hoverState]);

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none' // allow clicks to pass through to card content
      }}
    >
      <canvas 
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </div>
  );
}
