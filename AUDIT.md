# Arc Nova — Frontend Audit Report

> Performed by: Senior Staff Frontend Engineer / Product Designer
> Date: 2026-07-21
> Repo: https://github.com/SifatHossain456/Arc-nova
> Branch: `main`

---

## 1. Folder Structure

```
Arc-nova/
├── index.html              # Homepage
├── dashboard.html          # Analytics dashboard
├── launchpad.html          # Project launchpad
├── defi.html               # Swap / Stake / Borrow / Lending / Liquidity
├── preview-card.html       # Standalone preview (orphan, not linked)
├── start-server.ps1        # Local dev server script
├── README.md
├── .gitignore
├── assets/
│   ├── css/
│   │   └── styles.css      # Single 1057-line stylesheet (all pages)
│   ├── js/
│   │   ├── animations.js   # Scroll reveal / fade-up
│   │   ├── app.js          # Nav, mobile menu, notifications, toasts
│   │   ├── arc-live.js     # Live ticker / price feed simulation
│   │   ├── contracts.js    # Contract ABIs & addresses
│   │   ├── livedata.js     # Mock on-chain data feed
│   │   ├── nova-effects.js # Particle / glow effects
│   │   ├── points.js       # XP system
│   │   ├── wallet.js       # Wallet connect (ethers.js)
│   │   └── web3.js         # Web3 read/write helpers
│   └── img/
│       └── logo.svg
└── contracts/             # Solidity contracts (reference only)
```

**Issues**
- `preview-card.html` is an orphan page, not linked anywhere — dead weight.
- No separation between design tokens, components, and page styles — everything lives in one CSS file.
- No `assets/fonts/` — fully dependent on Google Fonts CDN.
- No build step / no minification / no cache-busting hashes.

---

## 2. Page Structure

All four pages share an identical shell:

```
<nav> → <mobile-nav> → <ticker-bar> (hidden on home) → <page-header> → <main content> → <footer> → <scripts>
```

| Page | Sections |
|------|----------|
| `index.html` | Hero · Features (4 cards) · Ecosystem + Featured Projects · How It Works (3 steps) · Airdrop/XP (tiers + earn grid) · Yield Calculator · CTA |
| `dashboard.html` | Stats grid (4) · Charts (bar + doughnut) · Top Protocols table · XP leaderboard + quests |
| `launchpad.html` | Filter tabs · Live projects (3 cards w/ countdown + raise bar) · Upcoming (3 cards) · Ended table · Apply CTA |
| `defi.html` | Tabbed: Swap / Stake / Borrow / Lending / Liquidity |

---

## 3. Component Hierarchy

```
Nav
├── Logo
├── NavLinks (Home, Dashboard, Launchpad, DeFi, Docs)
├── TestnetBadge
├── NotificationBell + Panel
├── WalletButton
└── Hamburger → MobileNav

Card variants (all hand-styled, no shared class system):
├── feat-card, eco-card, projects-card, step-card, cta-banner
├── stat-card, chart-card, protocol-row, quest-item
├── launch-card, upcoming-card, ended-row
└── swap-card, stake-card, borrow-card, lend-card, pool-row

Button variants (inconsistent):
├── .btn .btn-primary / .btn-ghost / .btn-lg
├── .btn-hero-primary / .btn-hero-outline  (homepage-only duplicates)
└── inline-styled buttons in launchpad/dashboard
```

**Issue:** No reusable component library. Every card is redefined per page with inline styles.

---

## 4. CSS Architecture

- **Single file**, 1057 lines, no layering.
- **CSS variables** exist but are incomplete and inconsistent:
  ```css
  --card, --border, --muted, --text, --text-2,
  --lavender, --cyan, --green, --yellow,
  --radius-lg, --radius-xl, --border-purple
  ```
- **~40% of styling is inline** (`style="..."`) — especially on dashboard, launchpad, and the airdrop tiers.
- **No design tokens** for spacing, typography scale, shadows, z-index, or motion.
- **Duplicated card patterns** — `.feat-card`, `.eco-card`, `.step-card`, `.projects-card` all share ~90% of their rules but are written separately.
- **Magic numbers everywhere** — `padding: 13px 28px`, `margin-bottom: 44px`, `gap: 22px` with no scale.
- **No dark/light token split** — colors hardcoded as `rgba(124,58,237,.11)` repeatedly.
- **No `prefers-reduced-motion`** support.
- **No focus-visible styles** — keyboard accessibility broken.

