# WorkPilot AI — Problems Found
> Last updated: 2026-08-01 | Severity Scale: Low / Medium / High / Critical

---

## Problem #01

**File:** `components/Hero.jsx`  
**Component:** `Hero`  
**Description:** O(n²) particle edge-drawing inside the main rAF loop — for every orb particle (280), it iterates ALL other particles to check distance. That is **78,400 distance checks per frame** at 60fps = 4.7M calculations/second.  
**Root Cause:** `orbParticles.forEach((p) => { orbParticles.forEach((other) => { ... }) })` nested loop with no spatial partitioning.  
**Severity:** 🔴 Critical  
**Performance Impact:** ~8–15ms of JS execution per frame. Causes jank, dropped frames, and CPU thermal throttling on mid-range devices.  
**User Impact:** Visible stutter on the hero section, especially on scroll. Significant battery drain on mobile.  
**Estimated Improvement Potential:** 70% CPU reduction by switching to spatial grid or reducing connection radius.

---

## Problem #02

**File:** `components/Hero.jsx`  
**Component:** `Hero`  
**Description:** Three simultaneous `setInterval`/`setTimeout` typewriter effects causing continuous React re-renders every 45–80ms. Each re-render invalidates the Hero subtree including SaaSDashboard.  
**Root Cause:** `typedTitle`, `typedTagline`, `typedCommand` are all `useState`, triggering re-renders. No `memo` wrapping on child components.  
**Severity:** 🟠 High  
**Performance Impact:** ~3 extra renders/second × 3 timers = 9+ Hero re-renders/second during animation phase (first ~5s). Cascades to SaaSDashboard.  
**User Impact:** Potential jitter in dashboard card during hero typewriter phase.  
**Estimated Improvement Potential:** 60% render reduction using CSS-only typewriter or `useRef` for DOM manipulation.

---

## Problem #03

**File:** `components/GlassShader.jsx` (used in `FeaturesGrid.jsx`)  
**Component:** `GlassShader` × 6 instances  
**Description:** 6 separate WebGL contexts with individual rAF loops, each running a custom GLSL fragment shader continuously — even when cards are off-screen.  
**Root Cause:** Each `GlassShader` in a feature card creates a `canvas.getContext('webgl')` and runs `requestAnimationFrame` indefinitely. No IntersectionObserver pause.  
**Severity:** 🔴 Critical  
**Performance Impact:** 6 WebGL rAF loops = 6 × 60fps GPU draw calls. GPU overdraw across the entire features section. Most browsers cap WebGL contexts at 8–16; this consumes 6 per page load.  
**User Impact:** GPU memory pressure, browser tab slowdown, potential WebGL context loss on integrated GPUs.  
**Estimated Improvement Potential:** 90% GPU load reduction — pause rAF when not in viewport, reduce to 1 shared WebGL canvas, or replace with CSS gradient on hover.

---

## Problem #04

**File:** `components/UnifiedBackground.jsx`  
**Component:** `UnifiedBackground`  
**Description:** Full-screen dot-grid canvas redraws the ENTIRE viewport (cols × rows dots) every frame at 60fps, even with no mouse activity. On a 1920×1080 screen: (1920/28) × (1080/28) = 68 × 38 = **2,584 arc draw calls per frame**.  
**Root Cause:** `ctx.clearRect()` + full grid re-render every rAF tick with no dirty-rect optimization. Pulse detection loop also runs even with 0 active pulses.  
**Severity:** 🟠 High  
**Performance Impact:** ~2–4ms/frame baseline overhead from background canvas alone, permanently.  
**User Impact:** Persistent background CPU usage even on idle pages.  
**Estimated Improvement Potential:** 80% reduction by using CSS dot-grid background-image and only animating the canvas layer when pulses are active.

---

## Problem #05

