# 🍅 Study Pomodoro Timer

A customizable Pomodoro timer for studying, with session tracking, daily streaks, and per-subject statistics. Vanilla JS frontend (no framework), Node.js/Express backend with SQLite persistence.

## Screenshots

| Timer | Statistics |
|---|---|
| ![Pomodoro timer](docs/screenshot-timer.jpg) | ![Study statistics](docs/screenshot-stats.jpg) |

## Features

- Configurable Pomodoro timer (focus duration, short break, long break, number of cycles before a long break)
- Optional auto-start of the next phase
- Desktop notifications (Notification API) and an end-of-session sound (generated via Web Audio, no audio asset needed)
- Tracks completed sessions: total count, total study time, consecutive-day streak
- Per-subject and per-day statistics, rendered with [Chart.js](https://www.chartjs.org/)
- Works offline: if the backend is unreachable, sessions are queued in `localStorage` and synced on the next successful attempt
- Automatic dark mode (follows system preference)

## Tech stack

- **Frontend**: plain HTML/CSS/JavaScript (ES Modules), Chart.js via CDN
- **Backend**: Node.js, Express
- **Database**: SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (no ORM)

## Project structure

```
PomodoroTimer/
├── backend/
│   ├── src/
│   │   ├── db/                 # SQLite connection and schema
│   │   ├── repositories/       # database queries
│   │   ├── routes/             # REST endpoints (sessions, stats)
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── css/style.css
│   ├── js/                     # timer, api, notifications, sound, stats
│   └── index.html
├── Dockerfile
├── docker-compose.yml
└── docs/                       # screenshots for this README
```

## Running locally

Requires Node.js 18+. A single Express server serves both the API and the static frontend.

```bash
cd backend
npm install
npm run dev        # http://localhost:3001
```

Open **http://localhost:3001** in your browser: you'll find the full app (timer + statistics). The SQLite database is created automatically on first run.

If you'd rather serve the frontend separately (e.g. for live-reload during development), you can still run it with `npx serve -l 5500` inside `frontend/` and point it at the backend (`http://localhost:3001/api`) from the app's **Settings** screen.

## Running with Docker

The whole app (backend + frontend) ships as a single container, with session data persisted in a Docker volume.

```bash
docker compose up -d --build
```

Then open **http://localhost:3001**. This is a convenient way to run the app on an always-on machine on your home network (a NAS, a Raspberry Pi, an old laptop) so it's just always there — no terminal to open every day. A few notes for that setup:

- The container restarts automatically (`restart: unless-stopped`), so it survives reboots as long as Docker itself starts on boot (the default on most Linux distributions).
- From any other device on the same network, open `http://<that-machine's-LAN-IP>:3001`.
- The API has no authentication — fine for a trusted home network, but keep in mind anyone on the LAN could read/write sessions.
- If the host machine goes to sleep, the service becomes unreachable until it wakes up — disable automatic sleep on that machine for genuine "always on" behavior.
- To update after pulling new code: `docker compose up -d --build`.

## Backend API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/sessions` | Record a completed session (`type`, `durationMinutes`, `completedAt`, `date`, optional `subject`) |
| `GET` | `/api/sessions` | List sessions, filterable by `date` and `subject` |
| `GET` | `/api/stats/summary` | Total sessions, total minutes, current streak |
| `GET` | `/api/stats/by-subject` | Minutes/sessions aggregated by subject |
| `GET` | `/api/stats/by-day?days=30` | Daily study trend |

## License

Released under the [MIT](LICENSE) license.