---

## 5. JavaScript Architecture

| File | Role | Issues |
|------|------|--------|
| `wallet.js` | ethers.js wallet connect | Polls every 3s; no reconnect guard |
| `web3.js` | Read/write contract helpers | Duplicated ABI parsing |
| `contracts.js` | ABIs + addresses | Hardcoded, no env config |
| `livedata.js` | Mock data feed | Global mutable state |
| `arc-live.js` | Ticker animation | `setInterval` never cleared |
| `points.js` | XP system | localStorage without try/catch |
| `app.js` | Nav/toasts/notif | Inline `onclick` handlers everywhere |
| `animations.js` | Scroll reveal | No IntersectionObserver fallback |
| `nova-effects.js` | Particles | Canvas not cleaned up on unmount |

**Issues**
- No module system — all globals on `window`.
- Inline `onclick="..."` used heavily — CSP-unsafe, hard to test.
- No error boundaries — a single failed `getElementById` can break a page.
- `setInterval` loops in `arc-live.js` and `livedata.js` are never cleared.

---

## 6. Color Palette (Current)

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#040412` / `#0a0a14` | Page bg |
| Lavender | `#a78bfa` / `#8b5cf6` / `#7c3aed` | Primary brand |
| Cyan | `#22d3ee` | Secondary accent |
| Green | `#10b981` / `#16a5a5` | Positive / live |
| Yellow | `#f59e0b` / `#fbbf24` | Warning / upcoming |
| Text | `#f8fafc` | Headings |
| Muted | `rgba(248,250,252,.4)` | Body text |

**Issues**
- Too many accent colors compete for attention (lavender + cyan + green + yellow + gold).
- Opacity-based colors (`rgba(...,.07)`) make it impossible to theme.
- No semantic tokens (`--success`, `--warning`, `--danger`, `--info`).
- Airdrop tier colors (bronze/silver/gold/platinum/diamond) are hardcoded inline.

---

## 7. Typography

- **Single family:** Inter (400–900) via Google Fonts.
- **No type scale** — sizes are ad-hoc: `0.68rem`, `0.72rem`, `0.76rem`, `0.8rem`, `0.82rem`, `0.85rem`, `0.875rem`, `0.9rem`, `0.95rem`, `1rem`, `1.05rem`, `1.1rem`, `1.15rem`, `1.3rem`, `1.6rem`, `1.95rem`, `2.4rem`, `clamp(2.8rem,5.8vw,5.2rem)`.
- **Inconsistent letter-spacing** — `-0.045em`, `-0.04em`, `-0.025em`, `-0.02em`, `-0.01em`, `0.06em`, `0.08em`, `0.12em`.
- **Inconsistent line-height** — `1.06`, `1.15`, `1.75`, `1.8`, `1.85`.
- **No `font-feature-settings`** for tabular numbers (critical for a fintech app).

---

## 8. Responsive Issues

| Breakpoint | Problem |
|-----------|---------|
| **Mobile (<600px)** | Hero padding-bottom jumps to 260px to fit stats — hacky. Featured projects card overflows. Airdrop tier grid forces 2 cols, tier text truncates. |
| **Tablet (600–900px)** | No dedicated breakpoint. Eco grid collapses straight to 1 col. Nav links hidden but hamburger only shows at 900px. |
| **Landscape mobile** | Hero `min-height:100vh` causes content to be cut. |
| **Large monitor (>1440px)** | Container caps at 1200px — vast empty margins on ultrawide. |
| **Ultrawide (>1920px)** | No `max-width` on sections, hero visual drifts off-screen. |

---

## 9. Accessibility Issues

- **Critical:** No `:focus-visible` styles — keyboard users cannot see where they are.
- **Critical:** Interactive cards (`<a class="feat-card">`) have no focus ring.
- **High:** Emoji used as icons () — screen readers announce "bar chart emoji".
- **High:** `onclick` on `<div>` elements without `role="button"` / `tabindex="0"`.
- **High:** Color contrast fails — `rgba(248,250,252,.35)` on `#040412` = **3.2:1** (WCAG AA needs 4.5:1 for body text).
- **Medium:** No `skip-to-content` link.
- **Medium:** Charts (Chart.js) have no `aria-label` or text alternative.
- **Medium:** Toast notifications use `aria-live="polite"` but are created dynamically without role.
- **Low:** Form inputs in DeFi lack `<label>` association.

