export function installAudioUnlock(target, unlock) {
  let installed = true
  let unlockPromise = null

  function removeListeners() {
    if (!installed) return
    installed = false
    target.removeEventListener('keydown', handleInteraction)
    target.removeEventListener('pointerdown', handleInteraction)
  }

  function handleInteraction(event) {
    if (event.type === 'keydown' && event.repeat) return
    if (!installed || unlockPromise) return

    unlockPromise = Promise.resolve()
      .then(() => unlock())
      .then((result) => {
        if (!installed) return

        if (result?.unlocked) {
          removeListeners()
          return
        }

        if (
          result?.reason === 'unsupported'
          || result?.reason === 'destroyed'
          || result?.reason === 'failed'
          || result?.reason === 'audio-unavailable'
        ) {
          removeListeners()
        }
      })
      .catch(() => {
        // Falhas transitórias permitem uma nova interação do usuário.
      })
      .finally(() => {
        unlockPromise = null
      })
  }

  target.addEventListener('keydown', handleInteraction)
  target.addEventListener('pointerdown', handleInteraction)

  return removeListeners
}
