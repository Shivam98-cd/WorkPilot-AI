import React, { useEffect, useRef } from 'react';

export default function CursorSparks() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];

    // Track mouse movement
    const handleMouseMove = (e) => {
      // Spawn 2 particles per mousemove event for optimal density
      for (let i = 0; i < 2; i++) {
        particles.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 2.2,
          vy: (Math.random() - 0.5) * 2.2 - 0.8, // slight upward boost
          radius: Math.random() * 2.5 + 1.2,
          alpha: 1.0,
          colorIdx: Math.random() // blue to purple blend
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Active state tracker (visible/hidden tab check)
    let isTabVisible = true;
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Physics constants
    const gravity = 0.05;
    const friction = 0.98;

    // Render loop
    const render = () => {
      if (!isTabVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Render & Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vx *= friction;
        p.vy *= friction;
        p.vy += gravity; // pull down
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.022; // fade out
        p.radius -= 0.035; // shrink

        if (p.alpha <= 0 || p.radius <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Draw spark with glow
        const red = Math.floor(59 + (139 - 59) * p.colorIdx);
        const green = Math.floor(130 + (92 - 130) * p.colorIdx);
        const blue = Math.floor(246 + (246 - 246) * p.colorIdx);

        ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
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
        zIndex: 9999,
        pointerEvents: 'none',
        display: 'block'
      }}
    />
  );
}
