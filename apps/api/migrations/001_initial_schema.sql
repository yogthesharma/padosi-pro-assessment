-- Users. Email is stored lower-cased by the API, so a plain unique index is enough.
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT NOT NULL UNIQUE,
  password_hash     TEXT NOT NULL,
  email_verified_at TIMESTAMPTZ,
  token_version     INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per code sent. Only an HMAC of the code is stored.
-- consumed_at is set when the code is used or superseded by a newer one.
CREATE TABLE email_otps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash   TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  consumed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX email_otps_user_created_idx ON email_otps (user_id, created_at DESC);

CREATE TABLE profiles (
  user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  mobile        TEXT NOT NULL CHECK (mobile ~ '^\+91[6-9][0-9]{9}$'),
  address       TEXT NOT NULL,
  business_name TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Catalogue ids are readable slugs so seeds stay stable across environments.
CREATE TABLE task_categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL
);

CREATE TABLE tasks (
  id          TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES task_categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order  INTEGER NOT NULL
);
CREATE INDEX tasks_category_idx ON tasks (category_id, sort_order);

CREATE TABLE user_tasks (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, task_id)
);
