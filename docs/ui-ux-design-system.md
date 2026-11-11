# UI/UX Design System & Motion Specification — CBid

## 1. Brand Identity & Design Philosophy

**CBid** blends the ergonomics of professional financial trading terminals with the adrenaline and visual spectacle of premier sports broadcasts (IPL, WPL, Big Bash).

### Visual Pillars
- **Minimalistic & Modern:** Generous whitespace, razor-sharp typography, and zero frivolous decoration. Every pixel serves a functional purpose.
- **Deep Sports-Tech Surfaces:** Layered obsidian dark mode (`#080C14`, `#0F172A`, `#1E293B`) combined with high-contrast text and electric accents.
- **Broadcast-Ready Drama:** Rich lot presentation, dramatic SOLD celebrations, dynamic purse progress bars, and animated bid increments.
- **Zero-Latency Ergonomics:** High-density operator controls designed for rapid keyboard or one-tap inputs without accidental clicks.

---

## 2. Color Palette & Design Tokens

### 2.1 Surfaces & Backgrounds
| Token | Hex | Role |
| :--- | :--- | :--- |
| `surface-canvas` | `#080C14` | Main page background (deepest obsidian) |
| `surface-card` | `#0F172A` | Elevated containers, player lot cards, modals |
| `surface-accent` | `#1E293B` | Interactive hover states, input fields, tables |
| `border-subtle` | `#334155` | 1px clean separators and container outlines |
| `border-focus` | `#06B6D4` | Active input or selected team border highlight |

### 2.2 Accent & Semantic Palette
| Token | Hex | Role |
| :--- | :--- | :--- |
| `accent-cyan` | `#06B6D4` | Primary brand accent, interactive links, active tabs |
| `accent-emerald` | `#10B981` | Bid increments, positive budget balance, approval tags |
| `accent-gold` | `#F59E0B` | Marquee player badges, high-value purchases, hammer SOLD |
| `accent-crimson` | `#EF4444` | Timer expiration warning, UNSOLD stamp, delete buttons |
| `accent-purple` | `#8B5CF6` | Overseas player indicator, premium tournament tier |

---

## 3. Typography & Numerical Hierarchy

- **Primary Typeface:** `Inter` or `Outfit` (Clean, geometric, modern sans-serif).
- **Monospace Numerical Typeface:** `JetBrains Mono` or `Roboto Mono` (Tabular numbers for timers, bid amounts, and remaining purses to eliminate layout shift during rapid updates).

| Scale | Font Size | Weight | Usage |
| :--- | :--- | :--- | :--- |
| `Display 1` | 48px / 3rem | 800 (Extrabold) | Current active bid on live broadcast |
| `Display 2` | 36px / 2.25rem | 700 (Bold) | Player name on live lot card |
| `Heading 1` | 24px / 1.5rem | 700 (Bold) | Page titles, major section headings |
| `Heading 2` | 18px / 1.125rem| 600 (Semibold) | Card titles, team names in squad view |
| `Body Large`| 16px / 1rem | 400 / 500 | Main content, stats labels, descriptions |
| `Body Small`| 13px / 0.8125rem | 400 | Secondary timestamps, helper labels |
| `Mono Large`| 32px / 2rem | 700 | Countdown timer display (`00:15`) |

---

## 4. Dual Dashboard UX Architecture

### 4.1 Dashboard 01: The Auctioneer Live Cockpit (Private Admin)
- **Ergonomics First:** Zero-scroll layout on standard 1080p and tablet displays.
- **Action Zone:** Large, high-target buttons for the most frequent live actions:
  - `+10,000`, `+25,000`, `+50,000`, `+100,000` quick bid buttons.
  - Team selector grid displaying team acronym, current purse, and 1-tap bid attribution.
  - Giant green "HAMMER SOLD" and red "UNSOLD" buttons with confirmation guards.
- **Keyboard Shortcut Integration:**
  - `Space` $\rightarrow$ Place next standard increment bid
  - `1-8` $\rightarrow$ Select Team #1 through #8
  - `Enter` $\rightarrow$ Hammer SOLD
  - `U` $\rightarrow$ Mark UNSOLD
  - `P` $\rightarrow$ Pause / Resume timer
  - `Ctrl + Z` $\rightarrow$ Undo last bid

### 4.2 Dashboard 02: Public Auction Broadcast (Spectator Experience)
- **Broadcast Television Vibe:** Styled like an ESPN / Cricbuzz live telecast.
- **Hero Live Lot Card:** Centerstage spotlight on the current contested lot with high-res photo, cricket role icon, base price, and real-time bid counter.
- **Instant Tabbed Navigation:**
  - **Overview:** Tournament status, total purse spent, players sold/unsold.
  - **Live Lot:** Full-focus view of the active bidding duel.
  - **All Players:** Faceted search by role, style, category, and price bracket.
  - **Sold / Unsold:** Fast filtered lists with instant price sorting.
  - **Team Squads:** Visual team roster cards with purse depletion meters.
  - **Auction Stats:** Cricbuzz-inspired charts (Top buys, average cost per category).

---

## 5. Framer Motion Animation Specification

CBid uses **Framer Motion** for all UI interactions. Animations must feel intentional, snappy, and physical—never slow or decorative.

```javascript
// Global Spring Configuration Preset
export const smoothSpring = {
  type: "spring",
  stiffness: 350,
  damping: 30,
  mass: 0.8
};
```

### 17 Mandatory Animation Implementations

1. **Page Transitions:** Fade and slight Y-translate (`initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }`).
2. **Animated Sidebar:** Smooth width expansion/collapse with staggered label reveals.
3. **Active Nav Tab Slider:** Floating animated highlight pill using `layoutId="activeNavTab"`.
4. **Player Card Entrances:** Staggered grid entrance (`staggerChildren: 0.05`) when browsing directories.
5. **Player Profile Modal:** Scale-up reveal with backdrop blur (`initial: { scale: 0.95, opacity: 0 }`).
6. **Smooth Confirmation Modals:** Spring-damped slide-in from bottom on mobile; center fade-in on desktop.
7. **Animated Bid Number Ticker:** Rolling number digit changes (using `JetBrains Mono` and Framer Motion layout digits) when bids increment.
8. **Authoritative Countdown Pulse:** Circular SVG timer that pulses and shifts color from Cyan $\rightarrow$ Amber $\rightarrow$ Glowing Crimson when $< 5$ seconds remain.
9. **SOLD Celebration Overlay:**
   - Gold shimmer particles burst across the viewport.
   - Large embossed "SOLD" stamp scales down with an intentional spring bounce (`scale: [1.8, 1]`).
   - Winning team logo scales in alongside the final price tag in glowing emerald.
10. **UNSOLD Transition:** Subtle desaturation and slide-off-stage animation (`x: 60, opacity: 0`).
11. **Team Roster Flying Lot:** Mini lot avatar visually transitions toward the acquiring team's roster widget upon hammer.
12. **Animated Statistics:** Progress bars and category charts smoothly interpolate from 0 to target value on mount.
13. **Loading Skeletons:** Dual-wave shimmer gradient (`background-position: [-200% 0, 200% 0]`).
14. **Faceted Filter Shifts:** `layout` prop on cards ensures smooth re-ordering when user switches tabs (Sold $\rightarrow$ All).
15. **Hover Micro-Interactions:** Subtle elevation (`y: -2px`) and subtle cyan glow on hover.
16. **Button Tap Feedback:** Spring compression (`whileTap={{ scale: 0.97 }}`).
17. **Reduced Motion Compliance:** Full bypass of translations when `prefers-reduced-motion` is detected via `useReducedMotion()`.
