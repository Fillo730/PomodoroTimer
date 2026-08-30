import { getSummary, getBySubject, getByDay } from './api.js';

let dayChart;
let subjectChart;

function formatMinutes(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

export async function refreshStats() {
  const [summary, bySubject, byDay] = await Promise.all([
    getSummary(),
    getBySubject(),
    getByDay(30),
  ]);

  document.getElementById('stat-sessions').textContent = summary.totalSessions;
  document.getElementById('stat-time').textContent = formatMinutes(summary.totalMinutes);
  document.getElementById('stat-streak').textContent = summary.streak;

  renderDayChart(byDay);
  renderSubjectChart(bySubject);
}

function chartColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    accent: styles.getPropertyValue('--accent').trim() || '#e0533d',
    accentSoft: styles.getPropertyValue('--accent-soft').trim() || 'rgba(224, 83, 61, 0.2)',
    text: styles.getPropertyValue('--text').trim() || '#1a1a1a',
    grid: styles.getPropertyValue('--border').trim() || '#e2e2e2',
  };
}

function renderDayChart(byDay) {
  const ctx = document.getElementById('chart-by-day');
  const colors = chartColors();
  const labels = byDay.map((d) => d.date.slice(5));
  const data = byDay.map((d) => d.totalMinutes);

  if (dayChart) dayChart.destroy();
  dayChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Minuti di studio',
          data,
          borderColor: colors.accent,
          backgroundColor: colors.accentSoft,
          tension: 0.3,
          fill: true,
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: colors.text } } },
      scales: {
        x: { ticks: { color: colors.text }, grid: { color: colors.grid } },
        y: { beginAtZero: true, ticks: { color: colors.text }, grid: { color: colors.grid } },
      },
    },
  });
}

function renderSubjectChart(bySubject) {
  const ctx = document.getElementById('chart-by-subject');
  const colors = chartColors();
  const labels = bySubject.map((s) => s.subject);
  const data = bySubject.map((s) => s.totalMinutes);

  if (subjectChart) subjectChart.destroy();
  subjectChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Minuti per materia',
          data,
          backgroundColor: colors.accent,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: colors.text } } },
      scales: {
        x: { ticks: { color: colors.text }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { color: colors.text }, grid: { color: colors.grid } },
      },
    },
  });
}
