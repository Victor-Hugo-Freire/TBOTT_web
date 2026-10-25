// Teclas que nunca avançam de tela: modificadoras, travas e teclas de
// navegação ou do sistema. Elas continuam funcionando normalmente no navegador.
const IGNORED_KEYS = new Set([
  'Control',
  'Alt',
  'AltGraph',
  'Shift',
  'Meta',
  'OS', // nome antigo da tecla Windows em alguns navegadores
  'CapsLock',
  'NumLock',
  'ScrollLock',
  'Fn',
  'FnLock',
  'Tab',
  'Escape',
  'ContextMenu',
  'PrintScreen',
  'Pause',
  'Unidentified',
  'Process', // tecla em uso pelo teclado de acentuação (IME)
])

// F1 a F24, incluindo o F5 (atualizar a página)
const FUNCTION_KEY = /^F\d{1,2}$/

// Diz se a tecla pressionada deve levar o jogador para a próxima tela.
export function isAdvanceKey(event) {
  // Evento sem tecla (por exemplo, preenchimento automático do navegador)
  if (typeof event.key !== 'string') return false
  // Tecla segurada repete o evento; só o primeiro aperto conta
  if (event.repeat || event.isComposing) return false
  // Atalhos como Ctrl+A, Alt+Tab e Windows+R
  if (event.ctrlKey || event.altKey || event.metaKey) return false
  if (IGNORED_KEYS.has(event.key)) return false
  if (FUNCTION_KEY.test(event.key)) return false
  return true
}
