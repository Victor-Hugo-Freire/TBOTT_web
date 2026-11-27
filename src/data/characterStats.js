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
// - lightBurst (só o God): cada acerto do cetro solta uma explosão de luz que dá `damage` de dano e atordoa por `stunMs`
//   o alvo e os inimigos a até `range` u dele (menos os que o próprio golpe já acertou, que só levam a luz do alvo
//   deles). O mesmo inimigo só é atordoado de novo depois de `restunDelayMs`, como na Muçarela;
// - splash (só o Sabor): cada acerto do taco respinga whisky: o alvo e os inimigos a até `range` u dele andam a
//   `speedMultiplier` da velocidade por `ms` (e ficam tingidos e pingando). `puddleMultiplier` é a velocidade dentro da poça da Concha Longa
//   (0,4 em vez de 0,5): a lentidão não soma, vale a mais forte.
// Nenhum dos dois é limitado por STAT_LIMITS: os itens não mudam.
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
    splash: { range: 110, speedMultiplier: 0.6, ms: 1500, puddleMultiplier: 0.4 },
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
    lightBurst: { damage: 1, range: 160, stunMs: 500, restunDelayMs: 2000 },
  },
}
