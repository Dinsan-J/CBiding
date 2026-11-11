# CBid — Premium Cricket Auction Management Platform

CBid is a commercial-grade, multi-tenant cricket auction management platform inspired by the information architecture of broadcast trackers such as Cricbuzz's WPL Auction tracker.

It delivers a dual-experience architecture:
1. **Auctioneer Dashboard & Live Cockpit:** Private, high-density, keyboard-driven operational control desk for managing live bidding, squads, and financial purses with zero race conditions.
2. **Public Auction Dashboard:** High-performance, broadcast-style web experience for cricket fans and spectators featuring real-time lot bidding, sold celebrations, squad exploration, and rich tournament analytics.

---

## Architecture at a Glance

- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Lucide React, React Router v6 (JavaScript & JSX only).
- **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT Authentication.
- **Integrations:** Cloudinary (smart media pipeline), Meta WhatsApp Business Platform (transactional player alerts).

---

## Architectural Documentation

Full project blueprints, schemas, and specifications are located in the [`docs/`](./docs) directory:

1. [Product Requirements Document](file:///c:/Users/Uni/Desktop/CBid/docs/product-requirements.md)
2. [System Architecture Specification](file:///c:/Users/Uni/Desktop/CBid/docs/system-architecture.md)
3. [Database Schema & ER Design](file:///c:/Users/Uni/Desktop/CBid/docs/database-design.md)
4. [User Roles & Permissions](file:///c:/Users/Uni/Desktop/CBid/docs/user-roles-and-permissions.md)
5. [REST API Specification](file:///c:/Users/Uni/Desktop/CBid/docs/api-specification.md)
6. [Real-time Auction Engine Specification](file:///c:/Users/Uni/Desktop/CBid/docs/realtime-auction-engine.md)
7. [UI/UX Design System & Motion Specification](file:///c:/Users/Uni/Desktop/CBid/docs/ui-ux-design-system.md)
8. [Development Roadmap & Milestones](file:///c:/Users/Uni/Desktop/CBid/docs/development-roadmap.md)
9. [Security & Multi-Tenant Isolation Plan](file:///c:/Users/Uni/Desktop/CBid/docs/security-plan.md)
10. [Quality Assurance & Testing Strategy](file:///c:/Users/Uni/Desktop/CBid/docs/testing-strategy.md)
11. [Master Project Instructions](file:///c:/Users/Uni/Desktop/CBid/GEMINI.md)
