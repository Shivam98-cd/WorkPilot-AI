import React, { useEffect, useRef } from 'react';

export default function UnifiedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const pulses = [];
    let lastPulseTime = 0;

    // Track mouse movement to spawn periodic ripple pulses
    const handleMouseMove = (e) => {
      const now = performance.now();
      // Throttle pulse creation to 1 pulse per 450ms for performance and clean visuals
      if (now - lastPulseTime > 450) {
        pulses.push({
          x: e.clientX,
          y: e.clientY,
          radius: 0,
          maxRadius: 260,
          speed: 4.2,
          alpha: 1.0
        });
        lastPulseTime = now;
      }
    };

    // Spawn a pulse on click anywhere on the page
    const handleGlobalClick = (e) => {
      pulses.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 350, // larger pulse on click
        speed: 5.5,
        alpha: 1.0
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('click', handleGlobalClick, { passive: true });

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let isTabVisible = true;
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const gridSpacing = 28; // spacing between grid dots

    // Render loop
    const render = () => {
      if (!isTabVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Update active pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        pulse.radius += pulse.speed;
        pulse.alpha = 1 - (pulse.radius / pulse.maxRadius);

        if (pulse.radius >= pulse.maxRadius) {
          pulses.splice(i, 1);
        }
      }

      // 2. Render Dot Grid
      ctx.fillStyle = '#ffffff';

      const cols = Math.ceil(width / gridSpacing);
      const rows = Math.ceil(height / gridSpacing);

      for (let c = 0; c < cols; c++) {
        const x = c * gridSpacing;
        for (let r = 0; r < rows; r++) {
          const y = r * gridSpacing;
          
          let alpha = 0.05; // base dim opacity
          let radius = 1.0;

          // Calculate pulse ripple highlights
          pulses.forEach((pulse) => {
            const dx = x - pulse.x;
            const dy = y - pulse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const diff = Math.abs(dist - pulse.radius);
            const waveWidth = 45; // width of the pulse ring

            if (diff < waveWidth) {
              const intensity = (1 - diff / waveWidth) * 0.18 * pulse.alpha;
              alpha += intensity;
              radius += intensity * 1.5; // dot grows slightly in pulse ring
            }
          });

          // Render dot
          if (alpha > 0.05) {
            ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`; // purple glow pulse
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`; // neutral dim grey
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1, // behind all contents
        pointerEvents: 'none',
        display: 'block'
      }}
    />
  );
}
