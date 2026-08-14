# WorkPilot AI — Redesign Implementation Plan
> Status: **AWAITING APPROVAL** · No code changes have been made yet

---

## Current UI Analysis — What's Wrong

### Dashboard
| Problem | Location |
|---------|----------|
| **Cluttered Bento Grid** | 9 widgets all at 3-col grid — too many things at once, overwhelming |
| **Generic cards** | All `Bento` cards look identical — no visual hierarchy |
| **Inline styles everywhere** | 74KB inline CSS — impossible to maintain, no consistency |
| **Sidebar too wide** (218px) | Eats screen space; labels are repetitive |
| **Top bar** is cluttered | Search + role switcher + notif + user menu + ticker — all crammed |
| **Bento widgets have no priority** | Email, Deployments, Analytics all look equally important |
| **Mobile: broken** | 3-column grid collapses badly; sidebar has no mobile drawer |
| **No whitespace** | `padding: 20px 22px` on every card gives claustrophobic feel |
| **Buttons are inconsistent** | `PBtn`, `GBtn`, inline `<button>` — 3 separate styles with no system |

### AI Chatbot (AICockpit)
| Problem | Location |
|---------|----------|
| **260px sidebar is too wide** | Pinned prompts panel eats 30% of screen on small devices |
| **AI messages hard to read** | `rgba(255,255,255,0.05)` bubble blends into background |
| **No markdown/code rendering** | Responses are plain text even when they contain structure |
| **Thinking indicator is tiny** | 3 dots barely visible vs the rest of the UI |
| **Input box** feels cramped | 12px left bolt icon wastes space |
| **Quick action chips are cut off** | `flex-wrap: wrap` pushes them onto 2+ lines on small screens |
| **No message timestamps per message** | Only "WorkPilot AI · HH:MM" — not per-message |
| **Back button** is too subtle | Users may not find it |
| **Rich cards** appear below bubble | Disconnected from the message |

### All Pages (Email, Calendar, Team, etc.)
| Problem | Location |
|---------|----------|
| **No page transitions** | `animation: pageIn .25s ease` but no actual fade/slide |
| **Table rows don't have hover states** | `pg-row` class defined but no CSS active on it |
| **Buttons all use one pattern** | Not visually distinguishable from one another |
| **Mobile**: tables overflow | Horizontal scroll with no sticky columns |

---

## Design System — New Approach

### Typography Scale (Inter + Sora)
```
Display:  Sora 800, 28px  — page headings only
Title:    Sora 700, 20px  — card titles
Body:     Inter 500, 14px — all readable content
Small:    Inter 400, 12px — labels, timestamps
Mono:     JetBrains Mono, 11px — IDs, codes, kbd shortcuts
```

### Spacing System (8px base grid)
```
xs: 4px   sm: 8px   md: 16px   lg: 24px   xl: 40px
Cards: padding 24px   Gap between cards: 16px
Sidebar: 64px icon-only | 220px expanded
```

### Color System (existing themes kept, surface layers added)
```
bg:        #000000  (root)
surface-1: #0a0a0d  (sidebar, topbar)
surface-2: #101014  (cards)
surface-3: #16161b  (hover, selected)
border:    rgba(255,255,255,0.07)
border-active: rgba(255,255,255,0.14)
```

### Component Design Language
- **Cards**: `border-radius: 20px`, left-accent stripe for priority, hover lift `translateY(-2px)`
- **Buttons**: 3 sizes (sm 32px, md 38px, lg 44px), 2 variants (solid gradient, ghost)
- **Icons**: 16px nav, 14px inline, all SVG
- **Avatars**: Gradient circles with initials, 32px default

---

## Redesign Plan — Dashboard

