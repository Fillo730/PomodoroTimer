const db = require('../db');

function insertSession({ subject, type, durationMinutes, completedAt, date }) {
  const stmt = db.prepare(`
    INSERT INTO sessions (subject, type, duration_minutes, completed_at, session_date)
    VALUES (@subject, @type, @durationMinutes, @completedAt, @date)
  `);
  const info = stmt.run({ subject, type, durationMinutes, completedAt, date });
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(info.lastInsertRowid);
}

function listSessions({ date, subject } = {}) {
  let query = 'SELECT * FROM sessions WHERE 1=1';
  const params = {};
  if (date) {
    query += ' AND session_date = @date';
    params.date = date;
  }
  if (subject) {
    query += ' AND subject = @subject';
    params.subject = subject;
  }
  query += ' ORDER BY completed_at DESC';
  return db.prepare(query).all(params);
}

function computeStreak() {
  const rows = db
    .prepare(
      `SELECT DISTINCT session_date FROM sessions WHERE type = 'focus' ORDER BY session_date DESC`
    )
    .all();

  if (rows.length === 0) return 0;

  const dates = rows.map((r) => r.session_date);
  const todayStr = new Date().toISOString().slice(0, 10);
  const oneDayMs = 24 * 60 * 60 * 1000;

  let expected = new Date(`${dates[0] === todayStr ? todayStr : dates[0]}T00:00:00Z`);

  let streak = 0;
  for (const dateStr of dates) {
    const expectedStr = expected.toISOString().slice(0, 10);
    if (dateStr === expectedStr) {
      streak += 1;
      expected = new Date(expected.getTime() - oneDayMs);
    } else {
      break;
    }
  }
  return streak;
}

function getSummary() {
  const { totalSessions, totalMinutes } = db
    .prepare(
      `SELECT COUNT(*) AS totalSessions, COALESCE(SUM(duration_minutes), 0) AS totalMinutes
       FROM sessions WHERE type = 'focus'`
    )
    .get();

  return { totalSessions, totalMinutes, streak: computeStreak() };
}

function getBySubject() {
  return db
    .prepare(
      `SELECT subject, COUNT(*) AS sessions, COALESCE(SUM(duration_minutes), 0) AS totalMinutes
       FROM sessions
       WHERE type = 'focus'
       GROUP BY subject
       ORDER BY totalMinutes DESC`
    )
    .all();
}

function getByDay({ days = 30 } = {}) {
  return db
    .prepare(
      `SELECT session_date AS date, COUNT(*) AS sessions, COALESCE(SUM(duration_minutes), 0) AS totalMinutes
       FROM sessions
       WHERE type = 'focus' AND session_date >= date('now', ?)
       GROUP BY session_date
       ORDER BY session_date ASC`
    )
    .all(`-${days} days`);
}

module.exports = { insertSession, listSessions, getSummary, getBySubject, getByDay };
