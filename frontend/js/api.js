const DEFAULT_API_BASE = 'http://localhost:3001/api';
const API_BASE_KEY = 'pomodoro:apiBase';

export function getApiBase() {
  return localStorage.getItem(API_BASE_KEY) || DEFAULT_API_BASE;
}

export function setApiBase(url) {
  localStorage.setItem(API_BASE_KEY, url);
}

async function request(path, options = {}) {
  const res = await fetch(`${getApiBase()}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Errore richiesta: ${res.status}`);
  }
  return res.json();
}

export function postSession(session) {
  return request('/sessions', { method: 'POST', body: JSON.stringify(session) });
}

export function getSessions(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/sessions${qs ? `?${qs}` : ''}`);
}

export function getSummary() {
  return request('/stats/summary');
}

export function getBySubject() {
  return request('/stats/by-subject');
}

export function getByDay(days = 30) {
  return request(`/stats/by-day?days=${days}`);
}
