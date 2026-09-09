# 🧪 SubSentry — Functional Test Cases & QA Guide

This document provides clear, step-by-step test cases to manually test and verify every feature of **SubSentry** (Web Dashboard & Backend API).

---

## Test Suite 1: Initial Launch & Empty State

### TC-01: Empty Dashboard State

- **Objective**: Verify that the application gracefully loads when no subscriptions exist without throwing errors (`IndexError` or `NoneType`).
- **Steps**:
  1. Open `http://127.0.0.1:8000/`.
  2. Inspect the dashboard metrics, chart, and table.
- **Expected Result**:
  - Monthly Spend displays `₱0.00`.
  - Next Payment displays `"None Upcoming"` or `"All Paid Up"`.
  - Active Subscriptions shows `0`.
  - Expense Chart displays `"No expense breakdown data"` with an `"Add Subscription"` button.
  - Subscriptions Table displays an empty state placeholder with an `"Add Subscription"` button.

---

## Test Suite 2: Subscription CRUD Operations

### TC-02: Add a Standard Monthly Subscription (PHP)

- **Objective**: Verify creating a normal recurring subscription.
- **Steps**:
  1. Click the **"Add Subscription"** button.
  2. Enter:
     - **Service Name**: `YouTube Premium`
     - **Platform**: `Google`
     - **Price**: `159.00`
     - **Currency**: `PHP`
     - **Billing Cycle**: `Monthly`
     - **Next Renewal Date**: _(Set to 15 days from today)_
     - **Category**: `Entertainment`
     - **Plan Structure**: `Solo`
     - **Payment Method**: `GCash`
     - **Paid by me**: `Checked`
     - **Remind me to cancel**: `Unchecked`
  3. Click **"Create Subscription"**.
- **Expected Result**:
  - Modal closes, toast notification confirms `"Added YouTube Premium to subscriptions."`
  - Monthly spend increases by `₱159.00`.
  - Subscription appears in the table with a cyan `MONTHLY` badge and green `Paid by me` status.
  - Expense chart updates with an `"Entertainment"` segment.

---

### TC-03: Add a Multi-Currency Annual Subscription (USD)

- **Objective**: Verify foreign exchange normalization and annual cycle math.
- **Steps**:
  1. Click **"Add Subscription"**.
  2. Enter:
     - **Service Name**: `GitHub Copilot`
     - **Platform**: `GitHub`
     - **Price**: `100.00`
     - **Currency**: `USD`
     - **Billing Cycle**: `Yearly`
     - **Next Renewal Date**: _(Set to 6 months from today)_
     - **Category**: `Cloud & Dev`
     - **Plan Structure**: `Solo`
     - **Payment Method**: `Credit Card`
     - **Paid by me**: `Checked`
  3. Click **"Create Subscription"**.
- **Expected Result**:
  - Cost is normalized to monthly equivalent in PHP:
    $$\text{Monthly} = \frac{\$100 \times 58.50\text{ PHP}}{12} \approx ₱487.50$$
  - Monthly Spend increases by $\approx ₱487.50$.
  - Table displays `$ 100.00` with purple `YEARLY` badge.

---

### TC-04: Edit / Partial Update a Subscription

- **Objective**: Verify partial field editing (`PATCH`).
- **Steps**:
  1. In the Subscriptions Table, locate `YouTube Premium`.
  2. Click the **Pencil (Edit)** icon on the right.
  3. Change **Price** from `159.00` to `239.00` and **Plan Structure** to `Family`.
  4. Click **"Update Subscription"**.
- **Expected Result**:
  - Toast confirms update.
  - Price updates immediately in table and KPI total adjusts accordingly.

---

### TC-05: Delete a Subscription

- **Objective**: Verify subscription removal.
- **Steps**:
  1. In the table, click the **Trash** icon next to a subscription.
  2. Confirm the browser dialog prompt (_"Are you sure you want to delete...?"_).
- **Expected Result**:
  - Subscription is removed from the table.
  - Monthly total decreases by that subscription's normalized monthly cost.

---

## Test Suite 3: Smart Alerts & Proactive Notifications

### TC-06: Due-Soon Renewal Alert (< 7 Days)

- **Objective**: Verify that subscriptions due within 7 days trigger warning banners.
- **Steps**:
  1. Add or edit a subscription (e.g. `Netflix`) with **Next Renewal Date** set to **3 days from today**.
- **Expected Result**:
  - An amber banner appears at the top: `"Payment Due Soon: Netflix — In 3 days"`.
  - Attention KPI counter increments by `1`.

---

### TC-07: Cancellation Reminder

- **Objective**: Verify urgent cancellation reminder flags.
- **Steps**:
  1. Add a subscription (e.g. `Free Trial Adobe`) with **Remind me to cancel** `Checked`.
- **Expected Result**:
  - A rose/red alert banner appears: `"Cancel Before Renewal: Free Trial Adobe"`.
  - An alert icon appears beside the service name in the table.
  - Clicking **"Disable Reminder"** updates the subscription and dismisses the alert.

---

### TC-08: Student Status Expiry Reminder

- **Objective**: Verify 30-day student discount expiration alerts.
- **Steps**:
  1. Add a subscription (e.g. `Spotify Student`) with **Student Status Expiry** set to **20 days from today**.
- **Expected Result**:
  - A purple banner appears: `"Student Discount Expiration: Spotify Student — Expires in 20 days"`.

---

## Test Suite 4: Table Searching & Filtering

### TC-09: Live Text Search

- **Objective**: Verify real-time search across service names and platforms.
- **Steps**:
  1. Type `you` into the search box.
- **Expected Result**:
  - Table instantly filters to show only `YouTube Premium`.
  - Clear the search box $\rightarrow$ all subscriptions reappear.

---

### TC-10: Category & Payee Dropdown Filters

- **Objective**: Verify multi-attribute filtering.
- **Steps**:
  1. Select **Category**: `Entertainment`.
  2. Verify only entertainment services are displayed.
  3. Select **Payees**: `Paid By Me` vs `Shared / Covered`.
- **Expected Result**:
  - Rows update dynamically matching selected category and payment responsibility.

---

## Test Suite 5: Date Rollover & Automation

### TC-11: Overdue Date Auto-Advancement

- **Objective**: Verify that overdue dates automatically roll over to the next cycle.
- **Steps**:
  1. Add a subscription with a **Monthly** cycle and a due date in the past (e.g., `2026-08-01`).
  2. Click the **Sync (Refresh icon)** in the top navigation bar.
- **Expected Result**:
  - Date automatically increments by month(s) until it lands on an upcoming future date.
  - Toast message confirms: `"Data refreshed & overdue dates synced!"`.

---

### TC-12: Telegram Alert Trigger Test

- **Objective**: Verify notification dispatch pipeline.
- **Steps**:
  1. Click the **Bell (Alerts)** button in the top navigation bar.
- **Expected Result**:
  - If `.env` has valid `TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID`, a formatted alert is sent to your Telegram chat.
  - If tokens are missing/default, toast safely notifies: `"Alerts evaluated (check TELEGRAM_BOT_TOKEN in .env)"` without crashing the application.

---

## Test Suite 6: Input Validation & Edge Cases

### TC-13: Validation on Invalid Input

- **Objective**: Verify client and API validation on incorrect payloads.
- **Steps**:
  1. Open "Add Subscription" modal.
  2. Leave Service Name blank or enter Price as `0` or `-50`.
  3. Try submitting.
- **Expected Result**:
  - Browser blocks submission with required field warning, preventing invalid data entry.
