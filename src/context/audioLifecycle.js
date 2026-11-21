export function createAudioLifecycleCleanup(destroy) {
  let generation = 0

  function activate() {
    generation += 1
  }

  function deactivate() {
    const cleanupGeneration = generation + 1
    generation = cleanupGeneration

    queueMicrotask(() => {
      if (generation !== cleanupGeneration) return
      destroy()
    })
  }

  return { activate, deactivate }
}
