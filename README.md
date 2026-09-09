# 🔐 SubSentry — Intelligent Personal Subscription Tracker

[![FastAPI](https://img.shields.io/badge/FastAPI-2.0.0-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57.svg?logo=sqlite&logoColor=white)](https://sqlite.org)
[![Tests](https://img.shields.io/badge/Tests-7%2F7%20Passing-brightgreen.svg?logo=pytest&logoColor=white)](https://pytest.org)

**SubSentry** is an intelligent, privacy-first personal subscription tracking suite. It features a modern **React + Vite** single-page web dashboard and a high-performance **FastAPI** backend with automatic multi-currency FX normalization, intelligent daily due-date rollovers, proactive Telegram notifications, and quick service presets.

---

## ✨ Features

- 📊 **Interactive Web Dashboard**: Beautiful dark-mode UI built with React, TypeScript, Tailwind CSS, Lucide icons, and Recharts.
- ⚡ **Quick Service Presets**: 1-click autofill for popular services:
  - **Twitch**: Tiers 1–3 (`₱100`, `₱200`, `₱500`) with streamer channel naming
  - **Discord Nitro**: Nitro Basic (`₱99`), Nitro Full (`₱263.99`), Nitro Yearly (`₱2,639.99`)
  - **YouTube**: Premium Individual (`₱159`), Family (`₱239`), Student (`₱95`), Channel Memberships (`₱129`)
  - **Spotify**: Individual (`₱149`), Duo (`₱199`), Family (`₱279`), Student (`₱75`)
  - **Netflix, OpenAI / ChatGPT Plus, Google One / AI Pro, GitHub Copilot, Apple One / iCloud+, Disney+, Crunchyroll**
- 🎨 **Authentic Brand SVG Icons**: Crisp, colorful brand icons for Discord, Twitch, Spotify, YouTube, Google, and more.
- 💱 **Multi-Currency Normalization**: Standardizes USD, JPY, EUR, GBP, and SGD into Philippine Pesos (PHP) to give accurate monthly and annual expense projections.
- 🔄 **Category Breakdown with Scope Toggle**:
  - 🟢 **Paid by Me**: Personal financial outflow and category distribution
  - 👥 **Shared / Covered**: Value of family/shared plans covered by others
  - 🌐 **Overall**: Full ecosystem subscription value
- ⏰ **Automated Due Date Rollover**: Auto-advances overdue dates (`daily`, `weekly`, `monthly`, `yearly`) using calendar-aware `relativedelta` math at 9:00 AM daily or on-demand via the Sync button.
- 📱 **Rich Daily Briefing via Telegram**: Structured markdown alerts with urgency badges (`[DUE TODAY]`, `[IN N DAYS]`), cancellation reminders, and 7-day upcoming outflow totals.
- 🚀 **1-Click Desktop Launchers**: Launch or stop SubSentry silently in the background right from your Windows desktop.
- 🛡️ **Auto-Migrating SQLite Database**: Automatically validates and adds missing columns (`category`, `payment_method`, etc.) on startup without manual SQL commands.

---

## 🚀 Quick Start

### 1. One-Click Desktop Launch (Windows)
Double-click the **`SubSentry`** shortcut on your Desktop (or run [`start.bat`](file:///c:/ProgrammingStuff/Projects/subscription_tracker/start.bat) in the project folder).
- Starts the FastAPI backend in the background.
- Automatically opens your browser to `http://127.0.0.1:8000`.
- To stop the server anytime, double-click **`Stop SubSentry`** (or [`stop.bat`](file:///c:/ProgrammingStuff/Projects/subscription_tracker/stop.bat)).

---

### 2. Manual Development Setup

#### Prerequisites
- **Python 3.12+**
- **Node.js 18+** & npm

#### Setup Backend
```bash
# Clone the repository
git clone https://github.com/NeoTato/subscription-tracker.git
cd subscription-tracker

# Create & activate virtual environment
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env  # Or edit .env
```

#### Configure `.env`
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
PORT=8000
HOST=127.0.0.1
```

#### Build Frontend & Run Server
```bash
# Build React frontend
cd frontend
npm install
npm run build
cd ..

# Run backend API & serve SPA
.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
Open **`http://127.0.0.1:8000`** in your browser.

---

## 📡 API Reference

Interactive OpenAPI documentation is available at **`http://127.0.0.1:8000/docs`**.

### 1. Subscriptions (`/api/v1/subscriptions`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/subscriptions` | List all subscriptions with sorting and filtering |
| `GET` | `/api/v1/subscriptions/{id}` | Get subscription details by ID |
| `POST` | `/api/v1/subscriptions` | Create a new subscription (returns `201 Created`) |
| `PATCH` | `/api/v1/subscriptions/{id}` | Partially update subscription fields |
| `DELETE` | `/api/v1/subscriptions/{id}` | Delete a subscription |

### 2. Analytics (`/api/v1/analytics`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/analytics/summary` | Monthly/annual totals, next upcoming payment, and category breakdown |
| `GET` | `/api/v1/analytics/alerts` | Active alerts: due within 7 days, cancel reminders, student expiries |

### 3. Maintenance & Notifications (`/api/v1/maintenance`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/maintenance/advance-dates` | Advance all overdue billing dates to their next upcoming cycle |
| `POST` | `/api/v1/maintenance/trigger-notification` | Dispatch instant Telegram daily briefing alert |

---

## 🧪 Testing

SubSentry includes an automated test suite verifying CRUD operations, cost normalization, edge cases, and empty-state resilience:

```bash
# Run tests with pytest
.venv\Scripts\pytest
```

---

## 📂 Project Structure

```
subscription_tracker/
├── frontend/                     # React + TypeScript SPA
│   ├── public/
│   │   └── icons/                # Colored platform SVG icons (Twitch, Discord, etc.)
│   ├── src/
│   │   ├── components/
│   │   │   ├── AlertBanner.tsx       # Urgent payment/cancellation alert banners
│   │   │   ├── ExpenseChart.tsx      # Donut breakdown chart with scope toggle
│   │   │   ├── KPIOverview.tsx       # Monthly spend, active subs, upcoming payment cards
│   │   │   ├── Navbar.tsx            # Header controls, sync, and alert trigger
│   │   │   ├── SubscriptionModal.tsx # Preset service selector & add/edit form
│   │   │   └── SubscriptionTable.tsx # Searchable table with avatar badges
│   │   ├── services/api.ts       # Axios client & TypeScript models
│   │   └── App.tsx               # Main SPA layout & state orchestrator
│   └── dist/                     # Compiled frontend assets served by FastAPI
├── routers/                      # Modular FastAPI routers
│   ├── subscriptions.py          # REST CRUD endpoints
│   ├── analytics.py              # Financial KPIs & alert queries
│   ├── maintenance.py            # Date rollover & alert dispatching
│   └── legacy.py                 # Backward-compatible routes
├── docs/                         # Technical documentation & testing guides
│   ├── ARCHITECTURE_AND_SYSTEM_DESIGN.md
│   ├── ISSUES_AND_RESOLUTIONS.md
│   └── MANUAL_TESTING_GUIDE.md
├── models.py                     # SQLAlchemy database models & auto-migration
├── schemas.py                    # Pydantic schemas with case-insensitive validators
├── utils.py                      # Multi-currency normalization & date rollover logic
├── notifications.py              # Telegram alert formatting & delivery engine
├── main.py                       # FastAPI application & APScheduler setup
├── start.bat                     # 1-Click interactive launcher
├── start_background.vbs          # 1-Click silent background launcher
└── stop.bat                      # 1-Click server shutdown script
```

---

## 📄 License & Author

Developed by **[NeoTato](https://github.com/NeoTato)** as a personal project for elegant subscription management.
