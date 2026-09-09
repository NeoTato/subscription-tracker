# SubSentry — Functional Test Cases & QA Guide

This document provides step-by-step test cases to manually verify every feature of SubSentry (React Web Dashboard & FastAPI Backend).

---

## Test Suite 1: Initial Launch & Desktop Controls

### TC-01: 1-Click Desktop Startup
- **Objective**: Verify that SubSentry starts and opens the browser without opening VS Code.
- **Steps**:
  1. Ensure no server is running on port 8000.
  2. Double-click the **SubSentry** shortcut on your Desktop.
- **Expected Result**:
  - The default browser opens to `http://127.0.0.1:8000/`.
  - The dashboard loads smoothly with dark-mode styling and no console errors.

### TC-02: 1-Click Desktop Shutdown
- **Objective**: Verify that the server can be stopped with 1 click.
- **Steps**:
  1. Double-click the **Stop SubSentry** shortcut on your Desktop.
  2. Refresh `http://127.0.0.1:8000/` in the browser.
- **Expected Result**:
  - The connection is closed and the browser shows server unreachable.

---

## Test Suite 2: Quick Service Presets & Colored Brand Icons

### TC-03: Add Subscription via Twitch Preset (Tier 1-3)
- **Objective**: Verify dynamic tier autofill and streamer prefixing for Twitch subscriptions.
- **Steps**:
  1. Click **Add Subscription** button in the dashboard.
  2. In the **Quick Service Presets** bar, click **Twitch Channel Subscription**.
  3. Enter Streamer/Channel Name: `Keipup`.
  4. Select Tier: **Tier 1 — PHP 100.00 / mo**.
  5. Click **Create Subscription**.
- **Expected Result**:
  - Name automatically populates as `Twitch - Keipup (Tier 1)`.
  - Price is `100.00 PHP`, cycle is `Monthly`, payment method is `GCash`.
  - In the table, the Twitch row displays the purple Twitch icon (`/icons/twitch_colored.svg`).

### TC-04: Add Subscription via Discord Nitro Preset
- **Objective**: Verify tier selection for Discord Nitro.
- **Steps**:
  1. Open the **Add Subscription** modal.
  2. Select preset: **Discord Nitro**.
  3. Select Tier: **Nitro Full — PHP 263.99 / mo**.
  4. Click **Create Subscription**.
- **Expected Result**:
  - Subscription appears in the table with the blurple Discord icon (`/icons/discord_colored.svg`).
  - Monthly Spend KPI increases by PHP 263.99.

---

## Test Suite 3: Category Spending Breakdown & Scope Toggle

### TC-05: Category Scope Toggle (Paid by Me vs Shared vs Overall)
- **Objective**: Verify that switching between "Paid by Me", "Shared", and "Overall" dynamically recalculates chart data and totals.
- **Steps**:
  1. Add a personal subscription (e.g. `Spotify` at `PHP 149.00/mo`, `Paid by me = checked`).
  2. Add a shared subscription (e.g. `Netflix Family` at `PHP 549.00/mo`, `Paid by me = unchecked`).
  3. Inspect the **Category Breakdown** card:
     - Click **Paid by Me**: Total displays `PHP 149.00/mo` and shows only personal subscriptions.
     - Click **Shared**: Total displays `PHP 549.00/mo` and shows only shared/covered subscriptions.
     - Click **Overall**: Total displays `PHP 698.00/mo` and shows the combined ecosystem value.
- **Expected Result**:
  - The donut chart segments, legend, and header total smoothly update with 0 page reloads.

---

## Test Suite 4: Subscription CRUD Operations

### TC-06: Add a Multi-Currency Annual Subscription (USD)
- **Objective**: Verify foreign exchange normalization and annual cycle math.
- **Steps**:
  1. Click **Add Subscription**.
  2. Enter:
     - **Service Name**: `GitHub Copilot`
     - **Platform**: `GitHub`
     - **Price**: `100.00`
     - **Currency**: `USD`
     - **Billing Cycle**: `Yearly`
     - **Next Renewal Date**: *(6 months from today)*
     - **Category**: `Cloud & Dev`
     - **Plan Structure**: `Solo`
     - **Payment Method**: `Credit Card`
     - **Paid by me**: `Checked`
  3. Click **Create Subscription**.
- **Expected Result**:
  - Cost is normalized to monthly equivalent in PHP:
    Monthly = ($100 * 58.50 PHP) / 12 = PHP 487.50
  - Monthly Spend KPI increases by PHP 487.50.
  - Table displays `$ 100.00` with purple `YEARLY` badge.

### TC-07: Edit / Partial Update a Subscription
- **Objective**: Verify partial field editing (PATCH).
- **Steps**:
  1. In the Subscriptions Table, locate `GitHub Copilot`.
  2. Click the **Pencil (Edit)** icon on the right.
  3. Change **Price** from `100.00` to `120.00`.
  4. Click **Update Subscription**.
- **Expected Result**:
  - Toast confirms update.
  - Price updates immediately in table and KPI total adjusts accordingly.

### TC-08: Delete a Subscription
- **Objective**: Verify subscription removal.
- **Steps**:
  1. In the table, click the **Trash** icon next to a subscription.
  2. Confirm the browser dialog prompt (*"Are you sure you want to delete...?"*).
- **Expected Result**:
  - Subscription is removed from the table and KPIs reflect the reduced total.

---

## Test Suite 5: Smart Alerts & Proactive Notifications

### TC-09: Due-Soon Renewal Alert (< 7 Days)
- **Objective**: Verify that subscriptions due within 7 days trigger warning banners.
- **Steps**:
  1. Add or edit a subscription with **Next Renewal Date** set to **3 days from today**.
- **Expected Result**:
  - An amber banner appears at the top: `"Payment Due Soon: ... — In 3 days"`.
  - Attention KPI counter increments by 1.

### TC-10: Cancellation Reminder
- **Objective**: Verify urgent cancellation reminder flags.
- **Steps**:
  1. Add a subscription with **Remind me to cancel** `Checked`.
- **Expected Result**:
  - A rose alert banner appears: `"Cancel Before Renewal: ..."`.
  - An alert icon appears beside the service name in the table.
  - Clicking **Disable Reminder** updates the subscription and dismisses the alert.

### TC-11: Student Status Expiry Reminder
- **Objective**: Verify 30-day student discount expiration alerts.
- **Steps**:
  1. Add a subscription with **Student Status Expiry** set to **20 days from today**.
- **Expected Result**:
  - A purple banner appears: `"Student Discount Expiration: ... — Expires in 20 days"`.

---

## Test Suite 6: Date Rollover & Daily Automation

### TC-12: Overdue Date Auto-Advancement
- **Objective**: Verify that overdue dates automatically roll over to the next cycle.
- **Steps**:
  1. Add a subscription with a **Monthly** cycle and a due date in the past (e.g., `2026-08-01`).
  2. Click the **Sync (Refresh icon)** in the top navigation bar.
- **Expected Result**:
  - Date automatically increments by month(s) until it lands on an upcoming future date.
  - Toast message confirms: `"Data refreshed and overdue dates synced!"`.

### TC-13: Telegram Alert Trigger Test
- **Objective**: Verify notification dispatch pipeline.
- **Steps**:
  1. Click the **Bell (Alerts)** button in the top navigation bar.
- **Expected Result**:
  - If `.env` has valid Telegram credentials, a formatted daily briefing is sent to Telegram.
  - If tokens are not yet configured, toast notifies without crashing the application.
