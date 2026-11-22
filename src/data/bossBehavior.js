// Números dos chefes que não estão no catálogo da API. A tabela bosses tem vida, dano de encostar, ataques (com o
// dano de cada um) e os andares; o resto (tamanho do corpo, velocidade, fases) fica aqui, como em enemyBehavior.js.

// Caixa do corpo de cada chefe, em unidades da sala, do pé até o alto da cabeça: é nela que o golpe acerta.
// Medida como a dos inimigos: a parte opaca do quadro 0 da animação "parado" (pernas + tronco @1x, com o contorno).
export const BOSS_BODIES = {
  'ballerina-cappuccina': { width: 153, height: 243 },
  'bombardiro-crocodilo': { width: 217, height: 267 },
  'brr-brr-patapim': { width: 176, height: 274 },
  'cappuccino-assassino': { width: 199, height: 196 },
  'chimpanzini-bananini': { width: 165, height: 239 },
  'cinquecento-turbo': { width: 247, height: 232 },
  'nonna-lasagnona': { width: 210, height: 229 },
  'tralalero-tralala': { width: 301, height: 354 },
}

// Caixa da base do chefe (a que bate nas paredes e nos obstáculos): BASE_WIDTH_SHARE da largura do corpo e
// BASE_HEIGHT u de fundo. Com a base pequena dos inimigos (44 u), um chefe grande entraria pela metade na parede.
export const BOSS_BASE_WIDTH_SHARE = 0.6
export const BOSS_BASE_HEIGHT = 40

// Encostar no chefe machuca numa área mais funda que a dos inimigos (36 u): o corpo dele ocupa mais chão
export const BOSS_CONTACT_DEPTH = 60

// Velocidade de andar de cada chefe, em u/s (a tabela bosses não tem speed). Os ataques têm as velocidades deles.
export const BOSS_SPEEDS = {
  'ballerina-cappuccina': 140,
  'bombardiro-crocodilo': 130,
  'brr-brr-patapim': 90,
  'cappuccino-assassino': 170,
  'chimpanzini-bananini': 150,
  'cinquecento-turbo': 160,
  'nonna-lasagnona': 80,
  'tralalero-tralala': 140,
}

// Marcas das fases na barra de vida, em fração da vida (0,5 = metade). Ao chegar numa marca, o chefe muda de fase.
// Chefe sem marca tem uma fase só.
// - Chimpanzini: na metade perde a casca da banana;
// - Nonna: as 4 camadas de lasanha (perde uma a cada quarto da vida);
// - Tralalero: 3 fases (decisão do Victor, 2026-11-22).
export const BOSS_PHASES = {
  'chimpanzini-bananini': [0.5],
  'nonna-lasagnona': [0.75, 0.5, 0.25],
  'tralalero-tralala': [2 / 3, 1 / 3],
}

// Animações em que o chefe fica parado esperando o golpe (a janela de contra-ataque): a barra mostra "VULNERAVEL".
// O golpe tira vida a qualquer hora (decisão do Victor, 2026-11-22): a janela é só o momento seguro.
export const VULNERABLE_ANIMATIONS = ['esfriando', 'tropeco-vulneravel', 'tonta', 'pousado']

// A Muçarela prende o chefe só por este tempo (nos inimigos, o tempo do catálogo)
export const BOSS_STUN_MS = 300
