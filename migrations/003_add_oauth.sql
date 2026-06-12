-- Allow OAuth users (no wallet address)
ALTER TABLE users ALTER COLUMN address DROP NOT NULL;

-- OAuth identity + admin flag
ALTER TABLE users
  ADD COLUMN oauth_provider TEXT,
  ADD COLUMN oauth_id       TEXT,
  ADD COLUMN email          TEXT,
  ADD COLUMN is_admin       BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE users ADD CONSTRAINT users_oauth_unique UNIQUE (oauth_provider, oauth_id);
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

CREATE INDEX idx_users_oauth  ON users(oauth_provider, oauth_id) WHERE oauth_provider IS NOT NULL;
CREATE INDEX idx_users_admin  ON users(is_admin) WHERE is_admin = true;

-- Sessions for Culinary Hub native auth (OAuth + future magic-link)
CREATE TABLE sessions (
  id         TEXT        PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '30 days'
);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_sessions_user    ON sessions(user_id);
