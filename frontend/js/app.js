import { postSession, getSessions, getApiBase, setApiBase } from './api.js';
import { loadSettings, saveSettings } from './settings.js';
import { PomodoroTimer, PHASES } from './timer.js';
import { playChime } from './sound.js';
import { requestNotificationPermission, notify, isNotificationSupported } from './notifications.js';
import { refreshStats } from './stats.js';

const PHASE_LABELS = {
  [PHASES.FOCUS]: 'Focus',
  [PHASES.SHORT_BREAK]: 'Pausa breve',
  [PHASES.LONG_BREAK]: 'Pausa lunga',
};

const PENDING_KEY = 'pomodoro:pendingSessions';

let settings = loadSettings();
const timer = new PomodoroTimer(settings);

const els = {
  modeLabel: document.getElementById('mode-label'),
  timeDisplay: document.getElementById('time-display'),
  ringProgress: document.getElementById('ring-progress'),
  cycleInfo: document.getElementById('cycle-info'),
  subjectInput: document.getElementById('subject-input'),
  subjectList: document.getElementById('subject-list'),
  btnStart: document.getElementById('btn-start'),
  btnPause: document.getElementById('btn-pause'),
  btnReset: document.getElementById('btn-reset'),
  btnSkip: document.getElementById('btn-skip'),
  navButtons: document.querySelectorAll('.nav-btn'),
  views: document.querySelectorAll('.view'),
  settingsForm: document.getElementById('settings-form'),
  setFocus: document.getElementById('set-focus'),
  setShort: document.getElementById('set-short'),
  setLong: document.getElementById('set-long'),
  setCycles: document.getElementById('set-cycles'),
  setAutostart: document.getElementById('set-autostart'),
  setVolume: document.getElementById('set-volume'),
  setApiBase: document.getElementById('set-api-base'),
  btnEnableNotif: document.getElementById('btn-enable-notifications'),
  notifStatus: document.getElementById('notif-status'),
};

const RING_CIRCUMFERENCE = 2 * Math.PI * 90;
els.ringProgress.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function localDateString(date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function renderTick({ phase, remainingMs, totalMs, cycleCount, running }) {
  els.modeLabel.textContent = PHASE_LABELS[phase];
  els.timeDisplay.textContent = formatTime(remainingMs);
  document.title = `${formatTime(remainingMs)} · ${PHASE_LABELS[phase]}`;
  const progress = totalMs > 0 ? remainingMs / totalMs : 0;
  els.ringProgress.style.strokeDashoffset = `${RING_CIRCUMFERENCE * progress}`;
  const cyclePosition = (cycleCount % settings.cyclesBeforeLongBreak) + 1;
  els.cycleInfo.textContent = `Ciclo ${cyclePosition} di ${settings.cyclesBeforeLongBreak}`;
  els.btnStart.disabled = running;
  els.btnPause.disabled = !running;
  document.body.dataset.phase = phase;
}

timer.onTick = renderTick;

timer.onPhaseComplete = async ({ phase, durationMinutes, natural }) => {
  playChime(settings.volume);
  notify(
    phase === PHASES.FOCUS ? 'Sessione completata!' : 'Pausa terminata',
    phase === PHASES.FOCUS
      ? 'Ottimo lavoro, è ora di una pausa.'
      : 'Pronto per la prossima sessione di focus?'
  );

  if (!natural) return;

  const now = new Date();
  const session = {
    type: phase,
    durationMinutes,
    completedAt: now.toISOString(),
    date: localDateString(now),
  };
  if (phase === PHASES.FOCUS) {
    const subject = els.subjectInput.value.trim();
    if (subject) session.subject = subject;
  }

  await recordSession(session);
};

async function recordSession(session) {
  try {
    await postSession(session);
    await flushPendingSessions();
  } catch {
    queuePendingSession(session);
  }
  const statsView = document.getElementById('view-stats');
  if (statsView.classList.contains('active')) {
    refreshStats().catch(() => {});
  }
}

function queuePendingSession(session) {
  const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
  pending.push(session);
  localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

async function flushPendingSessions() {
  const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
  if (pending.length === 0) return;
  const remaining = [];
  for (const session of pending) {
    try {
      await postSession(session);
    } catch {
      remaining.push(session);
    }
  }
  localStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
}

function applySettingsToForm() {
  els.setFocus.value = settings.focusMinutes;
  els.setShort.value = settings.shortBreakMinutes;
  els.setLong.value = settings.longBreakMinutes;
  els.setCycles.value = settings.cyclesBeforeLongBreak;
  els.setAutostart.checked = settings.autoStart;
  els.setVolume.value = settings.volume;
  els.setApiBase.value = getApiBase();
}

els.settingsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  settings = {
    focusMinutes: Number(els.setFocus.value) || 25,
    shortBreakMinutes: Number(els.setShort.value) || 5,
    longBreakMinutes: Number(els.setLong.value) || 15,
    cyclesBeforeLongBreak: Math.max(1, Number(els.setCycles.value) || 4),
    autoStart: els.setAutostart.checked,
    volume: Number(els.setVolume.value),
  };
  saveSettings(settings);
  if (els.setApiBase.value.trim()) setApiBase(els.setApiBase.value.trim());
  timer.updateSettings(settings);
  switchView('timer');
});

els.btnStart.addEventListener('click', () => {
  requestNotificationPermission().catch(() => {});
  timer.start();
});
els.btnPause.addEventListener('click', () => timer.pause());
els.btnReset.addEventListener('click', () => timer.reset());
els.btnSkip.addEventListener('click', () => timer.skip());

els.btnEnableNotif.addEventListener('click', async () => {
  const result = await requestNotificationPermission();
  els.notifStatus.textContent =
    result === 'granted'
      ? 'Notifiche abilitate.'
      : result === 'unsupported'
        ? 'Il browser non supporta le notifiche.'
        : 'Permesso negato. Abilitalo dalle impostazioni del browser.';
});

function switchView(name) {
  els.views.forEach((v) => v.classList.toggle('active', v.id === `view-${name}`));
  els.navButtons.forEach((b) => b.classList.toggle('active', b.id === `nav-${name}`));
  if (name === 'stats') refreshStats().catch((err) => console.error('Errore statistiche:', err));
}

els.navButtons.forEach((btn) => {
  btn.addEventListener('click', () => switchView(btn.id.replace('nav-', '')));
});

async function loadRecentSubjects() {
  try {
    const sessions = await getSessions();
    const subjects = [...new Set(sessions.filter((s) => s.type === 'focus').map((s) => s.subject))];
    els.subjectList.innerHTML = '';
    subjects.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s;
      els.subjectList.appendChild(opt);
    });
  } catch {
    // backend non raggiungibile: il timer resta comunque utilizzabile offline
  }
}

applySettingsToForm();
renderTick({
  phase: timer.phase,
  remainingMs: timer.remainingMs,
  totalMs: timer.durationForPhase(timer.phase) * 60000,
  cycleCount: timer.cycleCount,
  running: false,
});
loadRecentSubjects();
flushPendingSessions();

if (isNotificationSupported() && Notification.permission === 'default') {
  els.notifStatus.textContent = 'Abilita le notifiche per essere avvisato a fine sessione.';
}
