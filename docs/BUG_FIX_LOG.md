# BidX Bug Fix Log

**Updated:** 2026-11-13

This log records changes actually made in this checkout. Prior entries claiming live Atlas, Render, and multiplayer validation were removed because they were not reproducible from the repository and available test evidence.

## 2026-11-13 — Remove mock authentication and expired-token bypass

- **Affected files:** `backend/src/middlewares/auth.js`, `frontend/src/context/AuthContext.jsx`
- **Root cause:** The browser accepted hardcoded demo credentials and generated `jwt_mock_token_admin_*`; backend middleware treated that token as an authenticated active user. The middleware also retried expired JWTs with expiration ignored.
- **Change:** Login now requires a successful backend response. API protection requires a valid, unexpired JWT.
- **Retest:** Existing backend unit suite passed (14/14); frontend production build passed. HTTP auth behavior still needs isolated database integration coverage.

## 2026-11-13 — Stop reporting mock create/review operations as success

- **Affected file:** `frontend/src/context/AuctionContext.jsx`
- **Root cause:** On API failures, several create, review, update, and delete callbacks updated local state or returned success, making unsaved data appear persisted.
- **Change:** Removed local mock-success fallbacks for registration review, player/team/auction creation, auction status updates, and auction deletion. Callbacks now report failures.
- **Retest:** Frontend production build passed. Browser error-state flows were not exercised.

## 2026-11-13 — Reject auction-less player creation and invalid registration links

- **Affected file:** `backend/src/controllers/playerController.js`
- **Root cause:** Missing auction IDs and unknown public registration slugs silently selected the first auction in the database. Registration review also allowed arbitrary statuses and repeat reviews.
- **Change:** Removed implicit first-auction selection; restricted create-player lookup to the authenticated tenant; restricted registration review lookup to tenant and allowed only one PENDING-to-APPROVED/REJECTED review.
- **Retest:** Source reviewed. Concurrent duplicate review and persistence require database integration tests.

## 2026-11-13 — Reduce personal fields in public responses

- **Affected files:** `backend/src/controllers/auctionController.js`, `backend/src/controllers/teamController.js`
- **Root cause:** Public auction/team responses populated or returned contact fields that are not needed by spectator pages.
- **Change:** Excluded player email/contact number and team owner contact from the affected public responses.
- **Retest:** Production build passed; response payloads were not exercised through HTTP tests.

## 2026-11-13 — Remove bundled sample records from active app state

- **Affected file:** `frontend/src/context/AuctionContext.jsx`
- **Root cause:** The shared app context initialized auction, team, player, and registration state from `mockData.js`, so API failures or empty responses could leave sample data visible.
- **Change:** Context now starts with empty collections and sets tournament/team/player state from the public API response.
- **Retest:** Production build passed; browser empty/loading states still need interaction testing.

## 2026-11-13 — Make tournament activation load its auction data

- **Affected files:** `frontend/src/context/AuctionContext.jsx`, `frontend/src/context/AuthContext.jsx`, `frontend/src/pages/organiser/TournamentsManager.jsx`
- **Root cause:** Selecting another tournament changed the selected ID but kept the prior tournament's teams, players, lot, and registrations in shared state.
- **Change:** Load the selected tournament's live state and registrations, clear the old tournament data during loading, fetch the organiser's auction list after login, and activate a tournament when its state is changed to LIVE.
- **Retest:** Frontend production build passed; switching was not exercised in a browser.

## 2026-11-13 — Force points mode through display and auction setup

- **Affected files:** tournament, organiser, live, public, formatting, and WhatsApp notification components/services; auction controller.
- **Root cause:** Auction type and currency could disagree, while screens displayed currency labels in points mode.
- **Change:** Points auctions now store/use `POINTS`, omit the currency selector, use points-specific defaults/labels, and format point totals without currency prefixes.
- **Retest:** Frontend build and existing backend suite passed; no persisted auction was created or updated in a database.

## 2026-11-13 — Replace image URL fields and simulated spreadsheet preview

- **Affected files:** `frontend/src/pages/organiser/TeamsManager.jsx`, `frontend/src/pages/organiser/PlayersManager.jsx`, `frontend/src/services/api.js`, backend upload/import routes/controllers/services.
- **Root cause:** Team branding asked for a color instead of a logo file, manual player entry asked for a URL, and the spreadsheet handler showed hardcoded sample rows without reading the selected file.
- **Change:** Added local image selection/preview and signed Cloudinary upload for team logos and player photos. Added CSV/XLS/XLSX parsing, per-row validation, tenant auction targeting, and database persistence for valid players.
- **Retest:** Frontend production build, backend syntax checks, and existing 14 backend unit checks passed. Remote Cloudinary uploads and database imports need configured external services and an isolated database.
