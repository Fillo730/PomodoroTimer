const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM sessions').get();
  res.json({ status: 'ok', sessions: count });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend in ascolto su http://localhost:${PORT}`);
});
