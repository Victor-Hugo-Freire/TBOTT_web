// Preferências da tela de Options, salvas no localStorage deste navegador.
export const OPTIONS_STORAGE_KEY = 'tbott.options'
export const DEFAULT_OPTIONS = { musicVolume: 70, effectsVolume: 80 }

// Volume de 0 a 100. Só aceita número: null e '' usariam Number() e virariam 0.
export function normalizeVolume(value, fallback) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(100, Math.max(0, value))
}

// Converte o texto salvo em preferências válidas. JSON quebrado lança erro para quem chamou avisar.
export function parseOptions(savedText) {
  if (!savedText) return DEFAULT_OPTIONS

  const saved = JSON.parse(savedText)
  return {
    musicVolume: normalizeVolume(saved?.musicVolume, DEFAULT_OPTIONS.musicVolume),
    effectsVolume: normalizeVolume(saved?.effectsVolume, DEFAULT_OPTIONS.effectsVolume),
  }
}

// O navegador pode bloquear o localStorage; nesse caso a tela usa o padrão e mostra o erro.
export function readOptions() {
  try {
    return { options: parseOptions(window.localStorage.getItem(OPTIONS_STORAGE_KEY)), error: '' }
  } catch {
    return {
      options: DEFAULT_OPTIONS,
      error: 'Não foi possível carregar as preferências salvas neste navegador.',
    }
  }
}
