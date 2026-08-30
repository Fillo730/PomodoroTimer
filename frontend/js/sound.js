let audioCtx;

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export function playChime(volumePercent = 50) {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.value = Math.max(0, Math.min(1, volumePercent / 100)) * 0.3;
  gain.connect(ctx.destination);

  [880, 1320].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    const start = now + i * 0.15;
    osc.start(start);
    osc.stop(start + 0.35);
  });
}
