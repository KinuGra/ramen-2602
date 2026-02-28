CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TABLE IF NOT EXISTS queues (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  criteria_key text NOT NULL,
  duration_min int NOT NULL,
  status text NOT NULL CHECK (status IN ('waiting', 'matched', 'canceled')),
  session_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now ()
);

CREATE INDEX IF NOT EXISTS idx_queues_waiting ON queues (criteria_key, created_at)
WHERE
  status = 'waiting';

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  criteria_key text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status text NOT NULL CHECK (
    status IN ('open', 'running', 'ended', 'canceled')
  ),
  created_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TABLE IF NOT EXISTS session_participants (
  session_id uuid NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now (),
  PRIMARY KEY (session_id, user_id)
);