### New Layout
```
┌─────────────────────────────────────────────┐
│  [64px icon sidebar] │  [TOPBAR h=52px]      │
│                      ├──────────────────────-│
│  Logo                │  [GREETING BAND h=72] │
│  ─────               ├──────────────────────-│
│  Dashboard  (D)      │  [COMMAND BAR + ALERTS│
│  AI Chat    (C)      │   RIBBON]             │
│  ─────               ├──────────────────────-│
│  Email      (E)      │  [MAIN CONTENT AREA]  │
│  Calendar   (A)      │                       │
│  Team       (T)      │  WIDGETS — NEW GRID:  │
│  Deploys    (V)      │  ┌─────┬─────┬─────┐  │
│  Docs       (O)      │  │EMAIL│ CAL │STATS│  │
│  ─────               │  │ 2x1 │ 1x1 │ 1x2 │  │
│  Analytics           │  ├─────┴─────┤     │  │
│  Integrations        │  │  TEAM  2x1│     │  │
│  Settings            │  ├───────────┴─────┤  │
│                      │  │   DEPLOY   3x1  │  │
│  ─────               │  ├─────┬───────────┤  │
│  Theme dots          │  │ AI  │  BRIEFING │  │
│                      │  │ LOG │  1x1      │  │
└──────────────────────┴──┴─────┴───────────┘  │
```

### Key Changes
1. **Sidebar** → 64px collapsed by default, icon-only with tooltip. Hover-to-expand or pin
2. **Topbar** → Cleaner: just search (cmd+K), notif bell, avatar. Role pill moves to greeting
3. **Greeting Band** → Full-width banner: `Good morning, Alex · Tuesday, Jul 25 · 3 items need action`
4. **Alerts Ribbon** → Scrollable horizontal pill strip (max 1 row, no wrapping)
5. **Widget Grid** → New priority layout: Email gets 2-col wide, Stats tall-right, Deploy full-width bottom
6. **Widget headers** → Unified `WH` component with icon + title + badge + action-button right
7. **Mobile** → Sidebar becomes bottom tab bar on `< 768px`

### Widget-by-Widget Changes
| Widget | Now | New |
|--------|-----|-----|
| Email | flat rows, 3 items | Priority header badge, `urgent` items in red-tinted section, remaining collapsed |
| Calendar | 3 meeting rows | Visual timeline strip with color blocks. "Next: 10:00 AM" countdown chip |
| Attention | 4 alert rows | Remove — merge into Alerts Ribbon above grid |
| Stats | counter + sparklines | Keep counters, add animated radial ring for focus score |
| Team | avatar list + bars | Compact 2-row table, status as colored dot, `% bar` inline |
| Deployments | progress + text | Horizontal pipeline stages visualization |
| AI Log | action list | Keep, but add undo button per action |
| Briefing | paragraph | Becomes Morning Card: icon + 3 bullet points, dismiss X |
| Docs | file table | 4-item compact list + upload CTA at bottom |

---

## Redesign Plan — AI Chatbot

### New Layout
```
┌──────────────────────────────────────────────┐
│   TOPBAR: ← Dashboard | 🟢 AI Cockpit | Mode│
├───────────┬──────────────────────────────────┤
│  LEFT     │                                  │
│  PANEL    │    CHAT MESSAGES AREA            │
│  (260px)  │                                  │
│           │  ┌─────────────────────────────┐ │
│  Mode     │  │ 🤖 WorkPilot AI             │ │
│  Switcher │  │ Welcome back, Alex! ...     │ │
│           │  └─────────────────────────────┘ │
│  Pinned   │                                  │
│  Prompts  │  ┌─────────────────────────────┐ │
│           │  │               [user bubble] │ │
│  ───────  │  └─────────────────────────────┘ │
│  Context  │                                  │
│  Today    │  ┌─────────────────────────────┐ │
│           │  │ 🤖 [streaming response...] │  │
│  ───────  │  │   [RICH CARD inline]        │ │
│  Session  │  └─────────────────────────────┘ │
│  Stats    │                                  │
│           ├──────────────────────────────────┤
│           │  QUICK CHIPS (horizontal scroll) │
│           │  ┌──────────────────────────────┐│
│           │  │ ⚡ [Prompt input]  🎤  ▶    ││
│           │  └──────────────────────────────┘│
└───────────┴──────────────────────────────────┘
```

