// WASD e as setas navegam pelo menu
const MENU_KEYS = new Map([
  ['w', 'up'],
  ['s', 'down'],
  ['d', 'user'],
  ['a', 'back'],
  ['arrowup', 'up'],
  ['arrowdown', 'down'],
  ['arrowright', 'user'],
  ['arrowleft', 'back'],
])

// Quem está digitando num campo não deve acionar os atalhos do teclado
export function isTypingTarget(target) {
  return Boolean(target?.isContentEditable) || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)
}

export function getMenuNavigationAction(key) {
  if (typeof key !== 'string') return null
  return MENU_KEYS.get(key.toLowerCase()) ?? null
}

// Próximo item a focar ao apertar "up" ou "down", dando a volta na lista.
// currentIndex -1 significa que nenhum item está focado: "down" vai ao primeiro e "up" ao último.
export function getNextIndex(currentIndex, action, total) {
  if (currentIndex === -1) return action === 'down' ? 0 : total - 1
  const direction = action === 'down' ? 1 : -1
  return (currentIndex + direction + total) % total
}
