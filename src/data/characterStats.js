// Atributos base de cada personagem, sem itens (a ficha). Por enquanto só existe o Tung Tung Sahur;
// os outros dois personagens jogáveis virão depois, cada um com a sua ficha aqui.
// Os itens mudam esses valores com bônus, dentro dos limites de STAT_LIMITS (src/utils/stats.js).
//
// Unidades:
// - damage: dano do golpe em pontos. É a mesma escala da vida dos inimigos no catálogo da API
//   (valor de referência do catálogo: o golpe básico tira 3);
// - moveSpeed: velocidade de andar, como multiplicador (1 = 260 unidades da sala por segundo);
// - attackSpeed: velocidade do golpe, como multiplicador (1 = golpe de 630 ms e espera de 430 ms;
//   2 = os dois na metade do tempo);
// - maxHealth: vida máxima em MEIOS corações (6 = 3 corações);
// - invincibilityMs: quanto tempo ele fica invencível depois de levar dano.
export const CHARACTER_STATS = {
  'tung-tung-sahur': {
    damage: 3,
    moveSpeed: 1,
    attackSpeed: 1,
    maxHealth: 6,
    invincibilityMs: 1000,
  },
}
