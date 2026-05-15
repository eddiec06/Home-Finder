# HomeFinder — Product Requirements Document (PRD)

## Original problem statement
University CS project: "HomeFinder" prototype. Brief requested Java Spring Boot + MySQL + plain HTML/CSS/JS. User chose **Option A** during clarification: implement using the Emergent platform stack (FastAPI + MongoDB + minimal React shell) while preserving the architectural intent.

## Architecture decisions
- Layered backend: `controllers → services → repositories` (mirrors Spring MVC).
- **Singleton SessionManager** at `/app/backend/core/session_manager.py` (double-checked locking, `_instance`, `currentUser` property — matches the SIS).
- bcrypt password hashing + PyJWT for tokens (access JWT after MFA; short-lived `mfa_challenge` JWT between step 1 and step 2).
- Parameterised property search via Motor/Mongo dict filters (analogue to JDBC parameterised SQL; commented in repository).
- MFA = SIMULATED. Code logged to backend stdout AND returned in login response as `simulated_code` (controlled by `SIMULATE_MFA` env var).

## Core requirements (static)
1. Two-step login: email/password → 6-digit MFA code.
2. Public property search filtered by `location` + price range.
3. Admin-only CRUD for property listings.
4. Educational code style: layered, commented, minimal boilerplate.

## User personas
- **Student / browser** (anonymous) — searches properties.
- **Admin** (`admin@homefinder.local` / `Admin@123`) — manages listings.

## What's been implemented (Feb 2026)
- Backend: `/api/auth/login`, `/api/auth/mfa/verify`, `/api/auth/me`, `/api/auth/logout`, `/api/properties` (search), `/api/admin/properties` (POST/PUT/DELETE).
- Singleton SessionManager + bcrypt + JWT + TTL-indexed MFA challenges.
- Mongo collections: `users`, `properties`, `mfa_challenges`.
- Idempotent seed: admin user + 6 sample properties.
- Frontend: Home (browse + search), Login, MFA Verify (with simulated-code banner), Admin Dashboard (CRUD table + modal form).
- Testing: 14/14 backend pytest + 10/10 frontend e2e flows pass.

## Backlog / Next action items
**P1 (would round it out for a viva)**
- "Register" endpoint + page for normal users (currently only admin is seeded).
- Pagination + saved-search for the property grid.
- Replace `window.confirm` delete with the existing styled modal.

**P2 (nice-to-have)**
- Property detail page (`/property/:id`) with image gallery & contact form.
- Tighten CORS allow_origins to the frontend URL in production.
- Real SMTP delivery for MFA (toggle `SIMULATE_MFA=false`).
- Persist sessions in Redis instead of in-memory SessionManager dict.
