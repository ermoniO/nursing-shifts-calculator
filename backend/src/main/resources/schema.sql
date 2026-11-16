CREATE TABLE IF NOT EXISTS facilities (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS monthly_goals (
    id          BIGSERIAL PRIMARY KEY,
    goal_month  VARCHAR(7)    NOT NULL UNIQUE,          -- e.g. 2026-11
    goal_amount NUMERIC(10,2) NOT NULL CHECK (goal_amount >= 0)
);

CREATE TABLE IF NOT EXISTS shifts (
    id          BIGSERIAL PRIMARY KEY,
    shift_date  DATE          NOT NULL UNIQUE,          -- one shift per date
    facility_id BIGINT        NOT NULL REFERENCES facilities (id),
    start_time  TIME          NOT NULL,
    hours       NUMERIC(4,2)  NOT NULL CHECK (hours > 0 AND hours <= 24),
    hourly_pay  NUMERIC(8,2)  NOT NULL CHECK (hourly_pay > 0),
    canceled    BOOLEAN       NOT NULL DEFAULT FALSE
);
