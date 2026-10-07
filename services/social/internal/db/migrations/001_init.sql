-- Direct Social schema.

CREATE EXTENSION IF NOT EXISTS unaccent;

-- Search configurations that ignore accents: "brésil" finds "Bresil" and the
-- other way round, and ts_headline() still shows the original text.
CREATE TEXT SEARCH CONFIGURATION fr (COPY = french);
ALTER TEXT SEARCH CONFIGURATION fr ALTER MAPPING FOR hword, hword_part, word WITH unaccent, french_stem;
CREATE TEXT SEARCH CONFIGURATION simple_unaccent (COPY = simple);
ALTER TEXT SEARCH CONFIGURATION simple_unaccent ALTER MAPPING FOR hword, hword_part, word WITH unaccent, simple;

CREATE FUNCTION search_vector(config regconfig, body text) RETURNS tsvector
  LANGUAGE sql IMMUTABLE PARALLEL SAFE
  AS $$ SELECT to_tsvector(config, coalesce(body, '')) $$;

-- array_to_string() is only stable, so it cannot feed generated columns directly.
CREATE FUNCTION tags_text(tags text[]) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE
  AS $$ SELECT array_to_string(tags, ' ') $$;

CREATE TABLE users (
  id bigserial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  handle text NOT NULL UNIQUE,
  display_name text NOT NULL,
  bio text NOT NULL DEFAULT '',
  avatar_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  search tsvector GENERATED ALWAYS AS (search_vector('simple_unaccent', handle || ' ' || display_name)) STORED
);
CREATE INDEX users_search ON users USING gin (search);

CREATE TABLE login_tokens (
  token_hash bytea PRIMARY KEY,
  email text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);

CREATE TABLE sessions (
  token_hash bytea PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);

CREATE TABLE shows (
  id bigserial PRIMARY KEY,
  owner_id bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  cover_key text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  search tsvector GENERATED ALWAYS AS (
    setweight(search_vector('fr', title), 'A') ||
    setweight(search_vector('fr', tags_text(tags)), 'B') ||
    setweight(search_vector('fr', description), 'C')) STORED
);
CREATE INDEX shows_search ON shows USING gin (search);

CREATE TABLE episodes (
  id bigserial PRIMARY KEY,
  show_id bigint NOT NULL REFERENCES shows ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  -- processing -> ready (or failed)
  status text NOT NULL DEFAULT 'processing',
  transcript_status text NOT NULL DEFAULT 'pending',
  original_key text NOT NULL,
  audio_key text,
  duration_seconds real,
  waveform real[],
  play_count integer NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  search tsvector GENERATED ALWAYS AS (
    setweight(search_vector('fr', title), 'A') ||
    setweight(search_vector('fr', tags_text(tags)), 'B') ||
    setweight(search_vector('fr', description), 'C')) STORED
);
CREATE INDEX episodes_show ON episodes (show_id, published_at DESC);
CREATE INDEX episodes_search ON episodes USING gin (search);

CREATE TABLE transcript_segments (
  id bigserial PRIMARY KEY,
  episode_id bigint NOT NULL REFERENCES episodes ON DELETE CASCADE,
  start_seconds real NOT NULL,
  end_seconds real NOT NULL,
  body text NOT NULL,
  search tsvector GENERATED ALWAYS AS (search_vector('fr', body)) STORED
);
CREATE INDEX transcript_segments_episode ON transcript_segments (episode_id, start_seconds);
CREATE INDEX transcript_segments_search ON transcript_segments USING gin (search);

CREATE TABLE fingerprints (
  hash integer NOT NULL,
  episode_id bigint NOT NULL REFERENCES episodes ON DELETE CASCADE,
  frame integer NOT NULL
);
CREATE INDEX fingerprints_hash ON fingerprints (hash);
CREATE INDEX fingerprints_episode ON fingerprints (episode_id);

CREATE TABLE comments (
  id bigserial PRIMARY KEY,
  episode_id bigint NOT NULL REFERENCES episodes ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  parent_id bigint REFERENCES comments ON DELETE CASCADE,
  -- Moment of the episode the comment is about, if any.
  at_seconds real,
  body text NOT NULL DEFAULT '',
  -- Audio note, recorded in the browser.
  audio_key text,
  audio_seconds real,
  created_at timestamptz NOT NULL DEFAULT now(),
  search tsvector GENERATED ALWAYS AS (search_vector('fr', body)) STORED
);
CREATE INDEX comments_episode ON comments (episode_id, created_at);
CREATE INDEX comments_search ON comments USING gin (search);

CREATE TABLE likes (
  user_id bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  episode_id bigint NOT NULL REFERENCES episodes ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, episode_id)
);

CREATE TABLE bookmarks (
  user_id bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  episode_id bigint NOT NULL REFERENCES episodes ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, episode_id)
);

CREATE TABLE show_follows (
  user_id bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  show_id bigint NOT NULL REFERENCES shows ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, show_id)
);

CREATE TABLE user_follows (
  follower_id bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  followee_id bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);

CREATE TABLE listens (
  user_id bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  episode_id bigint NOT NULL REFERENCES episodes ON DELETE CASCADE,
  position_seconds real NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, episode_id)
);

CREATE TABLE notifications (
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  -- comment, reply, follow_user, follow_show, like, new_episode
  kind text NOT NULL,
  actor_id bigint REFERENCES users ON DELETE CASCADE,
  show_id bigint REFERENCES shows ON DELETE CASCADE,
  episode_id bigint REFERENCES episodes ON DELETE CASCADE,
  comment_id bigint REFERENCES comments ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
CREATE INDEX notifications_user ON notifications (user_id, created_at DESC);

CREATE TABLE reports (
  id bigserial PRIMARY KEY,
  reporter_id bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  -- episode, comment, show, user
  target_type text NOT NULL,
  target_id bigint NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE jobs (
  id bigserial PRIMARY KEY,
  kind text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  run_after timestamptz NOT NULL DEFAULT now(),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX jobs_queued ON jobs (run_after) WHERE status = 'queued';