---

## 10. Performance Issues

| Issue | Impact |
|-------|--------|
| Google Fonts render-blocking | +300ms FCP |
| Chart.js loaded on every page (even when unused) | +80KB |
| ethers.js loaded on every page | +600KB |
| No image optimization | logo.svg not optimized |
| `setInterval` polling never cleared | CPU drain on background tabs |
| Inline styles prevent CSS caching | Re-downloaded per page |
| No lazy loading of below-fold JS | All 9 JS files load immediately |
| `nova-effects.js` canvas runs even when off-screen | Battery drain |
| No `font-display: swap` on font (handled by Google's `&display=swap`) | OK but no preconnect to fonts.gstatic.com |

---

## 11. UX Issues

- **Wallet connect** has no loading state — button text doesn't change during connection.
- **No empty states** — if data fails to load, charts show blank.
- **No error states** — failed transactions show a generic toast.
- **Countdown timers** in launchpad don't handle the "ended" transition gracefully.
- **Yield calculator** slider has no keyboard step labels.
- **Mobile nav** doesn't trap focus or close on Escape.
- **Notification panel** doesn't close on outside click consistently.
- **Toasts** stack vertically with no max — can overflow viewport.

---

## 12. Broken Design Patterns

1. **Card inflation** — 8+ card variants that should be 1 base + modifiers.
2. **Button inflation** — `.btn-hero-primary` duplicates `.btn-primary` with different padding.
3. **Inline color drift** — same "lavender tint" appears as `.11`, `.12`, `.14`, `.15`, `.07`, `.045` across files.
4. **Section padding drift** — sections use `padding: 100px 0`, `padding: 80px 0`, `padding-top:20px`, `margin-bottom: 56px`, `margin-bottom: 48px` with no rhythm.
5. **Tag inconsistency** — `.tag.tag-green`, `.tag.tag-yellow` exist but launchpad uses inline `<span style="...">` for the same purpose.

---

## 13. Duplicate Code

| Duplication | Location |
|-------------|----------|
| Nav + mobile nav | Repeated in all 4 HTML files (identical markup) |
| Footer | Repeated in all 4 HTML files |
| Card base styles | `.feat-card`, `.eco-card`, `.step-card`, `.projects-card` share 90% |
| Button base styles | `.btn-hero-primary` ≈ `.btn-primary` |
| Tier card markup | 5 inline-styled `<div class="card">` blocks in airdrop |
| Earn-XP card markup | 4 inline-styled divs in earn grid |
| Project row markup | Repeated 4× in featured projects, 3× in launchpad live, 3× in upcoming |

---

## 14. Technical Debt

1. **No build system** — no minification, no tree-shaking, no cache-busting.
2. **No TypeScript** — JS is entirely untyped.
3. **No tests** — zero unit or e2e tests.
4. **No linting** — no `.eslintrc`, no `.prettierrc`.
5. **Global JS namespace** — all scripts attach to `window`.
6. **Hardcoded contract addresses** — no env config.
7. **No CI** — GitHub Actions only deploys, doesn't lint/test.
8. **`preview-card.html`** — orphan file should be removed.

---

## Priority Ranking

### P0 — Critical (must fix before production)
1. Accessibility: focus-visible states + keyboard navigation
2. Color contrast below WCAG AA
3. No `prefers-reduced-motion` support
4. `setInterval` memory leaks in `arc-live.js` / `livedata.js`

### P1 — High (core quality)
5. Establish unified design system (tokens, components, spacing)
6. Remove inline styles — move to CSS classes
7. Consolidate card/button variants into reusable components
8. Fix responsive breakpoints (tablet, ultrawide)
9. Add loading / empty / error states
10. Lazy-load Chart.js and ethers.js per page

### P2 — Medium (polish)
11. Typography scale + tabular numbers
12. Semantic color tokens (success/warning/danger)
13. Toast stacking + auto-dismiss
14. Mobile nav focus trap + Escape close
15. Remove `preview-card.html`

### P3 — Low (future)
16. Introduce build system / bundler
17. Add TypeScript
18. Add unit tests
19. Add ESLint + Prettier
20. Environment-based contract config