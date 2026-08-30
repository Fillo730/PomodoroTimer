CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL DEFAULT 'Generale',
  type TEXT NOT NULL CHECK (type IN ('focus', 'short_break', 'long_break')),
  duration_minutes INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  session_date TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions (session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_subject ON sessions (subject);
