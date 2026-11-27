// Personagens bloqueados e liberados. Funções puras (sem React), para testar com node:test.

// Um personagem está bloqueado quando não começa liberado e o jogador ainda não o liberou.
// character vem de GET /api/characters (startsUnlocked) e unlockedIds de GET /api/unlocks (ids liberados).
// Se a API não mandar startsUnlocked (versão antiga), ninguém fica bloqueado.
export function isCharacterLocked(character, unlockedIds) {
  return character.startsUnlocked === false && !unlockedIds.includes(character.id)
}

// ---------- fila de desbloqueios ----------
// Liberar um personagem é uma chamada à API (POST /api/unlocks). Se ela falhar (servidor fora do ar, sessão vencida),
// o jogador não pode perder o personagem nem ficar com a run travada: o id fica numa fila no navegador e a chamada é
// tentada de novo depois (ao abrir a sala, a cada salvamento e ao abrir a seleção). A run nunca espera por isso.

export const PENDING_UNLOCKS_KEY = 'tbott.desbloqueiosPendentes'

// O localStorage do navegador (undefined onde ele não existe, como nos testes: aí a fila fica só na memória do teste)
function getBrowserStorage() {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

// Ids na fila. Texto estragado ou sem localStorage valem fila vazia.
export function readPendingUnlocks(storage = getBrowserStorage()) {
  try {
    const list = JSON.parse(storage.getItem(PENDING_UNLOCKS_KEY))
    return Array.isArray(list) ? list.filter((id) => typeof id === 'string' && id) : []
  } catch {
    return []
  }
}

function writePendingUnlocks(list, storage) {
  try {
    storage.setItem(PENDING_UNLOCKS_KEY, JSON.stringify(list))
  } catch {
    // sem localStorage: a fila fica só até o fim da tentativa
  }
}

// Erro que não adianta tentar de novo: o corpo da chamada é inválido (400). Os outros (sem rede, 401, 422 por o banco
// ainda não ter o personagem, 503) continuam na fila.
function isFinalError(error) {
  return error?.status === 400
}

// Tentativa em andamento: duas chamadas ao mesmo tempo (a sala e o salvamento de 5 s) esperam a mesma
let sending = null

// Tenta mandar a fila toda. post(id) faz a chamada e devolve a resposta da API ({ created: true } se o personagem
// acabou de ser liberado, false se já estava). Devolve os ids que foram liberados AGORA (os que mostram o aviso).
export async function sendPendingUnlocks(post, storage = getBrowserStorage()) {
  if (sending) return sending
  sending = sendAll(post, storage) // nunca falha: os erros da chamada ficam dentro de sendAll
  const created = await sending
  sending = null
  return created
}

async function sendAll(post, storage) {
  const created = []
  for (const id of readPendingUnlocks(storage)) {
    try {
      const response = await post(id)
      if (response?.created) created.push(id)
    } catch (error) {
      if (!isFinalError(error)) continue // fica na fila para a próxima
    }
    // Deu certo (ou erro sem volta): sai da fila. Lê de novo, porque outro id pode ter entrado enquanto esperava a API.
    writePendingUnlocks(readPendingUnlocks(storage).filter((pending) => pending !== id), storage)
  }
  return created
}

// Pede para liberar um personagem: põe o id na fila (uma vez só) e tenta mandar já.
// Se já havia uma tentativa em andamento (ela leu a fila antes deste id entrar), espera ela acabar e tenta de novo.
// Devolve os ids liberados agora (veja sendPendingUnlocks).
export async function requestUnlock(characterId, post, storage = getBrowserStorage()) {
  const pending = readPendingUnlocks(storage)
  if (!pending.includes(characterId)) writePendingUnlocks([...pending, characterId], storage)
  if (sending) await sending
  return sendPendingUnlocks(post, storage)
}
