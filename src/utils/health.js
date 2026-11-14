// Vida do personagem, em funções puras (sem React, sem canvas), para testar.
// A vida é contada em MEIOS corações: 6 = 3 corações cheios. Assim meio coração é sempre um número inteiro.
export const MAX_HEALTH = 6

// Quanto cada tipo de golpe tira:
// - leve: batida de inimigo e obstáculo que machuca (a chapa quente) = meio coração;
// - pesado: explosões e ataques mais fortes = 1 coração inteiro.
export const DAMAGE_LIGHT = 1
export const DAMAGE_HEAVY = 2

// Vida depois de levar `amount` de dano: nunca fica abaixo de 0
export function applyDamage(health, amount) {
  return Math.max(0, health - amount)
}

// Vida salva no progresso: inteiro de 0 a MAX_HEALTH. Qualquer outra coisa (ou save antigo, sem vida) = vida cheia.
export function normalizeHealth(value) {
  return Number.isInteger(value) && value >= 0 && value <= MAX_HEALTH ? value : MAX_HEALTH
}

// Estado de cada coração do HUD, da esquerda para a direita: 'full', 'half' ou 'empty'.
// Ex.: vida 3 (um coração e meio) = ['full', 'half', 'empty'].
export function getHeartStates(health, maxHealth = MAX_HEALTH) {
  const states = []
  for (let heart = 0; heart < maxHealth / 2; heart++) {
    const remaining = health - heart * 2
    states.push(remaining >= 2 ? 'full' : remaining === 1 ? 'half' : 'empty')
  }
  return states
}

// O que matou o personagem, para o aviso de morte. A causa é o id do obstáculo (e, depois, do inimigo ou do chefe).
// O texto completa a frase "O Tung Tung morreu para ...".
const DEATH_CAUSES = {
  chapa: 'a chapa quente',
}

export function getDeathCauseLabel(cause) {
  return DEATH_CAUSES[cause] ?? 'um perigo da sala'
}
