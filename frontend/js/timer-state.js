const STATE_KEY = 'pomodoro:timerState';
const SUBJECT_KEY = 'pomodoro:subject';

export function loadTimerState() {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY));
  } catch {
    return null;
  }
}

export function saveTimerState(state) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // storage non disponibile: il timer funziona comunque, senza ripristino
  }
}

export function loadSubject() {
  try {
    return localStorage.getItem(SUBJECT_KEY) || '';
  } catch {
    return '';
  }
}

export function saveSubject(subject) {
  try {
    localStorage.setItem(SUBJECT_KEY, subject);
  } catch {
    // ignorato, come sopra
  }
}
