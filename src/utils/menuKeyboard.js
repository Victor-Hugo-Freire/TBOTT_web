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