**File:** `components/SaaSDashboard.jsx`  
**Component:** `SaaSDashboard`  
**Description:** 4 timers running simultaneously — `setInterval` for bars (1500ms), cpu (1000ms), logs (2000ms), plus a continuous `requestAnimationFrame` tilt loop. The rAF loop runs even when mouse is static and no tilt is needed.  
**Root Cause:** rAF loop for lerp tilt starts on mount and never pauses. It also re-creates itself on every `rotation` + `isHovered` state change due to `useEffect([rotation, isHovered])` dependency.  
**Severity:** 🟠 High  
**Performance Impact:** rAF loop + 3 intervals = persistent CPU/GPU usage for the entire page session.  
**User Impact:** Battery drain on laptops/mobile. Unnecessary renders every 1–2 seconds.  
**Estimated Improvement Potential:** 50% reduction by using CSS transitions for tilt and pausing intervals when off-screen.

---

## Problem #06

**File:** `App.jsx` (inferred) + all homepage components  
**Component:** All homepage sections  
**Description:** No lazy loading or code splitting. All 25 components (including Dashboard.jsx 60.9 KB, Pages.jsx 71.2 KB, AICockpit.jsx 49.1 KB, AuthModal.jsx 33.2 KB) are eagerly imported and bundled into a single JS chunk of 585 KB.  
**Root Cause:** No `React.lazy()`, no `dynamic import()`, no Vite manual chunk configuration. All imports are static at module top level.  
**Severity:** 🟠 High  
**Performance Impact:** 585 KB JS parse + execute on initial page load. Dashboard and cockpit code loaded even for non-authenticated users on the landing page.  
**User Impact:** Slow Time to Interactive (TTI) especially on mobile/3G connections. First paint blocked by large JS bundle.  
**Estimated Improvement Potential:** 40–50% bundle reduction for landing page visitors by lazy-loading Dashboard, Pages, AICockpit, AuthModal.

---

## Problem #07

**File:** `components/Hero.jsx`  
**Component:** `Hero` (canvas render loop)  
**Description:** `orbParticles.sort((a, b) => b.z3d - a.z3d)` is called **every animation frame** — sorting 280 particles at 60fps = 16,800 sorts/second.  
**Root Cause:** Z-sort for painter's algorithm is done inside the hot render loop without any optimization.  
**Severity:** 🟡 Medium  
**Performance Impact:** Array sort is O(n log n) — 280 × log(280) × 60 ≈ ~125,000 comparisons/second.  
**User Impact:** Contributes to frame budget pressure.  
**Estimated Improvement Potential:** 30% by using insertion sort (nearly sorted array) or reducing sort frequency to every 3rd frame.

---

## Problem #08

**File:** `components/Navbar.jsx`  
**Component:** `Navbar`  
**Description:** Scroll event listener sets React state (`setIsScrolled`) synchronously on every scroll tick — no throttling or debouncing.  
**Root Cause:** `window.addEventListener('scroll', handleScroll, { passive: true })` — passive listener is correct, but `setIsScrolled` fires on every pixel of scroll.  
**Severity:** 🟡 Medium  
**Performance Impact:** Scroll at 60fps can trigger 60 setState calls/second during scroll. React 19 batches these, but still causes unnecessary re-renders.  
**User Impact:** Slight scroll jitter on low-end devices.  
**Estimated Improvement Potential:** 80% reduction with a simple threshold check (already partially done — checks `> 20`, but still fires on every event).

---

## Problem #09

**File:** `components/FeaturesGrid.jsx`  
**Component:** `FeaturesGrid`  
**Description:** Feature cards use `index` as React `key` instead of stable IDs. Additionally, hover event dispatches `CustomEvent` globally via `window.dispatchEvent()` on every `mouseenter`/`mouseleave` — no debounce.  
**Root Cause:** `features.map((feat, index) => <div key={index} ...>)`. Event dispatch on every hover.  
**Severity:** 🟡 Medium  
**Performance Impact:** Key instability can cause React to unmount/remount GlassShader WebGL canvases on re-render. Global event bus adds overhead.  
**User Impact:** Potential WebGL context recreation on re-render.  
**Estimated Improvement Potential:** 20% by using stable string keys.

---

## Problem #10

