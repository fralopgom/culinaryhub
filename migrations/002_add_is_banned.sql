ALTER TABLE users ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_users_banned ON users(is_banned) WHERE is_banned = true;
