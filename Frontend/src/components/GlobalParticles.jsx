import React, { useEffect, useRef } from 'react';
import ParticleConfig from './ParticleConfig';

export default function GlobalParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check reduced motion preference
    if (ParticleConfig.performance.reducedMotionRespect && 
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Check if on mobile and particles are disabled
    if (!ParticleConfig.performance.enableOnMobile && window.innerWidth < 768) {
      return;
    }

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = document.documentElement.scrollHeight;

    // Mouse tracking
    let mouse = { 
      x: null, 
      y: null, 
      radius: ParticleConfig.physics.mouseRadius 
    };

    // Particle system
    const particles = [];
    const { min, max, areaMultiplier } = ParticleConfig.density;
    const particleCount = Math.min(max, Math.max(min, Math.floor((width * height) / areaMultiplier)));
    
    // Get section themes from config
    const sectionThemes = ParticleConfig.sectionThemes;

    class Particle {
      constructor() {
        this.reset();
        // Start at random position
        this.x = Math.random() * width;
        this.y = Math.random() * height;
      }

      reset() {
        const { baseSpeed } = ParticleConfig.physics;
        const { minSize, maxSize, minOpacity, maxOpacity, pulseSpeed } = ParticleConfig.visual;

        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * baseSpeed;
        this.vy = (Math.random() - 0.5) * baseSpeed;
        this.radius = Math.random() * (maxSize - minSize) + minSize;
        this.opacity = Math.random() * (maxOpacity - minOpacity) + minOpacity;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = pulseSpeed + Math.random() * pulseSpeed;
      }

      draw(theme, scrollY) {
        const { enablePulse, enableGlow } = ParticleConfig.effects;
        const { glowIntensity } = ParticleConfig.visual;

        // Pulsing effect
        if (enablePulse) {
          this.pulse += this.pulseSpeed;
        }
        const pulseSize = this.radius + (enablePulse ? Math.sin(this.pulse) * 0.5 : 0);
        const pulseOpacity = this.opacity + (enablePulse ? Math.sin(this.pulse) * 0.15 : 0);

        // Draw particle with optional glow
        if (enableGlow) {
          ctx.shadowBlur = glowIntensity;
          ctx.shadowColor = `rgba(${theme.glow}, ${pulseOpacity * 0.6})`;
        }
        ctx.fillStyle = theme.color.replace(/[\d.]+\)/, `${pulseOpacity})`);
        ctx.beginPath();
        ctx.arc(this.x, this.y - scrollY, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        if (enableGlow) {
          ctx.shadowBlur = 0;
        }
      }

      update(scrollY) {
        const { maxSpeed, damping, mouseForce } = ParticleConfig.physics;
        const { enableMouseInteraction } = ParticleConfig.effects;

        // Floating movement
        this.x += this.vx;
        this.y += this.vy;

        // Mouse interaction
        if (enableMouseInteraction && mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = (mouse.y + scrollY) - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < mouse.radius) {
            const force = (mouse.radius - distance) / mouse.radius;
            const angle = Math.atan2(dy, dx);
            this.vx += Math.cos(angle) * force * mouseForce;
            this.vy += Math.sin(angle) * force * mouseForce;
          }
        }

        // Damping
        this.vx *= damping;
        this.vy *= damping;

        // Keep velocity in bounds
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
          this.vx = (this.vx / speed) * maxSpeed;
          this.vy = (this.vy / speed) * maxSpeed;
        }

        // Boundary wrap
        if (this.x < -10) this.x = width + 10;
        if (this.x > width + 10) this.x = -10;
        if (this.y < -10) this.y = height + 10;
        if (this.y > height + 10) this.y = -10;
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Get current section theme based on scroll position
    function getSectionTheme(scrollY) {
      // Auto-detect sections by element IDs
      if (ParticleConfig.sectionPositions === 'auto') {
        const sectionIds = ['hero', 'features', 'how-it-works', 'rag', 'demo', 'unique-features', 
                            'integrations', 'stats', 'roi', 'comparison', 'cta'];
        
        for (const id of sectionIds) {
          const element = document.getElementById(id);
          if (element) {
            const rect = element.getBoundingClientRect();
            const elementTop = rect.top + scrollY;
            const elementBottom = elementTop + rect.height;
            
            if (scrollY >= elementTop && scrollY < elementBottom) {
              const themeKey = id.replace('-', '');
              return sectionThemes[themeKey === 'howitworks' ? 'howItWorks' : 
                                   themeKey === 'rag' ? 'automation' :
                                   themeKey === 'uniquefeatures' ? 'unique' : themeKey] || sectionThemes.hero;
            }
          }
        }
      } else {
        // Use manual positions
        const sections = ParticleConfig.sectionPositions;
        for (const [key, range] of Object.entries(sections)) {
          if (scrollY >= range.start && scrollY < range.end) {
            return sectionThemes[key];
          }
        }
      }
      
      return sectionThemes.hero;
    }

    // Draw connections between nearby particles
    function drawConnections(scrollY, theme) {
      if (!ParticleConfig.effects.enableConnections) return;

      const { connectionDistance, connectionOpacity } = ParticleConfig.visual;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * connectionOpacity;
            ctx.strokeStyle = theme.color.replace(/[\d.]+\)/, `${opacity})`);
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y - scrollY);
            ctx.lineTo(particles[j].x, particles[j].y - scrollY);
            ctx.stroke();
          }
        }
      }
    }

    // Render loop
    let isTabVisible = true;
    function render() {
      if (!isTabVisible && ParticleConfig.performance.pauseWhenHidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const scrollY = window.scrollY || window.pageYOffset;
      const theme = getSectionTheme(scrollY);

      ctx.clearRect(0, 0, width, height);

      // Update and draw particles
      particles.forEach(particle => {
        particle.update(scrollY);
        particle.draw(theme, scrollY);
      });

      // Draw connections
      drawConnections(scrollY, theme);

      animationFrameId = requestAnimationFrame(render);
    }

    // Event listeners
    const handleMouseMove = (e) => {
      if (ParticleConfig.effects.enableMouseInteraction) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = document.documentElement.scrollHeight;
      
      // Adjust particle count
      const newCount = Math.min(max, Math.max(min, Math.floor((width * height) / areaMultiplier)));
      while (particles.length < newCount) {
        particles.push(new Particle());
      }
      while (particles.length > newCount) {
        particles.pop();
      }
    };

    const handleScroll = () => {
      if (ParticleConfig.performance.updateCanvasOnScroll) {
        const newHeight = document.documentElement.scrollHeight;
        if (Math.abs(newHeight - height) > 100) {
          height = canvas.height = newHeight;
        }
      }
    };

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start animation
    render();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
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
        width: '100%',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1,
        mixBlendMode: ParticleConfig.effects.blendMode
      }}
    />
  );
}
