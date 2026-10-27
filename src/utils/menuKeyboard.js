const MENU_KEYS = new Map([
  ['w', 'up'],
  ['arrowup', 'up'],
  ['s', 'down'],
  ['arrowdown', 'down'],
  ['d', 'user'],
  ['arrowright', 'user'],
  ['a', 'back'],
  ['arrowleft', 'back'],
])

export function getMenuNavigationAction(key) {
  if (typeof key !== 'string') return null
  return MENU_KEYS.get(key.toLowerCase()) ?? null
}
