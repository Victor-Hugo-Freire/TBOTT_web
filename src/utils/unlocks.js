// Personagens bloqueados e liberados. Funções puras (sem React), para testar com node:test.

// Um personagem está bloqueado quando não começa liberado e o jogador ainda não o liberou.
// character vem de GET /api/characters (startsUnlocked) e unlockedIds de GET /api/unlocks (ids liberados).
// Se a API não mandar startsUnlocked (versão antiga), ninguém fica bloqueado.
export function isCharacterLocked(character, unlockedIds) {
  return character.startsUnlocked === false && !unlockedIds.includes(character.id)
}
