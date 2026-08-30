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
    this.running = false;
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
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.endAt = Date.now() + this.remainingMs;
    this.tickHandle = setInterval(() => this._tick(), 250);
  }

  pause() {
    if (!this.running) return;
    this.running = false;
    this.remainingMs = Math.max(0, this.endAt - Date.now());
    clearInterval(this.tickHandle);
    this._emitTick();
  }

  reset() {
    this.running = false;
    clearInterval(this.tickHandle);
    this.remainingMs = this.durationForPhase(this.phase) * 60000;
    this._emitTick();
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
      this._completeCurrentPhase(true);
    }
  }

  _completeCurrentPhase(natural) {
    const completedPhase = this.phase;
    const duration = this.durationForPhase(completedPhase);

    if (completedPhase === PHASES.FOCUS) {
      this.cycleCount += 1;
    }

    if (this.onPhaseComplete) {
      this.onPhaseComplete({ phase: completedPhase, durationMinutes: duration, natural });
    }

    this._advancePhase(completedPhase);
    this.remainingMs = this.durationForPhase(this.phase) * 60000;
    this._emitTick();

    if (natural && this.settings.autoStart) {
      this.start();
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
