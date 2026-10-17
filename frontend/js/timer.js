export const PHASES = {
  FOCUS: 'focus',
  SHORT_BREAK: 'short_break',
  LONG_BREAK: 'long_break',
};

export class PomodoroTimer {
  constructor(settings) {
    this.settings = settings;
    this.phase = PHASES.FOCUS;
    this.cycleCount = 0;
    this.remainingMs = this.durationForPhase(this.phase) * 60000;
    this.endAt = null;
    this.tickHandle = null;
    this.onTick = null;
    this.onPhaseComplete = null;
    this.onStateChange = null;
    this.running = false;
  }

  getState() {
    return {
      phase: this.phase,
      cycleCount: this.cycleCount,
      running: this.running,
      endAt: this.running ? this.endAt : null,
      remainingMs: this.remainingMs,
    };
  }

  // Ripristina uno stato salvato con getState(). Se la fase era in corso ed è
  // scaduta mentre la pagina era chiusa, viene completata con l'orario di fine
  // originale, senza avviare automaticamente la fase successiva.
  restoreState(state) {
    if (!state || !Object.values(PHASES).includes(state.phase)) {
      this._emitTick();
      return;
    }
    this.phase = state.phase;
    this.cycleCount = Number.isInteger(state.cycleCount) && state.cycleCount >= 0 ? state.cycleCount : 0;
    const totalMs = this.durationForPhase(this.phase) * 60000;

    if (state.running && Number.isFinite(state.endAt)) {
      if (state.endAt > Date.now()) {
        this.remainingMs = state.endAt - Date.now();
        this.running = true;
        this.endAt = state.endAt;
        this.tickHandle = setInterval(() => this._tick(), 250);
        this._emitTick();
      } else {
        this._completeCurrentPhase(true, { completedAt: state.endAt, restored: true });
      }
      return;
    }

    const remaining = Number(state.remainingMs);
    this.remainingMs = Number.isFinite(remaining) && remaining > 0 ? Math.min(remaining, totalMs) : totalMs;
    this._emitTick();
    this._emitStateChange();
  }

  durationForPhase(phase) {
    if (phase === PHASES.FOCUS) return this.settings.focusMinutes;
    if (phase === PHASES.SHORT_BREAK) return this.settings.shortBreakMinutes;
    return this.settings.longBreakMinutes;
  }

  updateSettings(settings) {
    this.settings = settings;
    if (!this.running) {
      this.remainingMs = this.durationForPhase(this.phase) * 60000;
      this._emitTick();
      this._emitStateChange();
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.endAt = Date.now() + this.remainingMs;
    this.tickHandle = setInterval(() => this._tick(), 250);
    this._emitStateChange();
  }

  pause() {
    if (!this.running) return;
    this.running = false;
    this.remainingMs = Math.max(0, this.endAt - Date.now());
    clearInterval(this.tickHandle);
    this._emitTick();
    this._emitStateChange();
  }

  reset() {
    this.running = false;
    clearInterval(this.tickHandle);
    this.remainingMs = this.durationForPhase(this.phase) * 60000;
    this._emitTick();
    this._emitStateChange();
  }

  skip() {
    this.running = false;
    clearInterval(this.tickHandle);
    this._completeCurrentPhase(false);
  }

  _tick() {
    this.remainingMs = Math.max(0, this.endAt - Date.now());
    this._emitTick();
    if (this.remainingMs <= 0) {
      clearInterval(this.tickHandle);
      this.running = false;
      this._completeCurrentPhase(true, { completedAt: this.endAt });
    }
  }

  _completeCurrentPhase(natural, { completedAt = Date.now(), restored = false } = {}) {
    const completedPhase = this.phase;
    const duration = this.durationForPhase(completedPhase);

    if (completedPhase === PHASES.FOCUS) {
      this.cycleCount += 1;
    }

    if (this.onPhaseComplete) {
      this.onPhaseComplete({ phase: completedPhase, durationMinutes: duration, natural, completedAt, restored });
    }

    this._advancePhase(completedPhase);
    this.remainingMs = this.durationForPhase(this.phase) * 60000;
    this._emitTick();

    if (natural && !restored && this.settings.autoStart) {
      this.start();
    } else {
      this._emitStateChange();
    }
  }

  _advancePhase(completedPhase) {
    if (completedPhase === PHASES.FOCUS) {
      const isLongBreakDue = this.cycleCount % this.settings.cyclesBeforeLongBreak === 0;
      this.phase = isLongBreakDue ? PHASES.LONG_BREAK : PHASES.SHORT_BREAK;
    } else {
      this.phase = PHASES.FOCUS;
    }
  }

  _emitStateChange() {
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  _emitTick() {
    if (this.onTick) {
      this.onTick({
        phase: this.phase,
        remainingMs: this.remainingMs,
        totalMs: this.durationForPhase(this.phase) * 60000,
        cycleCount: this.cycleCount,
        running: this.running,
      });
    }
  }
}
