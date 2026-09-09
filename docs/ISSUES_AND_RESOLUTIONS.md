# SubSentry — Issues, Root Causes & Resolutions

This document catalogues the critical bugs, edge cases, and design improvements identified and resolved across SubSentry.

---

## 1. Summary of Identified Issues & Fixes

| ID | Category | Issue Description | Severity | Target Resolution |
| :--- | :--- | :--- | :--- | :--- |
| **ISS-01** | Runtime Crash | NoneType comparison crash on student expiry check in `/alerts` | Critical | Added presence check before date comparison |
| **ISS-02** | Runtime Crash | IndexError in `/summary` when database is empty | Critical | Added safe empty-state fallback |
| **ISS-03** | Schema Migration | Missing columns (category, payment_method) in pre-existing SQLite DBs | Critical | Implemented `models.init_db()` auto-migration routine on startup |
| **ISS-04** | Input Validation | Pydantic 422 Unprocessable Entity on mixed-case enum inputs | High | Added `@field_validator` with `.strip().lower()` / `.upper()` normalization |
| **ISS-05** | UI / Dark Theme | Solid black monochrome SVG icons blending into dark slate background | High | Replaced with authentic multi-colored brand SVGs (Twitch purple, Discord blurple, etc.) |
| **ISS-06** | Financial Analytics | Category breakdown conflated personal out-of-pocket vs shared/covered plans | High | Added interactive Scope Toggle (`Paid by Me`, `Shared`, `Overall`) |
| **ISS-07** | UX / Usability | Requirement to open VS Code, activate venv, and run terminal commands to launch | High | Created 1-Click Desktop launchers (`start.bat`, `start_background.vbs`, `stop.bat`) |
| **ISS-08** | Notification UX | Monolithic telegram alert was hard to parse quickly | Medium | Upgraded to structured daily briefing with urgency badges and 7-day outflow summary |
| **ISS-09** | Scheduling Flaw | Daily maintenance tasks executed only once on startup | Medium | Integrated `APScheduler` async cron running daily at 09:00 AM |
| **ISS-10** | REST Anti-Pattern | Query parameters used for update (`PUT /update/{id}`) | Medium | Replaced with standard RESTful `PATCH /api/v1/subscriptions/{id}` with JSON body |

---

## 2. Detailed Breakdown & Resolutions

### ISS-03: Missing Columns in Pre-Existing SQLite Databases
- **Problem**: When new columns like `category`, `payment_method`, and `remind_to_cancel` were added to `models.Subscription`, existing `subsentry.db` files did not automatically acquire these columns because `Base.metadata.create_all()` does not alter existing tables in SQLite.
- **Resolution**: Implemented `models.init_db()` using `PRAGMA table_info(subscriptions)` to inspect the database schema on server startup and execute `ALTER TABLE subscriptions ADD COLUMN ...` for any missing columns dynamically without requiring manual migration tools or data loss.

---

### ISS-04: Case-Insensitive Validation for Enums
- **Problem**: Payloads with `"billing_cycle": "Monthly"` or `"plan_type": "Solo"` were rejected with HTTP 422 errors because Pydantic standard enum validation is strictly case-sensitive.
- **Resolution**: Added `@field_validator("plan_type", "billing_cycle", mode="before")` to lowercase all input values and `@field_validator("currency", mode="before")` to uppercase codes before schema validation.

---

### ISS-05: Brand SVG Icon Styling on Dark Background
- **Problem**: SVG files downloaded from monochrome icon sets had default `fill="#000000"`, rendering them as invisible black silhouettes against the slate dark background.
- **Resolution**: Provided vibrant, authentic multicolored brand SVG definitions in `frontend/public/icons/` with proper viewBox and fill layers, dynamically linked by `PlatformAvatar` in `SubscriptionTable.tsx`.

---

### ISS-06: Category Spending Breakdown Scope Toggle
- **Problem**: Category analytics and monthly spend totals previously only showed personal subscriptions, making it impossible to see the total value of shared/family plans covered by others or overall service distribution.
- **Resolution**: Enhanced `ExpenseChart.tsx` with a responsive segmented pill control (`Paid by Me`, `Shared`, `Overall`) that dynamically recalculates currency-normalized category distributions and monthly totals.

---

### ISS-07: 1-Click Desktop & Silent Background Execution
- **Problem**: Launching the application required opening VS Code, remembering terminal commands, and leaving a terminal window open.
- **Resolution**: Created `start.bat`, `start_background.vbs`, and `stop.bat`, and automatically deployed desktop shortcuts (`SubSentry.lnk` and `Stop SubSentry.lnk`) with custom icons.
