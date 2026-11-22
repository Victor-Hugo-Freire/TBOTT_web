export function canPauseRun(run) {
  return Boolean(run && !run.finished && !run.death && !run.transition && !run.sleep)
}

export function getEffectivePauseState({ pauseView = 'closed', windowPaused = false } = {}) {
  return pauseView !== 'closed' || windowPaused
}

export function togglePauseView(pauseView) {
  return pauseView === 'closed' ? 'menu' : 'closed'
}

export function clearPausedKeys(keys, clearRestart) {
  keys.clear()
  clearRestart()
}
