# GEMINI.md — Permanent Project Operating System & Rules

## 1. Project Identification
- **Project Name:** CBid — Premium Cricket Auction Management Platform
- **Architecture:** Decoupled Client-Server (Frontend: React + Vite + Tailwind CSS + Framer Motion; Backend: Node.js + Express + MongoDB/Mongoose + Socket.IO)
- **Deployment & Third-Party:** Cloudinary (Media storage & transformations), WhatsApp Business Platform (Transactional acquisition alerts), JWT Authentication.
- **Operating Philosophy:** Commercial-grade, minimalistic, ultra-responsive, real-time sports-tech platform.

---

## 2. Core Non-Negotiable Rules

### A. Development Stack & Language Constraints
1. **JavaScript & JSX Only:** Do NOT use TypeScript unless explicitly approved in writing by the user.
2. **Modular Architecture:** Maintain strict separation between `frontend/` and `backend/`. No monolithic mixing.
3. **Code Quality:** Keep code human-readable, self-documenting, and cleanly factored into controllers, services, models, middlewares, and reusable UI components.
4. **Documentation Integrity:** Preserve all existing comments and docstrings. Maintain updated checklists in `GEMINI.md` and phase summaries in `docs/`.

### B. Antigravity Workflow & Engineering Rules
1. **Inspect Before Modifying:** Always inspect the workspace and read existing code before making edits or additions.
2. **No Mock Data in Completed Features:** Features must connect frontend components to real backend APIs and Socket.IO events. Never leave mock data in place of operational backend endpoints once implemented.
3. **Browser-Based Verification:** For every UI phase, run the application, visually inspect the rendered UI across desktop, tablet, and mobile viewports, and confirm animation smoothness.
4. **Console & Terminal Vigilance:** Continuously monitor browser console errors, network request statuses, and backend terminal logs. Fix warnings and errors proactively.
5. **Ask Before Destructive Operations:** Never delete databases, drop collections, or purge user uploads without explicit permission.
6. **No Silent Scope Adjustments:** Never alter agreed rules, schemas, or business workflows without explicit user confirmation.

### C. Multi-Tenancy & Data Isolation
1. **Strict Tenant Boundaries:** Every auction, team, player, bid, transaction, and audit log must carry a strict `tenantId` / `organiserId` reference.
2. **Zero Cross-Tenant Leakage:** All database queries must enforce tenant context verification at the middleware layer.
3. **Public Data Masking:** Public endpoints must redact private player contacts, financial secret keys, organiser notes, and internal audit logs.

### D. Auction Engine & Real-Time Integrity
1. **Backend-Authoritative State:** The frontend NEVER calculates or determines auction outcomes. All bids, increments, timer expirations, and status transitions are validated and executed by the backend auction engine.
2. **Atomic Bidding Operations:** Bids must be processed using atomic database updates or transaction locks to eliminate race conditions and double-allocation of player lots or purse funds.
3. **Reserve Fund Protection:** The engine must enforce squad-completion reserve math:
   $$\text{Remaining Purse} - \text{Bid} \ge (\text{Min Squad Size} - \text{Current Squad Size} - 1) \times \text{Min Base Price}$$
4. **Audit Trail Immutability:** Every bid, state shift, pause, resume, and undo operation must be immutably recorded in the `AuditLog` collection.

### E. UI/UX & Animation Standards
1. **Sports-Tech Aesthetics:** Minimalistic, dark obsidian surfaces (`#090D16`, `#0F172A`), high-contrast typography, electric accents (Cyan, Emerald, Gold), zero clutter.
2. **Framer Motion Precision:** Every transition must feel broadcast-ready. Implement animated counters, countdown urgency pulses, lot entrance reveals, and dramatic SOLD celebration banners.
3. **Accessibility:** Ensure high-contrast readability, clear keyboard shortcuts for the live auctioneer cockpit, and support for `prefers-reduced-motion`.

---

## 3. Directory Layout & Organization

```
CBid/
├── GEMINI.md                         # Permanent project instructions & state
├── README.md                         # Project overview and run guides
├── .gitignore                        # Git exclusion rules
├── docs/                             # Architectural and engineering specifications
│   ├── product-requirements.md
│   ├── system-architecture.md
│   ├── database-design.md
│   ├── user-roles-and-permissions.md
│   ├── api-specification.md
│   ├── realtime-auction-engine.md
│   ├── ui-ux-design-system.md
│   ├── development-roadmap.md
│   ├── security-plan.md
│   └── testing-strategy.md
├── backend/                          # Node.js + Express + Socket.IO API
│   ├── src/
│   │   ├── config/                   # DB, Cloudinary, WhatsApp, JWT config
│   │   ├── controllers/              # Route controllers
│   │   ├── models/                   # Mongoose schemas & indexes
│   │   ├── routes/                   # Express route definitions
│   │   ├── services/                 # Business logic (AuctionEngine, Notification, etc.)
│   │   ├── sockets/                  # Socket.IO room handlers & event dispatchers
│   │   ├── middlewares/              # Auth, tenant isolation, rate limiting, error handling
│   │   ├── utils/                    # Formatters, math helpers, logger
│   │   └── server.js                 # HTTP & WebSocket bootstrap
│   ├── tests/                        # Unit, integration & concurrency tests
│   ├── package.json
│   └── .env.example
└── frontend/                         # React + Vite + Tailwind CSS + Framer Motion
    ├── src/
    │   ├── assets/                   # Static branding, sound fx, icons
    │   ├── components/               # Common atomic UI components (Button, Modal, Input, Badge)
    │   ├── context/                  # AuthContext, AuctionContext, SocketContext, ThemeContext
    │   ├── hooks/                    # useAuction, useSocket, useTimer, useSound
    │   ├── layouts/                  # AuctioneerLayout, PublicLayout, AuthLayout
    │   ├── pages/                    # Routed views (Dashboard, LiveAuction, PublicTracker, etc.)
    │   ├── services/                 # Axios API clients & Socket wrappers
    │   ├── utils/                    # Currency formatters, cricket role helpers
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## 4. Phase Tracking & Progress Status

- [x] **Phase 1: Requirements, Specifications & System Architecture**
- [x] **Phase 2: UI/UX Design System & Frontend Foundations** *(Completed: All platform UI screens, layouts, and Framer Motion transitions)*
- [ ] **Phase 3: Authentication & Multi-Tenant Backend Core** *(Next: Node.js + Express + MongoDB + JWT)*
- [ ] **Phase 4: Tournament Setup & Persistence**
- [ ] **Phase 5: Player Registration & Bulk Import API**
- [ ] **Phase 6: Team Management & Budget Endpoints**
- [ ] **Phase 7: Public Auction Broadcast Endpoints**
- [ ] **Phase 8: Real-Time Bidding Engine (Socket.IO + Redis/In-Memory Gateway)**
- [ ] **Phase 9: Auction Results, Analytics & Data Export**
- [ ] **Phase 10: WhatsApp Notification Integration & Webhook Delivery**
- [ ] **Phase 11: Platform Administration & Super Admin Suite**
- [ ] **Phase 12: End-to-End Testing, Security Hardening & Deployment**
