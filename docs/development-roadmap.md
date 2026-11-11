# Detailed Development Roadmap & Milestones — CBid

## Phase Summary Overview

```mermaid
gantt
    title CBid 12-Phase Development Roadmap
    dateFormat  YYYY-MM-DD
    section Architectural Core
    Phase 1: Specs & Architecture     :done,    p1, 2026-11-11, 2026-11-12
    Phase 2: UI Design & Foundations  :active,  p2, 2026-11-12, 2026-11-14
    Phase 3: Auth & Multi-Tenancy     :         p3, 2026-11-14, 2026-11-16
    section Operations & Setup
    Phase 4: Auctioneer Admin & Config:         p4, 2026-11-16, 2026-11-18
    Phase 5: Player Registration & Hub:         p5, 2026-11-18, 2026-11-20
    Phase 6: Team & Squad Management  :         p6, 2026-11-20, 2026-11-22
    section Live Experience
    Phase 7: Public Broadcast Tracker :         p7, 2026-11-22, 2026-11-24
    Phase 8: Real-time Bidding Engine :         p8, 2026-11-24, 2026-11-27
    Phase 9: Stats & Cricbuzz Tracker :         p9, 2026-11-27, 2026-11-29
    section Enterprise Integrations
    Phase 10: WhatsApp Notification   :         p10, 2026-11-29, 2026-12-01
    Phase 11: Super Admin Console     :         p11, 2026-12-01, 2026-12-03
    Phase 12: Hardening & Deployment  :         p12, 2026-12-03, 2026-12-06
```

---

## Phase 1: Requirements & System Architecture *(Current Phase)*
- **Objectives:** Establish complete architectural specifications, data schemas, API contracts, real-time protocols, and development rules.
- **Tasks:**
  - Author complete documentation suite in `docs/`.
  - Establish permanent instructions in `GEMINI.md`.
  - Validate core business decisions with the stakeholder.
- **Expected Deliverables:** 10 specification documents, project instructions, architectural blueprints.
- **Dependencies:** None.
- **Acceptance Criteria:** Full stakeholder alignment on architecture and business questions.

---

## Phase 2: UI/UX Design System & Frontend Foundations
- **Objectives:** Build the core frontend component library, theme tokens, layout wrappers, and Framer Motion animation primitives.
- **Tasks:**
  - Initialize Vite React application with Tailwind CSS and Lucide React.
  - Implement custom color system (Obsidian surfaces, Cyan/Emerald/Gold accents).
  - Build atomic UI kit: `Button`, `Input`, `Modal`, `Badge`, `Card`, `Skeleton`, `TabGroup`.
  - Implement motion variants (spring configs, number ticker, pulse timer, sold celebration overlay).
  - Create layout shells: `AuctioneerLayout`, `PublicLayout`, `DashboardLayout`.
- **Expected Deliverables:** Responsive, interactive story/preview of all design components and layouts.
- **Dependencies:** Phase 1 approved.
- **Acceptance Criteria:** Passes visual inspection across desktop and mobile; 60fps animations.

---

## Phase 3: Authentication & Multi-Tenant Core
- **Objectives:** Establish backend Express server, MongoDB Mongoose models, JWT auth pipeline, and tenant isolation guards.
- **Tasks:**
  - Setup Express server with security headers (`helmet`, `cors`, `rate-limit`).
  - Configure MongoDB connection with replica-ready indexing.
  - Implement `User` and `Tenant` models with password hashing (bcrypt).
  - Build `authRoutes` (register, login, me, logout).
  - Implement `tenantMiddleware` and `roleMiddleware`.
- **Expected Deliverables:** Fully functional multi-tenant authentication system with protected route wrappers.
- **Dependencies:** Phase 2 foundations.
- **Acceptance Criteria:** Tenant A cannot read or mutate Tenant B records; JWT tokens validate correctly.

---

## Phase 4: Auctioneer Dashboard & Tournament Setup
- **Objectives:** Allow organisers to create, configure, schedule, and view tournaments.
- **Tasks:**
  - Build tournament creation wizard (LKR/Points, starting purse, min/max squad, overseas caps).
  - Implement dynamic bid increment ladder builder.
  - Create tournament list, status switcher (`DRAFT` $\rightarrow$ `SCHEDULED`), and overview KPI widgets.
- **Expected Deliverables:** Operational tournament configuration hub.
- **Dependencies:** Phase 3 auth.
- **Acceptance Criteria:** Organisers can configure rule ladders and persist settings with full validation.

---

## Phase 5: Player Registration, Review Workflow & Bulk Import
- **Objectives:** Build public registration page and organiser review/approval pipeline.
- **Tasks:**
  - Create responsive public registration form (`/register/:auctionSlug`).
  - Integrate Cloudinary direct signed upload with face-detection auto-crop.
  - Implement organiser review dashboard (approve, reject, assign category & base price).
  - Build Excel/CSV bulk import parser with column validation and preview.
