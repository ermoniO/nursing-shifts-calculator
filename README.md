# Nursing Shifts Calculator

Tracks PRN shifts against a monthly gross income goal. One user, one password.

- **Frontend:** React 18, Tailwind CSS 4, Vite (`frontend/`)
- **Backend:** Java 21, Spring Boot 3.5, Spring Data JPA (`backend/`)
- **Database:** Postgres
- **Hosting:** Render, deployed from GitHub with Docker

In production, one Docker container serves both: the React build is copied into
Spring Boot's static folder, so the app and the API share one URL.

## Project layout

```
backend/
  src/main/java/com/nursingshifts/
    calc/ShiftMath.java        all the math (pay, end time, status, estimate, rounding)
    domain/                    entities + repositories (Shift, Facility, MonthlyGoal)
    service/                   ShiftService, MonthService, HistoryService
    web/ApiController.java     every REST endpoint, listed at the top of the file
    web/ApiErrors.java         error -> JSON { "message": ... }
    auth/                      single-password login + token filter
    config/AppClock.java       "today" in APP_TIMEZONE
  src/main/resources/
    application.yml            settings, read from environment variables
    schema.sql                 tables (runs on startup, safe to re-run)
  src/test/.../ShiftMathTest.java
frontend/
  src/App.jsx                  tabs + modals
  src/components/              CalendarView, GoalSummary, EstimatePanel, ShiftFormModal,
                               ShiftDetailsModal, ListView, HistoryView
  src/lib/                     api.js, format.js, pay.js (live preview math)
Dockerfile, render.yaml, docker-compose.yml
```

## How the rules are implemented

| Rule from the spec | Where |
| --- | --- |
| Shift pay = hours × hourly pay, rounded down to the cent | `ShiftMath.shiftPay` |
| End time = start + hours; all pay counts on the start date | `ShiftMath.endTime` |
| Only "canceled" is stored; Scheduled/Completed comes from the date | `ShiftMath.status`, `AppClock` |
| One shift per date | `UNIQUE` on `shifts.shift_date` + a friendly 409 in `ShiftService` |
| Estimate uses average hourly pay of all non-canceled shifts | `MonthService.averageHourlyAllShifts` |
| Every calculated number rounds down | `RoundingMode.FLOOR` throughout `ShiftMath` |
| History counts only Completed shifts, recalculated every time | `HistoryService` |

Average hourly pay is **total pay ÷ total hours**, so a long shift counts more than a
short one. That keeps the hour estimate accurate when shift lengths vary.

When an estimate rounds down to zero (for example, $200 still needed), the app shows
"less than 1 12-hour shift" instead of "0 shifts".

## Run it locally

You need Java 21, Maven, Node 20+ and Docker (for Postgres).

```bash
# 1. Start Postgres
docker compose up -d

# 2. Start the API on http://localhost:8080
cd backend
APP_PASSWORD=dev mvn spring-boot:run

# 3. In another terminal, start the React app on http://localhost:5173
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and sign in with `dev`. Vite forwards `/api` calls to port 8080.

Run the math tests with `cd backend && mvn test`.

On Windows PowerShell, set the password with `$env:APP_PASSWORD="dev"; mvn spring-boot:run`.
In IntelliJ, add `APP_PASSWORD=dev` to the run configuration's environment variables.

## Deploy to Render

1. Push this folder to a GitHub repository.
2. In Render, choose **New > Blueprint** and select the repository. Render reads
   `render.yaml` and creates the Postgres database and the web service.
3. When asked, enter an **APP_PASSWORD**. This is the password you'll sign in with.
4. Wait for the first build (several minutes). The app is live at the service's
   `onrender.com` URL.

After that, every push to the connected branch redeploys automatically.

Notes:
- **Free plans:** a free web service sleeps when idle, so the first visit after a
  while takes about a minute. Render has also limited how long free Postgres
  databases last, so check its current terms and upgrade the database before
  you rely on the data.
- **Changing the password:** update `APP_PASSWORD` in the service's Environment
  settings. Every device is signed out and must use the new password.
- **Time zone:** `APP_TIMEZONE` decides when a shift becomes Completed. It's set to
  `America/Chicago`; change it if you move.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/login` | `{ "password" }` → `{ "token" }` |
| GET | `/api/health` | Health check (no token) |
| GET | `/api/months/{yyyy-MM}` | Goal, earned, scheduled, still needed, estimate, shifts |
| PUT | `/api/months/{yyyy-MM}/goal` | `{ "amount" }` |
| GET | `/api/shifts?month=&status=` | List view; both filters optional |
| POST | `/api/shifts` | `{ date, facility, startTime, hours, hourlyPay }` |
| PUT | `/api/shifts/{id}` | Same body |
| POST | `/api/shifts/{id}/cancel` | Cancel |
| POST | `/api/shifts/{id}/restore` | Restore |
| GET | `/api/facilities` | Names with the last rate used at each |
| GET | `/api/pay-rates` | Rates used before |
| GET | `/api/history` | Monthly history and summary stats |

Every endpoint except login and health needs `Authorization: Bearer <token>`.
