// Atributos base de cada personagem, sem itens (a ficha): o Tung Tung Sahur, o Tung Tung Sabor e o Tung Tung God.
// Os atributos ficam só aqui no front (a API guarda só quem é cada personagem e quem está liberado).
// Os itens mudam esses valores com bônus, dentro dos limites de STAT_LIMITS (src/utils/stats.js).
//
// Unidades:
// - name: nome mostrado no jogo (leitor de tela e aviso de morte);
// - damage: dano do golpe em pontos. É a mesma escala da vida dos inimigos no catálogo da API
//   (valor de referência do catálogo: o golpe básico tira 3);
// - moveSpeed: velocidade de andar, como multiplicador (1 = 260 unidades da sala por segundo);
// - attackSpeed: velocidade do golpe, como multiplicador (1 = golpe de 630 ms e espera de 430 ms;
//   2 = os dois na metade do tempo);
// - maxHealth: vida máxima em MEIOS corações (6 = 3 corações);
// - invincibilityMs: quanto tempo ele fica invencível depois de levar dano;
// - attackArea: tamanho da caixa do golpe, como multiplicador (1 = ATTACK_HITBOXES de player.js);
// - flying: voa. O piso (esteira, líquido, grudento, cacos) e os perigos do chão (chapa quente, cacos) não o afetam,
//   como os inimigos que voam (FLYING_ENEMIES). O Sahur e o Sabor andam; o God voa.
//   Não é número, então fica fora de STAT_LIMITS e os itens não mudam.
export const CHARACTER_STATS = {
  'tung-tung-sahur': {
    name: 'Tung Tung Sahur',
    damage: 3,
    moveSpeed: 1,
    attackSpeed: 1,
    maxHealth: 6,
    invincibilityMs: 1000,
    attackArea: 1,
    flying: false,
  },
  'tung-tung-sabor': {
    name: 'Tung Tung Sabor',
    damage: 3,
    moveSpeed: 0.9,
    attackSpeed: 0.9,
    maxHealth: 8,
    invincibilityMs: 1000,
    attackArea: 1,
    flying: false,
  },
  'tung-tung-god': {
    name: 'Tung Tung God',
    damage: 2.5,
    moveSpeed: 1.1,
    attackSpeed: 1,
    maxHealth: 4,
    invincibilityMs: 1000,
    attackArea: 1,
    flying: true,
  },
}
