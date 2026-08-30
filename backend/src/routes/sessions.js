const express = require('express');
const repo = require('../repositories/sessionsRepository');

const router = express.Router();

const VALID_TYPES = ['focus', 'short_break', 'long_break'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

router.post('/', (req, res) => {
  const { subject, type, durationMinutes, completedAt, date } = req.body;

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `type deve essere uno tra: ${VALID_TYPES.join(', ')}` });
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return res.status(400).json({ error: 'durationMinutes deve essere un intero positivo' });
  }
  if (typeof completedAt !== 'string' || !completedAt) {
    return res.status(400).json({ error: 'completedAt è obbligatorio' });
  }
  if (typeof date !== 'string' || !DATE_RE.test(date)) {
    return res.status(400).json({ error: 'date deve avere formato YYYY-MM-DD' });
  }

  const session = repo.insertSession({
    subject: subject && subject.trim() ? subject.trim() : 'Generale',
    type,
    durationMinutes,
    completedAt,
    date,
  });

  res.status(201).json(session);
});

router.get('/', (req, res) => {
  const { date, subject } = req.query;
  res.json(repo.listSessions({ date, subject }));
});

module.exports = router;
