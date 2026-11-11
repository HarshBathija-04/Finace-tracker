-- FinSight core schema. Money is stored as integer minor units (paise/cents) in BIGINT columns.

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  email         text NOT NULL,
  password_hash text NOT NULL,
  currency      char(3) NOT NULL DEFAULT 'INR',
  budget_alerts boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON users (lower(email));

CREATE TABLE IF NOT EXISTS transactions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                text NOT NULL CHECK (type IN ('income', 'expense')),
  category            text NOT NULL,
  amount_minor        bigint NOT NULL CHECK (amount_minor > 0),
  occurred_on         date NOT NULL DEFAULT current_date,
  payment             text CHECK (payment IN ('card', 'cash', 'upi', 'bank')),
  note                text CHECK (char_length(note) <= 280),
  -- A row with recurring_frequency set is a template; the scheduler copies it forward.
  recurring_frequency text CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly')),
  recurring_status    text CHECK (recurring_status IN ('active', 'paused', 'cancelled')),
  recurring_end_date  date,
  recurring_last_run  date,
  recurring_parent_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON transactions (user_id, occurred_on DESC);
CREATE UNIQUE INDEX IF NOT EXISTS transactions_recurring_once_key
  ON transactions (recurring_parent_id, occurred_on) WHERE recurring_parent_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS budgets (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year                 int NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  month                int NOT NULL CHECK (month BETWEEN 1 AND 12),
  limit_minor          bigint NOT NULL CHECK (limit_minor >= 0),
  target_savings_minor bigint NOT NULL DEFAULT 0 CHECK (target_savings_minor >= 0),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year, month)
);

CREATE TABLE IF NOT EXISTS category_budgets (
  budget_id   uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category    text NOT NULL,
  limit_minor bigint NOT NULL CHECK (limit_minor > 0),
  PRIMARY KEY (budget_id, category)
);

CREATE TABLE IF NOT EXISTS notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message      text NOT NULL,
  type         text NOT NULL DEFAULT 'general' CHECK (type IN ('budget', 'income', 'spending', 'general')),
  ai_generated boolean NOT NULL DEFAULT false,
  is_read      boolean NOT NULL DEFAULT false,
  dedupe_key   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS notifications_dedupe_key ON notifications (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
