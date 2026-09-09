# SubSentry — Subscription Tracking API

SubSentry is a lightweight subscription management API that tracks recurring payments, normalizes costs across billing cycles and currencies, and sends alerts (Telegram by default).

Built with FastAPI + SQLite for a simple, single-user setup that is easy to extend to multi-user deployments.

---

## Quick Overview

- CRUD for subscriptions (create/read/update/delete)
- Converts billing cycles to a monthly equivalent and normalizes currencies
- Auto-advances overdue `next_due_date` values on startup
- Telegram notifications for due-soon and cancellation reminders

---

## Setup & Run (local)

1. Create and activate a virtual environment

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
venv\bin\activate.bat # This also works
# macOS / Linux
source .venv/bin/activate
```

2. Install dependencies

```bash
pip install -r requirements.txt
```

3. Create `.env` with at minimum:

```
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

4. Start the app (development)

```bash
python -m uvicorn main:app --reload
```

5. Open the API docs: `http://127.0.0.1:8000/docs`

Notes:

- The default SQLite DB file is `subsentry.db` in the project root.
- FastAPI exposes an OpenAPI spec at `/openapi.json` which is useful for frontend tooling.

---

## Useful Examples

Create a subscription (curl):

```bash
curl -X POST "http://127.0.0.1:8000/add" -H "Content-Type: application/json" -d '{
	"name": "YouTube Premium",
	"price": 159.0,
	"next_due_date": "2026-12-01",
	"billing_cycle": "monthly",
	"currency": "PHP"
}'
```

Get all subscriptions:

```bash
curl http://127.0.0.1:8000/subscription
```

Update a subscription (partial fields via query params):

```bash
curl -X PUT "http://127.0.0.1:8000/update/1?new_price=199.0"
```

---

## API Endpoints (summary)

- `GET /` — Home (basic links)
- `GET /subscription` — List subscriptions (id, name, price, billing cycle, next_due_date)
- `GET /get/{id}` — Get a single subscription by id
- `GET /table` — Compact table view (name, price, billing date)
- `GET /summary` — Monthly normalized total and next payment
- `GET /alerts` — Urgent reminders, due-soon, student-expiry reminders
- `POST /add` — Add a subscription (JSON body following `SubscriptionCreate` in `schemas.py`)
- `PUT /update/{id}` — Update fields via query parameters
- `DELETE /delete/{id}` — Delete a subscription

---

- Add authentication and per-user isolation before exposing to the public.
- Replace direct DB file usage with a proper migrations flow (Alembic) for schema changes.
- Harden input validation (Pydantic models) and return consistent response models.
- Add tests for `utils.to_monthly`, `utils.advance_due_dates`, and `notifications.format_message`.
- Convert `/update/{id}` to accept a JSON body for partial updates (PATCH semantics) rather than many query params.

---

## Frontend / React SPA

SubSentry is designed to connect to a modern React / Vite SPA frontend with Tailwind CSS and Lucide icons.

---

## Security

- Keep `.env` out of source control; use a secrets manager for production.
- Validate and sanitize all input before writing to DB.

---

## License & Author

Built by NeoTato as a personal project to practice FastAPI, SQLAlchemy, and real-world API design.
