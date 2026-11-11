# REST API Specification — CBid

## 1. Overview & General Standards

- **Base URL:** `/api/v1`
- **Authentication:** Bearer JWT in `Authorization: Bearer <token>` header.
- **Content Type:** `application/json` (except multipart for file uploads).
- **Date Format:** ISO 8601 UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`).

### Standard Response Envelopes

#### Success Envelope
```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

#### Error Envelope
```json
{
  "success": false,
  "statusCode": 400,
  "error": {
    "code": "INSUFFICIENT_PURSE_BALANCE",
    "message": "Bid amount exceeds team maximum allowed purse after squad reserve calculation",
    "details": []
  }
}
```

---

## 2. API Endpoints Catalog

### 2.1 Authentication & Profile (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register a new organiser account (Model A SaaS) |
| `POST` | `/auth/login` | Public | Authenticate with email/password; returns JWT |
| `GET` | `/auth/me` | Authenticated | Fetch current user profile, role, and tenant info |
| `POST` | `/auth/logout` | Authenticated | Invalidate token / session |

---

### 2.2 Auction Management (`/api/v1/auctions`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/auctions` | Organiser | List all auctions owned by the tenant |
| `POST` | `/auctions` | Organiser | Create a new tournament auction |
| `GET` | `/auctions/:id` | Organiser | Get full tournament configuration details |
| `PUT` | `/auctions/:id` | Organiser | Update tournament rules, purse, and timer settings |
| `DELETE`| `/auctions/:id` | Organiser | Delete draft auction (only if status is `DRAFT`) |
| `POST` | `/auctions/:id/status` | Organiser | Change auction state (`SCHEDULED`, `LIVE`, `PAUSED`, `COMPLETED`) |

#### Example: Create Tournament Payload
```json
{
  "title": "Lanka Champions Trophy 2026",
  "slug": "lct-2026",
  "type": "MONEY",
  "currency": "LKR",
  "currencyNotation": "SOUTH_ASIAN",
  "startingPurse": 50000000,
  "minSquadSize": 15,
  "maxSquadSize": 18,
  "maxOverseasPlayers": 5,
  "minBasePrice": 50000,
  "timerSeconds": 30,
  "bidIncrements": [
    { "from": 0, "to": 100000, "increment": 10000 },
    { "from": 100000, "to": 500000, "increment": 25000 },
    { "from": 500000, "to": 2000000, "increment": 50000 },
    { "from": 2000000, "to": 10000000, "increment": 100000 }
  ]
}
```

---

### 2.3 Team Management (`/api/v1/auctions/:auctionId/teams`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/:auctionId/teams` | Organiser / Public | List all participating franchises |
| `POST` | `/:auctionId/teams` | Organiser | Add a new team with logo and initial purse |
| `GET` | `/:auctionId/teams/:teamId` | Organiser / Public | Get team details and acquired squad roster |
| `PUT` | `/:auctionId/teams/:teamId` | Organiser | Update team details or logo |
| `DELETE`| `/:auctionId/teams/:teamId` | Organiser | Remove team (only if 0 players acquired) |

---

### 2.4 Player Management & Bulk Operations (`/api/v1/auctions/:auctionId/players`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/:auctionId/players` | Organiser | Paginated, filterable player list |
| `POST` | `/:auctionId/players` | Organiser | Manually register a single player |
| `PUT` | `/:auctionId/players/:playerId`| Organiser | Edit player info, base price, category |
| `DELETE`| `/:auctionId/players/:playerId`| Organiser | Remove player from auction |
| `POST` | `/:auctionId/players/import` | Organiser | Bulk upload players via Excel/CSV |
| `GET` | `/:auctionId/players/export` | Organiser | Export full roster with auction status to Excel |
| `POST` | `/:auctionId/players/reorder`| Organiser | Reorder lot sequence numbers |

---

### 2.5 Player Registration Subsystem (`/api/v1/registrations`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/public/:auctionSlug` | Public | Submit player registration form |
| `GET` | `/tenant/:auctionId` | Organiser | View pending registration queue |
| `POST` | `/:registrationId/review` | Organiser | Approve (assign category/price) or Reject |

---

### 2.6 Public Broadcast Endpoints (`/api/v1/public/auctions/:slug`)

High-performance, cached, read-only endpoints formatted for public spectators:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/overview` | Tournament banner, overall stats, purse totals, status |
| `GET` | `/live-lot` | Current player on the auction block, leading bid, timer |
| `GET` | `/players` | Filterable directory (`?status=SOLD&role=FAST_BOWLER&category=MARQUEE`) |
| `GET` | `/teams` | Franchise cards with remaining budgets and squad counts |
| `GET` | `/stats` | Cricbuzz-style stats: Top Buys, Average Spend, Category charts |

---

### 2.7 Media & File Uploads (`/api/v1/media`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/signature` | Authenticated / Public (rate-limited) | Generates Cloudinary signed upload token |

---

### 2.8 Platform Administration (`/api/v1/admin`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/tenants` | Super Admin | List all platform tenants and subscriptions |
| `POST` | `/admin/tenants/:id/status` | Super Admin | Activate or suspend tenant access |
| `GET` | `/admin/system-logs` | Super Admin | Audit trail and critical event telemetry |
| `GET` | `/admin/whatsapp/status` | Super Admin | Delivery success rate and API error logs |
