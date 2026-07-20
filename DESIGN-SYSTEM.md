# Arc Nova — Design System

> Dark Luxury Fintech · Inspired by Apple, Stripe, Linear, Vercel, Coinbase, Framer
> Version: 1.0 · 2026-07-21

---

## 1. Design Principles

1. **Calm confidence** — motion is subtle, never flashy.
2. **Depth through layering** — glass + shadow, not heavy borders.
3. **Numbers first** — tabular figures, right-aligned data, no ambiguity.
4. **One accent** — a single violet thread ties the product together.
5. **Accessible by default** — AA contrast, focus-visible, reduced-motion.

---

## 2. Color System

### 2.1 Backgrounds (layered)

| Token | Hex | Role |
|-------|-----|------|
| `--bg-base` | `#07070B` | App canvas (near-black, slight blue) |
| `--bg-elevated` | `#0D0D14` | Raised sections |
| `--bg-surface` | `#12121B` | Cards |
| `--bg-surface-2` | `#171723` | Nested / hover surfaces |
| `--bg-overlay` | `rgba(7,7,11,0.72)` | Modal / menu backdrop |

### 2.2 Primary (Violet — the single brand thread)

| Token | Hex | Role |
|-------|-----|------|
| `--violet-50` | `#F5F3FF` | (reserved) |
| `--violet-300` | `#C4B5FD` | Hover text |
| `--violet-400` | `#A78BFA` | Default accent |
| `--violet-500` | `#8B5CF6` | Primary buttons |
| `--violet-600` | `#7C3AED` | Pressed / active |
| `--violet-glow` | `rgba(139,92,246,0.25)` | Glow / halo |

### 2.3 Secondary (Neutral — structural)

| Token | Hex | Role |
|-------|-----|------|
| `--neutral-0` | `#FFFFFF` | Headings |
| `--neutral-100` | `#F8FAFC` | Primary text |
| `--neutral-300` | `#CBD5E1` | Secondary text |
| `--neutral-400` | `#94A3B8` | Tertiary / labels |
| `--neutral-500` | `#64748B` | Disabled |
| `--neutral-600` | `#475569` | Borders strong |

### 2.4 Semantic

| Token | Hex | Role |
|-------|-----|------|
| `--success` | `#10B981` | Positive / live / profit |
| `--success-soft` | `rgba(16,185,129,0.12)` | Success bg |
| `--warning` | `#F59E0B` | Upcoming / caution |
| `--warning-soft` | `rgba(245,158,11,0.12)` | Warning bg |
| `--danger` | `#EF4444` | Error / loss |
| `--danger-soft` | `rgba(239,68,68,0.12)` | Danger bg |
| `--info` | `#38BDF8` | Info / neutral accent |
| `--info-soft` | `rgba(56,189,248,0.12)` | Info bg |

### 2.5 Borders & Dividers

| Token | Value |
|-------|-------|
| `--border-subtle` | `rgba(255,255,255,0.06)` |
| `--border-default` | `rgba(255,255,255,0.09)` |
| `--border-strong` | `rgba(255,255,255,0.14)` |
| `--border-accent` | `rgba(139,92,246,0.35)` |

---

## 3. Typography Scale

**Family:** Inter (400 / 500 / 600 / 700 / 800)
**Numeric:** `font-feature-settings: "tnum" 1, "cv01" 1` for all data.

| Token | Size | Weight | Line | Tracking | Use |
|-------|------|--------|------|---------|-----|
| `--text-display` | `clamp(2.5rem, 5vw, 4.5rem)` | 800 | 1.05 | -0.03em | Hero |
| `--text-h1` | `clamp(1.875rem, 3vw, 2.5rem)` | 800 | 1.1 | -0.025em | Page titles |
| `--text-h2` | `1.5rem` | 700 | 1.2 | -0.02em | Section titles |
| `--text-h3` | `1.25rem` | 700 | 1.3 | -0.015em | Card titles |
| `--text-h4` | `1rem` | 700 | 1.4 | -0.01em | Sub-titles |
| `--text-body` | `0.9375rem` | 400 | 1.6 | 0 | Body |
| `--text-body-sm` | `0.8125rem` | 400 | 1.55 | 0 | Secondary body |
| `--text-label` | `0.75rem` | 600 | 1.4 | 0.02em | Labels (uppercase) |
| `--text-caption` | `0.6875rem` | 600 | 1.4 | 0.04em | Captions / eyebrows |
| `--text-data` | `1.125rem` | 700 | 1.2 | -0.01em | Stat numbers |
| `--text-data-lg` | `1.75rem` | 800 | 1.1 | -0.02em | Hero stats |

