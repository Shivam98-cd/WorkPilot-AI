# WorkPilot AI — Performance Metrics
> Last updated: 2026-08-01 | Baseline measured from Vite build output + code analysis

---

## Estimated Lighthouse Scores (Current)

| Category | Score | Grade |
|----------|-------|-------|
| **Performance** | 52–62 / 100 | 🟠 Needs Improvement |
| **Accessibility** | 70–78 / 100 | 🟠 Needs Improvement |
| **Best Practices** | 78–85 / 100 | 🟢 Good |
| **SEO** | 72–80 / 100 | 🟠 Needs Improvement |

---

## Core Web Vitals (Estimated)

| Metric | Current Estimate | Target | Status |
|--------|-----------------|--------|--------|
| **LCP** (Largest Contentful Paint) | 3.8–5.2s | < 2.5s | 🔴 Poor |
| **FCP** (First Contentful Paint) | 1.8–2.8s | < 1.8s | 🟠 Needs Work |
| **TTI** (Time to Interactive) | 4.5–6.5s | < 3.8s | 🔴 Poor |
| **TBT** (Total Blocking Time) | 350–600ms | < 200ms | 🔴 Poor |
| **INP** (Interaction to Next Paint) | 150–280ms | < 200ms | 🟠 Borderline |
| **CLS** (Cumulative Layout Shift) | 0.08–0.15 | < 0.1 | 🟠 Borderline |
| **FPS** (Animation) | 45–55 fps | 60 fps | 🟠 Borderline |
| **FPS** (Scroll) | 35–50 fps | 60 fps | 🟠 Borderline |

---

## Bundle Analysis

| Asset | Current Size | Gzipped | Target |
|-------|-------------|---------|--------|
| **JS Bundle (total)** | 585.02 KB | 161.71 KB | < 200 KB gzipped |
| **CSS Bundle** | 5.32 KB | 1.86 KB | ✅ Good |
| Firebase SDK | ~250 KB raw | ~75 KB gzipped | Lazy-load |
| React + ReactDOM | ~180 KB raw | ~55 KB gzipped | Code-split |
| Dashboard.jsx | 60.9 KB raw | ~18 KB | Lazy-load |
| Pages.jsx | 71.2 KB raw | ~21 KB | Lazy-load |
| AICockpit.jsx | 49.1 KB raw | ~14 KB | Lazy-load |
| AuthModal.jsx | 33.2 KB raw | ~10 KB | Lazy-load |

---

## JavaScript Execution Time (Estimated per Frame)

| Operation | Time per Frame | Budget Used |
|-----------|---------------|-------------|
| Hero O(n²) particle edges | 8–15ms | 48–90% of 16.67ms budget |
| UnifiedBackground dot grid | 2–4ms | 12–24% |
| GlassShader × 6 WebGL | 3–6ms (GPU) | GPU overdraw |
| SaaSDashboard rAF tilt | 0.5–1ms | 3–6% |
| CursorSparks particles | 0.3–0.8ms | 2–5% |
| **Total estimated per frame** | **11–21ms** | ⚠️ Exceeds 16.67ms budget |

---

## Rendering Performance

| Metric | Current | Target |
|--------|---------|--------|
| Hero re-renders/second (during typewriter) | 9–15 | < 2 |
| Dashboard re-renders/second (idle) | 2–4 | < 1 |
| Scroll event handler fires/second | 60 | < 10 (throttled) |
| WebGL contexts open simultaneously | 6 | ≤ 2 |
| Canvas elements on homepage | 3 full-viewport | 1–2 |
| setInterval timers (hero + dashboard) | 7 | ≤ 2 |

---

## Memory Usage (Estimated)

| Resource | Estimated Size |
|----------|---------------|
| Canvas particle arrays (all canvases) | ~150 KB |
| WebGL GPU memory (6 contexts) | ~40–80 MB |
| Firebase SDK runtime | ~12 MB |
| React component tree (landing) | ~5 MB |
| **Total estimated** | ~60–100 MB |

---

## Post-Optimization Targets

| Metric | Current | After Optimization | Improvement |
|--------|---------|-------------------|-------------|
| Lighthouse Performance | 52–62 | 80–90 | +28–38 pts |
| LCP | 3.8–5.2s | 1.5–2.2s | 55% faster |
| TTI | 4.5–6.5s | 2.0–3.0s | 55% faster |
| TBT | 350–600ms | 80–150ms | 75% reduction |
| JS Bundle (gzipped) | 161.71 KB | 60–90 KB | 45% smaller |
| FPS (animations) | 45–55 | 58–60 | Smooth |
| WebGL contexts | 6 | 1–2 | 67% reduction |
| setInterval timers | 7 | 2 | 71% reduction |
