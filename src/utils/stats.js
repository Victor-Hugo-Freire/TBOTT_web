import { CHARACTER_STATS } from '../data/characterStats.js'

// Atributos do jogador: a ficha do personagem (src/data/characterStats.js) com os bônus dos itens.
// Funções puras (sem React, sem canvas), para testar com node:test.

// Mínimo e máximo de cada atributo, depois de todos os bônus. Ajuste os limites aqui.
export const STAT_LIMITS = {
  damage: { min: 1, max: 20 }, // pontos por golpe
  moveSpeed: { min: 0.5, max: 1.6 }, // 1,6 = 416 u/s
  attackSpeed: { min: 0.5, max: 2 }, // 2 = golpe de 315 ms
  maxHealth: { min: 2, max: 12 }, // de 1 a 6 corações
  invincibilityMs: { min: 500, max: 2000 },
}

// Ficha do personagem. Um id sem ficha (save antigo ou personagem que ainda não existe) usa a do Tung Tung.
export function getBaseStats(characterId) {
  return CHARACTER_STATS[characterId] ?? CHARACTER_STATS['tung-tung-sahur']
}

// Atributos com os bônus. Cada bônus mexe em um atributo:
// - { stat: 'attackSpeed', add: 0.4 } soma 0,4 (golpe 40% mais rápido);
// - { stat: 'moveSpeed', multiply: 1.05 } multiplica por 1,05 (anda 5% mais rápido).
// Primeiro entram todos os bônus que somam, depois os que multiplicam. No fim, cada atributo fica dentro de STAT_LIMITS.
export function getPlayerStats(base, bonuses = []) {
  const stats = { ...base }
  for (const bonus of bonuses) {
    if (bonus.add) stats[bonus.stat] += bonus.add
  }
  for (const bonus of bonuses) {
    if (bonus.multiply) stats[bonus.stat] *= bonus.multiply
  }
  for (const name of Object.keys(STAT_LIMITS)) {
    const { min, max } = STAT_LIMITS[name]
    stats[name] = Math.min(max, Math.max(min, stats[name]))
  }
  return stats
}
