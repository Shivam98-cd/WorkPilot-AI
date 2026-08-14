/**
 * Global Particle System Configuration
 * 
 * Customize particle behavior, colors, and interactions here.
 * Changes to this file will affect the entire homepage particle system.
 */

export const ParticleConfig = {
  // Particle count settings
  density: {
    min: 60,           // Minimum number of particles
    max: 120,          // Maximum number of particles
    areaMultiplier: 35000  // Pixels per particle (higher = fewer particles)
  },

  // Particle physics
  physics: {
    baseSpeed: 1.2,        // Base velocity (0.1 - 2.0)
    maxSpeed: 1.5,         // Maximum speed particles can reach
    damping: 0.98,         // Speed decay factor (0.9 - 0.99)
    mouseRadius: 150,      // Mouse interaction radius
    mouseForce: 0.05       // Strength of mouse attraction
  },

  // Visual properties
  visual: {
    minSize: 1,            // Minimum particle radius
    maxSize: 3,            // Maximum particle radius
    minOpacity: 0.1,       // Minimum opacity
    maxOpacity: 0.3,       // Maximum opacity
    glowIntensity: 3,      // Shadow blur radius
    connectionDistance: 120, // Max distance for particle connections
    connectionOpacity: 0.3, // Opacity of connection lines
    pulseSpeed: 0.02       // Speed of pulsing animation
  },

  // Section-specific color themes
  sectionThemes: {
    hero: {
      color: 'rgba(59, 130, 246, 0.4)',     // Blue
      glow: '59, 130, 246',
      name: 'Hero Section'
    },
    features: {
      color: 'rgba(139, 92, 246, 0.35)',    // Purple
      glow: '139, 92, 246',
      name: 'Features'
    },
    howItWorks: {
      color: 'rgba(139, 92, 246, 0.35)',    // Purple
      glow: '139, 92, 246',
      name: 'How It Works'
    },
    automation: {
      color: 'rgba(245, 158, 11, 0.35)',    // Amber
      glow: '245, 158, 11',
      name: 'Automation'
    },
    demo: {
      color: 'rgba(59, 130, 246, 0.35)',    // Blue
      glow: '59, 130, 246',
      name: 'Live Demo'
    },
    unique: {
      color: 'rgba(236, 72, 153, 0.35)',    // Pink
      glow: '236, 72, 153',
      name: 'Unique Features'
    },
    integrations: {
      color: 'rgba(16, 185, 129, 0.35)',    // Green
      glow: '16, 185, 129',
      name: 'Integrations'
    },
    stats: {
      color: 'rgba(59, 130, 246, 0.35)',    // Blue
      glow: '59, 130, 246',
      name: 'Stats'
    },
    roi: {
      color: 'rgba(245, 158, 11, 0.35)',    // Amber
      glow: '245, 158, 11',
      name: 'ROI Calculator'
    },
    comparison: {
      color: 'rgba(139, 92, 246, 0.35)',    // Purple
      glow: '139, 92, 246',
      name: 'Comparison'
    },
    cta: {
      color: 'rgba(236, 72, 153, 0.35)',    // Pink
      glow: '236, 72, 153',
      name: 'CTA'
    },
    footer: {
      color: 'rgba(59, 130, 246, 0.3)',     // Blue (dimmer)
      glow: '59, 130, 246',
      name: 'Footer'
    }
  },

  // Section scroll positions (approximate - adjust based on actual layout)
  // Set to 'auto' to calculate dynamically based on section elements
  sectionPositions: 'auto', // or provide manual mapping like below:
  /*
  sectionPositions: {
    hero: { start: 0, end: 900 },
    features: { start: 900, end: 1700 },
    howItWorks: { start: 1700, end: 2500 },
    automation: { start: 2500, end: 3500 },
    demo: { start: 3500, end: 4300 },
    unique: { start: 4300, end: 5200 },
    integrations: { start: 5200, end: 6000 },
    stats: { start: 6000, end: 6600 },
    roi: { start: 6600, end: 7400 },
    comparison: { start: 7400, end: 8200 },
    cta: { start: 8200, end: 9000 },
    footer: { start: 9000, end: Infinity }
  }
  */

  // Performance settings
  performance: {
    enableOnMobile: true,   // Show particles on mobile devices
    reducedMotionRespect: true, // Respect prefers-reduced-motion
    pauseWhenHidden: true,  // Pause animation when tab is hidden
    updateCanvasOnScroll: true // Dynamically update canvas height
  },

  // Advanced effects
  effects: {
    enableConnections: false,    // Draw lines between nearby particles
    enableMouseInteraction: true, // Particles react to mouse
    enablePulse: true,          // Pulsing size animation
    enableGlow: true,           // Glow effect around particles
    blendMode: 'normal'         // CSS mix-blend-mode ('screen', 'normal', 'lighten')
  }
};

export default ParticleConfig;
