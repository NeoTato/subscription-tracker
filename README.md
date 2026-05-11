# 🔐 SubSentry — Subscription Tracking API

SubSentry is a personal subscription management API that tracks recurring payments, sends smart alerts, and normalizes costs across billing cycles and currencies — all in one place.

Built with **FastAPI** and **SQLite**, this project focuses on clean data modeling, automated renewal tracking, and real-time Telegram notifications.

---

##  Features

- **Full CRUD** — Add, view, update, and delete subscriptions
- **Cost Normalization** — Converts all billing cycles (daily, weekly, monthly, yearly) to a monthly PHP equivalent for accurate spending summaries
- **Multi-currency Support** — Handles PHP, USD, and JPY conversions automatically
- **Auto Date Advance** — Automatically rolls over overdue `next_due_date` values on startup
- **Telegram Notifications** — Sends formatted alerts for subscriptions due within 7 days and cancellation reminders
- **Smart Alerts** — Flags subscriptions to cancel, student plan expiries, and upcoming payments

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language | Python |
| Framework | FastAPI |
| Database | SQLite via SQLAlchemy ORM |
| Validation | Pydantic |
| Notifications | Telegram Bot API |
| Environment | python-dotenv |

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/subsentry.git
cd subsentry
```

### 2. Set Up Virtual Environment
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory:
```
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### 5. Run the Application
```bash
python -m uvicorn main:app --reload
```

### 6. Access the API
Visit the interactive Swagger UI at: http://127.0.0.1:8000/docs

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Home page |
| `GET` | `/subscription` | List all subscriptions (id, name, price) |
| `GET` | `/subscription/{id}` | Get a single subscription |
| `GET` | `/table` | Full table sorted by due date |
| `GET` | `/summary` | Monthly total, next payment, full breakdown |
| `GET` | `/alerts` | Due-soon, cancellation, and student expiry alerts |
| `POST` | `/add` | Add a new subscription |
| `PUT` | `/update/{id}` | Update an existing subscription |
| `DELETE` | `/delete/{id}` | Delete a subscription |

---

## 🗂️ Project Structure

```
subsentry/
├── main.py            # API endpoints and app lifecycle
├── models.py          # SQLAlchemy database models
├── schemas.py         # Pydantic validation schemas
├── utils.py           # Helper functions (cost normalization, currency conversion)
├── notifications.py   # Telegram notification logic
├── .env               # Environment variables (not committed)
└── requirements.txt   # Project dependencies
```

---

## 🗺️ Roadmap

- [x] Full CRUD for subscriptions
- [x] Database schema and ORM setup
- [x] Monthly cost normalization across billing cycles
- [x] Multi-currency conversion (PHP, USD, JPY)
- [x] Auto-advance overdue renewal dates on startup
- [x] Telegram notifications for due-soon and cancellation alerts
- [ ] Scheduled daily notifications via APScheduler
- [ ] Email notifications via SMTP or SendGrid
- [ ] Clean frontend dashboard (HTML/CSS or React)
- [ ] User authentication
- [ ] Cloud deployment (Railway / Render)

---

## 👨‍💻 Author

Built by NeoTato as a personal project to practice FastAPI, SQLAlchemy, and real-world API design.