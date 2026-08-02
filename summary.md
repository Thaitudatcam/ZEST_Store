```
## Objective
Premium enterprise SaaS admin dashboard redesign — TypeScript, shadcn-style components, Framer Motion, consistent design system across all pages.

## Design System
- **Font**: Inter (globals.css @theme)
- **Background**: #F8FAFC | **Card**: #FFFFFF
- **Primary**: #4F46E5 (brand-600) with full 50-900 scale
- **Success/Warning/Danger**: #22C55E / #F59E0B / #EF4444
- **Border**: #E5E7EB | **Radius**: 20px (cards), 12px (md), 10px (sm)
- **Shadows**: ultra-soft (0 1px 3px rgb(0/0.03))
- **Animations**: Framer Motion for fade-in, scale-in, animated progress bars

## Architecture
| Layer | Path | Tech |
|-------|------|------|
| Types | `src/lib/utils.ts` | cn(), fmt(), VND(), USD() |
| Styles | `src/styles/globals.css` | Tailwind v4 @theme tokens + keyframes |
| UI Kit | `src/components/ui/` | Card, Badge, Button, Input, Select, StatCard |
| Charts | `src/components/charts/` | ChartTooltip (Recharts wrapper) |
| Layout | `src/components/layout/` | Sidebar, Navbar, PageLayout, admin-layout.tsx |
| Pages | `src/pages/admin/*.tsx` | Dashboard, Hotels, Guides (TSX redesign) |

## Rebuilt Pages (TypeScript + New Design System)

### Dashboard (`Dashboard.tsx`)
- 4 stat cards with gradient icons + growth badges (Framer Motion staggered)
- Revenue area chart (#4F46E5 gradient, 7d/30d/90d toggle)
- Order distribution donut chart (Framer Motion legend items)
- Recent orders table with Badge component
- Activity timeline (Framer Motion staggered list)

### Hotels (`AdminQLKhachSan.tsx`)
- 4 stat cards: Total Hotels, Available Rooms, Occupancy Rate, Avg Nightly Rate
- Hotel Directory table with Framer Motion row animation, Select filters
- Room Availability donut chart + Top Partners animated progress bars
- Booking Requests timeline with accept/decline buttons
- Occupancy Trend area chart + Revenue by Hotel bar chart

### Guides (`AdminQLHuongDanVien.tsx`)
- 3 stat cards: Total Guides, Available, On Tour
- Guide Directory table with Select filters + Reset button
- Guide Availability donut chart
- Top Rated Guides animated progress bars
- Monthly Assignments area chart (violet) + Language Coverage bar chart

## Remaining Pages (still in JSX, will migrate to TSX)
- AdminQLThanhToan (Payments)
- AdminThongKe (Reports)
- AdminOrders, AdminOrderDetail, AdminProducts, AdminCoupons, etc.

## Dependencies Added
- typescript, @types/react, @types/react-dom (dev)
- framer-motion, class-variance-authority, clsx, tailwind-merge
- `vite.config.js` resolve alias `@/` → `./src`
- `tsconfig.json` (strict mode, path aliases)

## Build Status
✅ Frontend build passes (npm run build)
✅ TypeScript compiles with no errors
```