### Key Changes
1. **AI message bubbles** → Increase contrast: `background: rgba(255,255,255,0.08)` + subtle left-border in theme color
2. **User message bubbles** → Keep gradient but add `box-shadow: 0 6px 20px ${glow}` for premium feel
3. **Thinking indicator** → Full-width pulsing bar below last message (like Claude/GPT), not just 3 dots
4. **Rich cards** → Appear **inline inside the AI bubble** (not below it), with a separating hairline
5. **Quick chips** → Horizontal scroll, no wrapping, `overflow-x: auto; scrollbar-width: none`
6. **Input area** → Floating pill (not stuck to edge): `border-radius: 24px`, `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255,255,255,0.12)`
7. **Mic button** → Red pulse ring when listening
8. **Left panel on mobile** → Collapses to a drawer, triggered by ☰ button in topbar
9. **Message timestamps** → Show per-message on hover only (don't clutter)
10. **Copy/Remove actions** → Only visible on hover (opacity: 0 → 1)

---

## Redesign Plan — Pages (Email, Calendar, Team, etc.)

### Shared Changes
- `PageShell` → Add sticky header that persists on scroll
- Page transitions → `opacity 0→1` + `translateY(8px→0)` on mount (add CSS class `page-enter`)
- Tables → Row hover state `background: rgba(255,255,255,0.04)`, smooth transition
- Buttons → Consistent `Btn` component with size prop: `sm | md | lg`

### Page-Specific
| Page | Key Change |
|------|-----------|
| **Email** | Left panel uses `selected` highlight. Detail pane has proper typography with sender chip |
| **Calendar** | Week grid has proper time-slot height proportional to event duration |
| **Team** | Status dots (🟢🟡🔴⚫) replace text tags. Progress bar is thinner (4px) |
| **Deployments** | Pipeline selector as horizontal tabs (not cards) |
| **Analytics** | Bar chart bars animate on mount |
| **Integrations** | `Connected` state shows brand icon + green dot, toggle is iOS-style switch |
| **Settings** | Tab content animates on switch |

---

## Mobile Responsiveness

### Breakpoints
```
Desktop:  > 1024px  — full layout as above
Tablet:   768-1024px — sidebar collapses, 2-col grid
Mobile:   < 768px   — bottom tab bar, 1-col grid, floating FAB for AI
```

### Mobile-specific
- Sidebar → `position: fixed; bottom: 0; left: 0; right: 0; height: 56px; display: flex` (bottom tab bar)
- Dashboard grid → `grid-template-columns: 1fr` (single column)
- AI Cockpit left panel → `position: absolute; left: 0; top: 0; bottom: 0; transform: translateX(-100%); transition: transform 0.3s` (drawer)
- Tables → Cards on mobile instead of rows

---

## Animation System

```css
/* Page enter */
@keyframes pageEnter { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }

/* Card hover lift */
.card:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.5); }

/* Button press */
.btn:active { transform: scale(0.97); }

/* Skeleton shimmer — dark mode */
@keyframes shimmer { from { background-position: -400px 0 } to { background-position: 400px 0 } }

/* AI thinking pulse */
@keyframes thinkPulse { 0%,100% { opacity: 0.3; width: 40% } 50% { opacity: 1; width: 100% } }
```

---

## Implementation Order

> Execution plan once approved:

| Phase | Files Changed | What |
|-------|--------------|------|
| 1 | `Dashboard.jsx` | Sidebar + Topbar + Greeting + Alerts Ribbon |
| 2 | `Dashboard.jsx` | Widget grid restructure + all widget redesigns |
| 3 | `AICockpit.jsx` | Full chat UI overhaul |
| 4 | `Pages.jsx` | PageShell + all 8 pages polish |
| 5 | `index.css` | Global design tokens, animations, mobile breakpoints |

> [!IMPORTANT]
> **I will NOT touch backend files** — only frontend `.jsx` and `.css`.
> All existing logic (API calls, auth, routing) will be preserved exactly.

> [!NOTE]
> The redesign uses only **vanilla CSS via inline styles + a single global stylesheet** — no Tailwind, no CSS modules needed.

---

## Open Questions for Your Approval

1. **Sidebar style**: Should it be icon-only by default (64px) or always show text labels (220px)?
2. **Dashboard default widget order**: Should Email always be top-left, or should it be priority-sorted by urgency?
3. **AI Chatbot left panel**: Keep it always visible (desktop), or make it a collapsible drawer?
4. **Mobile**: Confirm if mobile-first is a priority for this sprint or a future phase?
