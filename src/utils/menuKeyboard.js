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

export function getMenuNavigationAction(key) {
  if (typeof key !== 'string') return null
  return MENU_KEYS.get(key.toLowerCase()) ?? null
}