- **Expected Deliverables:** Complete player lifecycle from self-registration to approved lot queue.
- **Dependencies:** Phase 4 tournament setup.
- **Acceptance Criteria:** 100+ players imported via Excel in $< 3$ seconds; mobile form submission functional.

---

## Phase 6: Team Management, Squad Limits & Budget Configurations
- **Objectives:** Enable creation and management of participating franchises.
- **Tasks:**
  - Franchise creation form with logo upload, brand colors, and owner info.
  - Set starting purse and automatic minimum squad reserve calculation.
  - Squad review panel showing current roster composition, overseas count, and purse breakdown.
- **Expected Deliverables:** Comprehensive team management suite.
- **Dependencies:** Phase 4.
- **Acceptance Criteria:** Starting purse locked; squad counts dynamically tracked.

---

## Phase 7: Public Auction Broadcast Dashboard (Cricbuzz-inspired)
- **Objectives:** Build the read-only, high-performance public viewing experience.
- **Tasks:**
  - Create tournament public landing page (`/:slug`).
  - Build Hero Live Lot card with current player portrait, stats, and real-time bid display.
  - Implement faceted searchable player directory (All, Sold, Unsold, Categories, Roles).
  - Build team squad cards with animated purse depletion progress bars.
  - Implement sold celebration modal/banner for public viewers.
- **Expected Deliverables:** Broadcast-quality public web experience without login requirements.
- **Dependencies:** Phases 5 & 6.
- **Acceptance Criteria:** Zero private player data exposed; instantaneous faceted filtering.

---

## Phase 8: Real-Time Bidding Engine (Socket.IO + Timers)
- **Objectives:** Power live auction floor with bidirectional WebSockets and atomic state operations.
- **Tasks:**
  - Establish Socket.IO gateway with isolated room namespaces.
  - Build Auctioneer Cockpit with keyboard shortcuts, rapid bid increment buttons, and team selector.
  - Implement server-authoritative countdown timer with timestamp delta sync.
  - Implement atomic bid processing with reserve fund verification.
  - Implement hammer actions (`MARK_SOLD`, `MARK_UNSOLD`, `UNDO_BID`) with audit logging.
- **Expected Deliverables:** Fully functional real-time auction engine with zero race conditions.
- **Dependencies:** Phase 7 public views.
- **Acceptance Criteria:** Two simultaneous bids resolve deterministically; timer synchronizes across devices without drift.

---

## Phase 9: Auction Results, Analytics & Data Export
- **Objectives:** Deliver Cricbuzz-style auction analytics and post-auction reporting.
- **Tasks:**
  - Implement top buys leaderboard, highest bids, and most expensive players.
  - Build category spending charts and team purse utilization visualizers.
  - Export final tournament results to structured Excel and PDF summaries.
- **Expected Deliverables:** Complete analytics suite and official tournament records.
- **Dependencies:** Phase 8 bidding engine.
- **Acceptance Criteria:** Accurate aggregate calculations; one-click Excel export.

---

## Phase 10: WhatsApp Notification Integration
- **Objectives:** Deliver automated transactional WhatsApp messages to players upon being acquired.
- **Tasks:**
  - Implement `NotificationService` connecting to Meta WhatsApp Cloud API / Twilio.
  - Setup pre-approved template payload formatting.
  - Implement webhook receiver for delivery status tracking (`SENT`, `DELIVERED`, `READ`).
  - Build retry worker with exponential backoff for failed deliveries.
- **Expected Deliverables:** Automated, reliable player WhatsApp notifications.
- **Dependencies:** Phase 8 hammer sold events.
- **Acceptance Criteria:** Players receive message within 5 seconds of lot hammer; delivery statuses logged.

---

## Phase 11: Platform Administration (Super Admin Suite)
- **Objectives:** Provide global multi-tenant oversight for platform operators.
- **Tasks:**
  - Build Super Admin dashboard displaying total tenants, global auctions, and system health.
  - Implement tenant provisioning, quota adjustments, and account suspension.
  - Global audit log explorer and WhatsApp cost/delivery monitoring.
- **Expected Deliverables:** Comprehensive platform management console.
- **Dependencies:** Phases 3-10.
- **Acceptance Criteria:** Super Admin can monitor and manage any tenant or auction.

---

## Phase 12: Testing, Security Hardening & Deployment
- **Objectives:** Full system security review, load testing, and deployment preparation.
- **Tasks:**
  - Conduct end-to-end integration and concurrency tests.
  - Run security audits (OWASP Top 10, rate limiting, SQL/NoSQL injection prevention).
  - Configure production build scripts and environment deployment manifests.
- **Expected Deliverables:** Production-ready commercial platform with zero critical vulnerabilities.
- **Dependencies:** All previous phases.
- **Acceptance Criteria:** Passes all automated unit, integration, and concurrency test suites.
