const express = require('express');
const repo = require('../repositories/sessionsRepository');

const router = express.Router();

router.get('/summary', (req, res) => {
  res.json(repo.getSummary());
});

router.get('/by-subject', (req, res) => {
  res.json(repo.getBySubject());
});

router.get('/by-day', (req, res) => {
  const days = Number(req.query.days) || 30;
  res.json(repo.getByDay({ days }));
});

module.exports = router;
