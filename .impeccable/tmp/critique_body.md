## Critique: Dashboard (client/src/pages/Dashboard.jsx)

### Design Health Score: 24/40 — "Needs Improvement"

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Skeleton loading ✓, but no data-freshness indicators |
| 2 | Match System / Real World | 3/4 | Spanish labels ✓, but "Toma General" jargon, hardcoded radar data |
| 3 | User Control and Freedom | 2/4 | Search has no cancel, roles forced to specific tabs on load |
| 4 | Consistency and Standards | 3/4 | Card pattern consistent ✓, but docente uses dashed cards vs admin solid |
| 5 | Error Prevention | 2/4 | Navigation cards silently redirect, dead logout function unused |
| 6 | Recognition Rather Than Recall | 3/4 | Icons + labels ✓, but section purposes sometimes unclear |
| 7 | Flexibility and Efficiency | 2/4 | Global search ✓, but no keyboard shortcuts, no favorites/recents |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean layout, but ~20 cards on admin view is overwhelming |
| 9 | Error Recovery | 1/4 | All API errors silently logged — no user-facing messages, no retry |
| 10 | Help and Documentation | 2/4 | "Guía del Sistema" link ✓, but no tooltips, no onboarding |

### Anti-Patterns Verdict: AI-Generated — Moderate

**LLM assessment**: The card grid anti-pattern (icon+title+desc repeated ~18x) is the #1 AI tell. Side-stripe borders on every card hover, hero-metric template on stats, all-caps overload, and hardcoded chart data all contribute.

**Detector scan**: 5 findings on Dashboard.jsx (`border-accent-on-rounded`), 20+ across page directory. Side-stripe borders via absolute positioning were a detector blind spot.

### Priority Issues

| Prio | Issue | Where | Fix | Command |
|------|-------|-------|-----|---------|
| P0 | ~18 identical card-grid items violating anti-reference pattern | Dashboard.jsx:252-505 | Collapse to 4-6 priority items, relegate rest to page links | `$impeccable layout` |
| P0 | All API errors silently console.log'd, no user feedback | Dashboard.jsx:52-68, DashboardStats.jsx:61 | Add toast/alert on failure, retry button | `$impeccable harden` |
| P1 | Static cards with shadow-xl violate No-Shadow Rule | DashboardStats.jsx:123-200 | Remove shadows from static cards | `$impeccable polish` |
| P1 | 10+ interactive `<div>` with onClick violate a11y | Dashboard.jsx:522-619 | Replace with `<button>` or add role+tabIndex | `$impeccable audit` |
| P1 | Side-stripe borders (absolute w-1) on every card hover | Dashboard.jsx:254-504 | Replace with full border treatment or nothing | `$impeccable polish` |
| P1 | All-caps overload on body/description text | Dashboard.jsx:274-310 | Use sentence case per DESIGN.md Uppercase Ceiling Rule | `$impeccable typeset` |
| P2 | Hardcoded radar chart data (all 9s) | DashboardStats.jsx:73-91 | Use real API data or remove widget | `$impeccable harden` |
| P2 | Announcement ticker infinite loop | AnnouncementTicker.jsx | Fix loop logic or pauseOnHover | `$impeccable polish` |
| P3 | Decorative background icons opacity-5 | DashboardStats.jsx:124,177 | Remove per "Expediente Digital" principle | `$impeccable distill` |

### Persona Red Flags

- **Alex (Power User)**: No keyboard shortcuts, no custom favorites, no recents. Search is admin/preceptor-only.
- **Jordan (First-Timer)**: No onboarding, 20-card grid overwhelming, "Toma General" jargon unexplained.
- **Sam (Accessibility)**: 10+ `<div>` with onClick no role/tabIndex. animate-pulse has no prefers-reduced-motion. Color-only differentiation on cards.

### Cognitive Load: 3 failures (high)

Single focus FAIL (20+ items), minimal choices FAIL (18+ options), progressive disclosure FAIL (everything on surface).
