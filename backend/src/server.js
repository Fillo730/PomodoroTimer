const path = require('path');
const express = require('express');
const cors = require('cors');
const db = require('./db');
const sessionsRouter = require('./routes/sessions');
const statsRouter = require('./routes/stats');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM sessions').get();
  res.json({ status: 'ok', sessions: count });
});

app.use('/api/sessions', sessionsRouter);
app.use('/api/stats', statsRouter);

app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`App disponibile su http://localhost:${PORT}`);
});
