import { requestUnlock, sendPendingUnlocks } from '../utils/unlocks.js'
import { apiRequest } from './api.js'

// POST /api/unlocks: libera um personagem para o jogador logado.
// Devolve { unlock, created }: created = true se acabou de ser liberado, false se já estava.
function postUnlock(characterId) {
  return apiRequest('/api/unlocks', { method: 'POST', credentials: 'include', body: JSON.stringify({ characterId }) })
}

// Libera um personagem (com a fila e a nova tentativa de utils/unlocks.js). Devolve os ids liberados agora.
export function unlockCharacter(characterId) {
  return requestUnlock(characterId, postUnlock)
}

// Tenta de novo o que ficou na fila. Devolve os ids liberados agora.
export function retryPendingUnlocks() {
  return sendPendingUnlocks(postUnlock)
}
