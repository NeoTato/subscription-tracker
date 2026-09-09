# 🛠️ SubSentry — Issues, Root Causes & Resolutions

This document catalogues the critical bugs, edge cases, and design bottlenecks identified during the codebase audit, along with their root causes and concrete resolution strategies.

---

## 1. Summary of Identified Issues

| ID         | Category           | Issue Description                                                | Severity    | Target Resolution                                               |
| :--------- | :----------------- | :--------------------------------------------------------------- | :---------- | :-------------------------------------------------------------- |
| **ISS-01** | Runtime Crash      | `NoneType` comparison crash on student expiry check in `/alerts` | 🔴 Critical | Add null check before date range comparison                     |
| **ISS-02** | Runtime Crash      | `IndexError` in `/summary` when database is empty                | 🔴 Critical | Add default empty-state handling for upcoming sub               |
| **ISS-03** | Data Inconsistency | Mixed dictionary vs ORM attribute access in `notifications.py`   | 🟡 High     | Normalize data structures with unified Pydantic models          |
| **ISS-04** | Schema Deficiency  | Missing `remind_to_cancel` in `SubscriptionCreate` schema        | 🟡 High     | Add field with default `False` to schema                        |
| **ISS-05** | Architectural Flaw | Daily tasks only execute once on server startup                  | 🟡 High     | Implement `APScheduler` background scheduler                    |
| **ISS-06** | REST Anti-Pattern  | Query parameters used for update (`PUT /update/{id}`)            | 🟡 Medium   | Adopt RESTful `PATCH /api/v1/subscriptions/{id}` with JSON body |
| **ISS-07** | Resource Leak Risk | Manual `SessionLocal()` management in route handlers             | 🟡 Medium   | Refactor to FastAPI `Depends(get_db)` dependency injection      |
| **ISS-08** | Error Handling     | Routes return HTTP 200 OK with `{"error": "..."}`                | 🟡 Medium   | Standardize with FastAPI `HTTPException` (404, 400, 422)        |

---

## 2. Detailed Breakdown & Resolutions

### ISS-01: `NoneType` Comparison Crash in `/alerts`

- **Location**: [`main.py:142`](file:///c:/ProgrammingStuff/Projects/subscription_tracker/main.py#L142)
- **Problem**:
  ```python
  student_expiry_reminders = [
      ...
      for s in all_subs
      if today <= s.student_status_expiry <= month_from_now
  ]
  ```
  `student_status_expiry` is nullable (`None` for non-student subscriptions). In Python, comparing `date <= None` raises a `TypeError: '<=' not supported between instances of 'datetime.date' and 'NoneType'`, crashing the endpoint.
- **Resolution**:
  Add an explicit presence check:
  ```python
  if s.student_status_expiry and today <= s.student_status_expiry <= month_from_now
  ```

---

### ISS-02: `IndexError` Crash on Empty Subscriptions in `/summary`

- **Location**: [`main.py:90`](file:///c:/ProgrammingStuff/Projects/subscription_tracker/main.py#L90)
- **Problem**:
  ```python
  upcoming = sorted(paid_subs, key=lambda x: x.next_due_date)[0]
  ```
  If no subscriptions exist or no subscription has `is_paid_by_me = True`, `sorted(paid_subs, ...)` yields an empty list `[]`. Indexing `[0]` throws `IndexError: list index out of range` and results in an HTTP 500 error.
- **Resolution**:
  Safely handle empty lists:

  ```python
  sorted_subs = sorted(paid_subs, key=lambda x: x.next_due_date)
  upcoming = sorted_subs[0] if sorted_subs else None

  return {
      "monthly_total": total_cost,
      "currency": "PHP",
      "next_payment": upcoming.name if upcoming else None,
      "next_payment_date": upcoming.next_due_date if upcoming else None,
      "sub_count": len(my_subs),
      ...
  }
  ```

---

### ISS-03: Inconsistent Types in Notification Formatter

- **Location**: [`notifications.py:34, 44`](file:///c:/ProgrammingStuff/Projects/subscription_tracker/notifications.py#L34-L44)
- **Problem**:
  `check_and_notify()` passes `due_soon` as a list of raw dicts (accessing `s['due_date']`), but passes `cancellation_reminders` as a list of ORM `models.Subscription` instances (accessing `s.next_due_date`).
- **Resolution**:
  Use consistent typed dataclasses or Pydantic models for notification payloads, ensuring type safety and clean formatting.

---

### ISS-04: Missing `remind_to_cancel` in `SubscriptionCreate`

- **Location**: [`schemas.py:23-45`](file:///c:/ProgrammingStuff/Projects/subscription_tracker/schemas.py#L23-L45)
- **Problem**:
  `models.Subscription` has a `remind_to_cancel` boolean column, but `schemas.SubscriptionCreate` omitted it. Users creating subscriptions could not set this flag via the API.
- **Resolution**:
  Include `remind_to_cancel: bool = False` in `SubscriptionCreate` and `SubscriptionUpdate`.

---

### ISS-05: Startup-Only Triggering for Daily Routines

- **Location**: [`main.py:18-22`](file:///c:/ProgrammingStuff/Projects/subscription_tracker/main.py#L18-L22)
- **Problem**:
  `utils.advance_due_dates()` and `notifications.check_and_notify()` only ran once during FastAPI's `lifespan` startup event. If the server remained online without restarting, overdue dates would never roll over and alerts would never send.
- **Resolution**:
  Integrate `AsyncIOScheduler` from `apscheduler` in the FastAPI lifespan to trigger daily at a configured time (e.g., `09:00:00`), while maintaining an immediate check on startup.

---

### ISS-06: Non-Standard Update Method (Query Params instead of JSON)

- **Location**: [`main.py:175-190`](file:///c:/ProgrammingStuff/Projects/subscription_tracker/main.py#L175-L190)
- **Problem**:
  `/update/{sub_id}` was declared as a `PUT` endpoint with 12 optional query parameters (`/update/1?new_price=199&new_name=...`). This violates REST standards, clutters URLs, and prevents clean frontend integration.
- **Resolution**:
  Implement `PATCH /api/v1/subscriptions/{sub_id}` accepting a `SubscriptionUpdate` JSON request body where only supplied fields are updated (`exclude_unset=True`).

---

### ISS-07: Manual Database Session Management & Leaks

- **Location**: Multiple endpoints across `main.py`, `utils.py`, `notifications.py`
- **Problem**:
  Every function manually called `db = models.SessionLocal()` and `db.close()`. Any unhandled exception prior to `finally` or in utility functions risked connection leaks or uncommitted rollbacks.
- **Resolution**:
  Use FastAPI's standard dependency injection:

  ```python
  def get_db():
      db = SessionLocal()
      try:
          yield db
      finally:
          db.close()

  @app.get("/api/v1/subscriptions")
  def get_subscriptions(db: Session = Depends(get_db)):
      ...
  ```

---

### ISS-08: HTTP Status Code Standardization

- **Location**: Route error responses returning HTTP 200 with error dictionaries.
- **Problem**:
  Returning `{"error": "Subscription not found"}` with status code `200 OK` breaks standard REST clients, frontend error handling (like React Query / Axios interceptors), and OpenAPI contract tooling.
- **Resolution**:
  Raise standard `HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")` and return `status.HTTP_201_CREATED` on resource creation.
