CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  zip_code TEXT,
  latitude REAL,
  longitude REAL,
  status TEXT NOT NULL DEFAULT 'questionnaire',
  answers_json TEXT,
  favorites_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS search_results (
  session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
  fetched_at INTEGER NOT NULL,
  results_json TEXT NOT NULL,
  raw_count INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
