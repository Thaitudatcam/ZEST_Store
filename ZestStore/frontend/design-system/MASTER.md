# ZestStore Atelier — Design System (MASTER)

> Source of truth for the ZestStore frontend UI. Generated from the
> **ui-ux-pro-max** design-intelligence workflow, tuned to a **Luxury Fashion**
> brand direction ("Tinh hoa thời trang Việt").
>
> Tokens live in `frontend/src/index.css` under `@theme`. Override per-page in
> `design-system/pages/<page>.md` when needed (page overrides take priority).

---

## 1. Brand Direction

| | |
|---|---|
| **Aesthetic** | Couture / atelier — serif display, generous whitespace, gold-on-noir, restrained motion |
| **Voice** | Refined, confident, Vietnamese-first copy |
| **Don't** | Avoid neon gradients, emoji-as-icons, harsh shadows, playful bouncing motion |

---

## 2. Color Tokens

### Gold (primary accent)
| Token | Hex | Use |
|---|---|---|
| `gold` | `#C9A227` | Primary buttons, links, active states, prices |
| `gold-light` | `#E0C158` | Hover highlights |
| `gold-hover` | `#B8951F` | Button hover |
| `gold-dark` | `#8B6914` | Pressed, borders, gradient stops |
| `gold-50` | `#FBF6E5` | Tinted backgrounds |

### Noir (dark surfaces — admin + accents)
| Token | Hex | Use |
|---|---|---|
| `noir` | `#0B0B0F` | Deepest background, footer, hero |
| `noir-900` | `#0F0F15` | Sidebar, dark sections |
| `noir-800` | `#16161E` | Dark cards |
| `noir-700` | `#1A1A22` | Dark card / panel |
| `noir-600` | `#25252F` | Dark borders |

### Ivory (light surfaces — customer storefront)
| Token | Hex | Use |
|---|---|---|
| `ivory` | `#FAF7F0` | Page background |
| `ink` | `#14141A` | Primary text on light |
| `stone` | `#8A8A93` | Muted text |

### Semantic
| Token | Hex | Use |
|---|---|---|
| `bordeaux` | `#7B1E2B` | Sale / destructive |
| `emerald-deep` | `#1F4D3A` | Success |
| `royal` | `#2A2466` | Info / secondary |

> **Contrast (WCAG AA):** gold on noir ≥ 5.2:1 ✓ · ink on ivory ≥ 14:1 ✓ ·
> stone on ivory ≈ 4.0:1 — use only for secondary text ≥ 14px, never body.

### Legacy aliases (defined for back-compat)
`dark-900`, `dark-800`, `dark-700`, `dark-600`, `dark-border`, `dark-muted`,
`gold-hover` — now resolve to real colors so existing classes light up.

---

## 3. Typography

| Role | Family | Weight |
|---|---|---|
| Display / headings | `Playfair Display` (serif) | 600–800 |
| Body / UI | `Be Vietnam Pro` (sans) | 400–600 |
| Prices / stats | `Be Vietnam Pro` + `tabular-nums` | 700 |

Imported in `index.css` (Google Fonts). Use `font-serif` / `font-sans` helpers.

---

## 4. Spacing, Radius, Shadow

- **Spacing scale:** 4px base (`gap-1` … `gap-16`). Generous whitespace on
  storefront; denser (8–16px) in admin tables.
- **Radius:** cards & buttons `rounded-xl` (12px) / `rounded-2xl` (16px) for
  panels. Pills = `rounded-full`.
- **Shadows:** `shadow-lux` (soft, deep) for elevated cards; `shadow-gold` for
  primary CTAs. Avoid hard `shadow-md` shadows on light surfaces.

---

## 5. Components

Primitive components live in `frontend/src/components/ui/`:
`Button`, `Input`, `Badge`, `Card`, `Section`. Prefer composing these over
hand-writing utility stacks, so a re-skin only touches primitives.

- **Button** — variants: `primary` (gold), `noir`, `outline`, `ghost`.
- **Input** — ivory field, gold focus ring, hairline border.
- **Badge** — semantic colors via `tone` prop.
- **Card** — ivory surface, `shadow-lux`, `rounded-2xl`.

---

## 6. Motion

- Standard transition: `duration-200 … 300`, `ease-out`.
- Reveal: `animate-fade-in-up-elegant` (0.6s) for hero/section entries.
- **Always** respect `useReducedMotion` (see `hooks/useReducedMotion.js`).
- Hover lift max `−translate-y-1`; no bounce on data UI.

---

## 7. Do / Don't

✅ Use tokens (`text-gold`, `bg-noir`, `text-ink`) — never raw hex in JSX.
✅ Pair serif heading + sans body.
✅ Keep Vietnamese copy; currency via `VND()` helper + `tabular-nums`.

❌ Don't reintroduce `blue-600/700` as primary (legacy).
❌ Don't use emoji as functional icons (Lucide only).
❌ Don't place gold text on gold-50 backgrounds (fails contrast).

---

## 8. Migration note

Former "blue primary" + dead `gold/dark-*` tokens are superseded. The
`@theme` block makes legacy classes render; new work uses tokens above.
