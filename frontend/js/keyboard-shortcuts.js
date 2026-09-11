export function setupKeyboardShortcuts(timer) {
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

    if (e.code === 'Space') {
      e.preventDefault();
      timer.running ? timer.pause() : timer.start();
    } else if (e.code === 'KeyR') {
      e.preventDefault();
      timer.reset();
    } else if (e.code === 'KeyS') {
      e.preventDefault();
      timer.skip();
    }
  });
}