**File:** `components/Hero.jsx` + `components/UnifiedBackground.jsx` + `components/CursorSparks.jsx`  
**Component:** Multiple  
**Description:** Three separate full-viewport canvases (`position: fixed/absolute` covering 100vw × 100vh) render simultaneously — Hero canvas, UnifiedBackground canvas, CursorSparks canvas. This creates 3 layers of GPU compositing.  
**Root Cause:** Each canvas is a separate DOM element requiring its own layer promotion and composite pass.  
**Severity:** 🟡 Medium  
**Performance Impact:** GPU layer count: minimum 5 (3 canvases + content + fixed nav). Compositor thread pressure on integrated graphics.  
**User Impact:** Potential frame drops during scroll on mobile and integrated GPU laptops.  
**Estimated Improvement Potential:** 40% by merging UnifiedBackground + CursorSparks into a single canvas context.

---

## Problem #11

**File:** All components  
**Component:** Global  
**Description:** CSS injected via `<style>{`...`}</style>` JSX inside render functions in Navbar, Hero, SaaSDashboard, FeaturesGrid. This injects a new `<style>` tag into the DOM on every render.  
**Root Cause:** Inline `<style>` tags in JSX render functions.  
**Severity:** 🟡 Medium  
**Performance Impact:** Style recalculation triggered on each render. Browser must re-parse inline style content.  
**User Impact:** Potential CLS (Cumulative Layout Shift) if styles are applied after initial paint.  
**Estimated Improvement Potential:** 30% CSSOM stability by moving all styles to `index.css`.

---

## Problem #12

**File:** `components/GlassShader.jsx`  
**Component:** `GlassShader`  
**Description:** `hoverState` React state triggers WebGL `useEffect([hoverState])` recreation — the entire rAF render loop is cancelled and restarted on every hover enter/leave.  
**Root Cause:** `useEffect(() => { ... animFrameId = requestAnimationFrame(render); return () => cancelAnimationFrame(animFrameId); }, [hoverState])` — effect dependency on state causes teardown/setup.  
**Severity:** 🟡 Medium  
**Performance Impact:** On every hover, 6 WebGL loops restart. Brief frame gap visible during teardown.  
**User Impact:** Subtle visual flicker on card hover.  
**Estimated Improvement Potential:** Fix by using `useRef` for hoverState inside the render loop instead of effect dependency.

---

## Problem #13

**File:** `components/Hero.jsx`  
**Component:** `Hero`  
**Description:** Canvas reads `canvas.getAttribute('data-shape')` on every single animation frame inside the hot render loop — a DOM attribute read inside rAF.  
**Root Cause:** `const activeShapeRef = canvas.getAttribute('data-shape') || 'sphere'` inside `render()` called 60x/second.  
**Severity:** 🟡 Medium  
**Performance Impact:** DOM access in hot path forces layout boundary — ~0.1ms per frame.  
**User Impact:** Minor but measurable frame time increase.  
**Estimated Improvement Potential:** Use a `useRef` variable instead of DOM attribute to store shape state.

---

## Problem #14

**File:** `index.css`  
**Component:** Global  
**Description:** No `prefers-reduced-motion` media query anywhere in the codebase. All animations run regardless of user accessibility settings.  
**Root Cause:** Missing `@media (prefers-reduced-motion: reduce)` CSS rules.  
**Severity:** 🟡 Medium  
**Performance Impact:** Unnecessary animation on devices where users have opted out (also accessibility issue).  
**User Impact:** Accessibility failure for users with vestibular disorders. Also fails WCAG 2.1 criterion 2.3.3.  
**Estimated Improvement Potential:** Add CSS media query to disable/reduce all animations.

---

## Problem #15

**File:** `src/api.js`  
**Component:** `api.js`  
**Description:** Firebase is both statically imported (`import { auth } from './firebase'`) AND dynamically imported in `App.jsx`. This causes Vite to warn about ineffective dynamic imports and prevents proper code splitting.  
**Root Cause:** Dual import pattern — static in `api.js`, dynamic attempt in `App.jsx`.  
**Severity:** 🟡 Medium  
**Performance Impact:** Firebase (~180KB) cannot be code-split and is always in the main bundle.  
**User Impact:** Larger initial bundle for all visitors including unauthenticated users.  
**Estimated Improvement Potential:** 25% bundle reduction for landing-only visitors if Firebase is lazy-loaded.