---

## 4. Spacing System

Base unit: **4px**. Scale follows a 4px grid.

| Token | Value |
|-------|-------|
| `--space-0` | `0` |
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |
| `--space-12` | `48px` |
| `--space-16` | `64px` |
| `--space-20` | `80px` |
| `--space-24` | `96px` |

**Section padding:** `var(--space-16)` vertical on desktop, `var(--space-10)` on tablet, `var(--space-8)` on mobile.

---

## 5. Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `--radius-xs` | `6px` | Tags, pills |
| `--radius-sm` | `8px` | Inputs, small buttons |
| `--radius-md` | `12px` | Buttons, list items |
| `--radius-lg` | `16px` | Cards |
| `--radius-xl` | `20px` | Large cards |
| `--radius-2xl` | `24px` | Banners, modals |
| `--radius-full` | `9999px` | Pills, avatars |

---

## 6. Shadow System

Shadows use a two-layer approach: a tight ambient + a soft cast.

| Token | Value |
|-------|-------|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.3)` |
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,0.25)` |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)` |
| `--shadow-lg` | `0 12px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.25)` |
| `--shadow-xl` | `0 24px 64px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)` |
| `--shadow-glow` | `0 0 24px rgba(139,92,246,0.25)` |
| `--shadow-glow-lg` | `0 0 48px rgba(139,92,246,0.35)` |

---

## 7. Glass / Surface System

```css
--glass-bg: rgba(18, 18, 27, 0.6);
--glass-border: rgba(255, 255, 255, 0.08);
--glass-blur: 16px;
--glass-saturate: 1.4;

.glass {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
}
```

---

## 8. Gradient System

| Token | Value |
|-------|-------|
| `--grad-primary` | `linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)` |
| `--grad-primary-soft` | `linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(124,58,237,0.05) 100%)` |
| `--grad-text` | `linear-gradient(135deg, #C4B5FD 0%, #A78BFA 100%)` |
| `--grad-surface` | `linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 100%)` |
| `--grad-radial-glow` | `radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 60%)` |
| `--grad-border` | `linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))` |

---

## 9. Animation System

### 9.1 Easing

| Token | Value | Use |
|-------|-------|-----|
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Default enter |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | State changes |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful overshoot |

### 9.2 Duration

| Token | Value |
|-------|-------|
| `--dur-instant` | `80ms` |
| `--dur-fast` | `150ms` |
| `--dur-base` | `220ms` |
| `--dur-slow` | `320ms` |
| `--dur-slower` | `480ms` |

### 9.3 Keyframes

```css
@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.4; transform: scale(0.85); }
}
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes count-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### 9.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 10. Z-Index Scale

| Token | Value | Layer |
|-------|-------|-------|
| `--z-base` | `0` | Default |
| `--z-raised` | `10` | Sticky headers |
| `--z-dropdown` | `100` | Menus, panels |
| `--z-sticky` | `200` | Ticker bar |
| `--z-modal` | `1000` | Modals |
| `--z-toast` | `1100` | Toasts |
| `--z-tooltip` | `1200` | Tooltips |

---

## 11. Component Tokens

### Button

| Variant | Padding | Radius | Font |
|---------|---------|--------|------|
| `btn-sm` | `8px 14px` | `--radius-sm` | `--text-body-sm / 600` |
| `btn-md` | `10px 18px` | `--radius-md` | `--text-body / 600` |
| `btn-lg` | `14px 24px` | `--radius-md` | `--text-h4 / 700` |

### Card

| Token | Value |
|-------|-------|
| `--card-padding` | `var(--space-6)` |
| `--card-radius` | `--radius-lg` |
| `--card-border` | `1px solid var(--border-subtle)` |
| `--card-bg` | `var(--bg-surface)` |
| `--card-hover-border` | `var(--border-accent)` |
| `--card-hover-shadow` | `var(--shadow-lg)` |

### Input

| Token | Value |
|-------|-------|
| `--input-padding` | `12px 16px` |
| `--input-radius` | `--radius-sm` |
| `--input-bg` | `var(--bg-surface-2)` |
| `--input-border` | `1px solid var(--border-default)` |
| `--input-focus-border` | `var(--violet-400)` |

---

## 12. Layout

| Token | Value |
|-------|-------|
| `--container-max` | `1200px` |
| `--container-wide` | `1440px` |
| `--container-padding` | `var(--space-6)` |
| `--nav-height` | `64px` |

Breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px