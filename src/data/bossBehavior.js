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

// ---------- comportamento de cada chefe (bossBehaviors.js). Distâncias em u, tempos em ms, velocidades em u/s. ----------
// Os tempos de aviso e de recuperação de cada ataque saem das folhas (bossSprites.js); os danos, do catálogo (attacks).

// Cinquecento Turbo: anda atrás do Tung; perto (honkRange), buzina: a onda de som machuca até honkRadius dos pés dele,
// nos quadros de acerto (honkScale: o desenho, 284 u de largura na escala 1, do tamanho dessa área). Depois de andar
// walkMs, ou logo depois de buzinar, acelera parado (o aviso, 520 ms) e investe a chargeSpeed, ricocheteando nas paredes;
// na batida número bounces + 1 ele para e abre o capô para esfriar (a janela de bater, 840 ms). Na investida, encostar
// nele tira o dano da investida (catálogo), e não o de encostar.
export const CINQUECENTO = { walkMs: 1500, honkRange: 210, honkRadius: 190, honkScale: 1.35, chargeSpeed: 620, bounces: 2, maxChargeMs: 4000, restMs: 500 }

// Tralalero Tralala (andar 5), 3 fases (marcas em BOSS_PHASES):
// - fase 1: anda atrás do Tung; perto (biteRange), morde (acerta quem está a até biteRange nos quadros de acerto).
//   Depois de andar walkMs, faz a investida tripla: `dashes` avanços em linha reta a chargeSpeed (cada um até dashMs
//   ou até bater), com o aviso antes de cada um; no fim tropeça (a janela de bater, 720 ms);
// - fase 2 (os óculos escuros): ganha o canto (`notes` notas musicais em leque, abertas noteSpread radianos, a
//   noteSpeed u/s, que somem em noteMs) e a pauta: uma pauta musical no chão, na fileira do Tung, saindo do lado dele
//   até staffLength u para o lado do Tung; nos quadros de acerto, machuca quem está nela (staffHeight u de altura).
//   staffScale: o desenho da pauta (284 u de largura na escala 1) do tamanho de staffLength;
// - fase 3: tudo fica phase3Speed vezes mais rápido (e os descansos mais curtos) e ele ganha o mergulho: some no chão
//   e a barbatana persegue o Tung a finSpeed (até finMaxMs); chegando a emergeRange, ele sai mordendo (como a mordida,
//   com o dano do mergulho).
// Os ataques de longe revezam na ordem da fase (veja TRALALERO_ATTACKS em bossBehaviors.js).
export const TRALALERO = {
  walkMs: 1400,
  biteRange: 175,
  chargeSpeed: 680,
  dashMs: 650,
  dashes: 3,
  notes: 3,
  noteSpread: 0.35,
  noteSpeed: 330,
  noteMs: 2500,
  staffLength: 455,
  staffHeight: 56,
  staffScale: 1.6,
  finSpeed: 300,
  finMaxMs: 2500,
  emergeRange: 40,
  phase3Speed: 1.3,
  restMs: 600,
}
