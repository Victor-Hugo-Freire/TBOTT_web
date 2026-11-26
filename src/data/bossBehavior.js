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
// Os projéteis ficaram ~1,5x mais rápidos (pedido do Victor, 2026-11-23: estavam muito devagar): notas, bananas,
// gotas e a queda das bombas. As raízes, não: rápidas demais, ninguém desvia (2026-11-25).
// Revisão de 2026-11-25 (o Patapim estava muito forte): com o Tung parado perto do chefe, sem revidar, ele morre em
// cerca de 8 a 10 s nos chefes dos andares 1 e 2, 7 a 9 s nos dos andares 3 e 4 e menos no Tralalero (o final).
// Os ajustes foram só nas pausas entre os ataques e na quantidade; vida e dano continuam os do catálogo.

// Cinquecento Turbo: anda atrás do Tung; perto (honkRange), buzina: a onda de som machuca até honkRadius dos pés dele,
// nos quadros de acerto (honkScale: o desenho, 284 u de largura na escala 1, do tamanho dessa área). Antes da buzina,
// os quadros do aviso (ele enchendo o peito) repetem por honkWarnMs a mais: o aviso total fica em 620 ms (era 220,
// pedido do Victor, 2026-11-23), dá tempo de sair da onda. Depois de andar
// walkMs, ou logo depois de buzinar, acelera parado (o aviso, 520 ms) e investe a chargeSpeed, ricocheteando nas paredes;
// na batida número bounces + 1 ele para e abre o capô para esfriar (a janela de bater, 840 ms). Na investida, encostar
// nele tira o dano da investida (catálogo), e não o de encostar.
export const CINQUECENTO = {
  walkMs: 1500,
  honkRange: 190, // começa a buzinar com o Tung a esta distância: nunca mais longe que honkRadius (a onda não chegaria)
  honkRadius: 190,
  honkScale: 1.35,
  honkWarnMs: 400,
  chargeSpeed: 620,
  bounces: 2,
  maxChargeMs: 4000,
  restMs: 1000,
}

// Chimpanzini Bananini (andares 1 e 2): anda atrás do Tung e, depois de andar walkMs (fase 2: phase2WalkMs), joga duas
// bananas-bumerangue (até throwRange; pedido do Victor, 2026-11-23). Cada uma faz uma laçada: vai em arco até onde o
// Tung estava (no máximo bananaRange, na velocidade bananaSpeed), afastada até bananaArc u da linha reta, e volta para a
// mão dele em arco pelo outro lado. Uma laça pela esquerda e a outra pela direita: elas se cruzam no Tung. Cada uma
// acerta uma vez na ida e uma na volta. Na metade da vida se descasca (a troca de fase): a casca fica no chão,
// escorregadia, por peelMs. Na fase 2, descascado, anda phase2Speed vezes mais rápido e joga mais vezes.
export const CHIMPANZINI = {
  walkMs: 1300,
  phase2WalkMs: 650,
  throwRange: 650,
  bananaSpeed: 650,
  bananaRange: 520,
  bananaArc: 110,
  peelMs: 8000,
  phase2Speed: 1.6,
  restMs: 500,
}

// Nonna Lasagnona (andares 1 a 4): anda devagar atrás do Tung; perto (slamRange), dá a colherada: a onda de choque
// machuca até slamRadius do ponto onde a colher bate (slamReach à frente dela), nos quadros de acerto (slamScale: o
// desenho, 227 u de largura na escala 1, do tamanho da área). Depois de andar walkMs, sem nenhuma almôndega viva,
// invoca `meatballs` almôndegas (Polpettas do catálogo de inimigos): sempre exatamente essas, nunca mais que essas vivas
// (pedido do Victor, 2026-11-23: 2 é o mínimo e o máximo). Elas morrem junto com ela. A cada marca da barra perde uma
// camada de lasanha (a troca de fase).
export const NONNA = { walkMs: 1600, slamRange: 200, slamReach: 50, slamRadius: 150, slamScale: 1.8, meatballs: 2, summonDistance: 120, restMs: 1000, phaseRestMs: 300 }

// Brr Brr Patapim (andares 1 e 2): anda atrás do Tung; perto (stompRange), pisa: a onda de choque machuca até
// stompRadius dele no quadro de acerto (stompScale: o desenho do tamanho da área). Depois de andar walkMs, ou logo depois
// de cada pisão (os dois ataques revezam), solta as raízes: rootCount raízes brotam em linha na direção do Tung, uma a
// cada rootSpacing u e rootStepMs ms; cada uma machuca quem está em cima dela enquanto brota (a folha da raiz, 360 ms).
// A linha acerta uma vez só. Pedido do Victor (2026-11-25): mais tempo entre os ataques (restMs) e raízes mais lentas
// (a linha avança a ~615 u/s; o Tung anda a 260 u/s e precisa sair do caminho dela).
export const PATAPIM = { walkMs: 1500, stompRange: 170, stompRadius: 170, stompScale: 2, rootCount: 7, rootSpacing: 80, rootStepMs: 130, restMs: 1500 }

// Chefes que voam: passam por cima dos obstáculos (só as paredes e as portas os param) e o piso não os afeta
export const FLYING_BOSSES = ['bombardiro-crocodilo']

// Ballerina Cappuccina (andares 3 e 4): anda atrás do Tung e, depois de andar walkMs, reveza dois ataques:
// - pirueta: gira na direção do Tung a spinSpeed, ricocheteando nas paredes; na batida número bounces + 1 (ou depois de
//   maxSpinMs) fica tonta por dizzyMs (a janela de bater nela);
// - gotas de café: `drops` gotas em círculo em volta dela, a primeira na direção do Tung, a dropSpeed, que voam por
//   cima de tudo e somem em dropMs.
export const BALLERINA = { walkMs: 800, spinSpeed: 650, bounces: 3, maxSpinMs: 6000, dizzyMs: 1000, drops: 12, dropSpeed: 450, dropMs: 1600, restMs: 400 }

// Bombardiro Crocodilo (andares 3 e 4): voa e fica pairando a hoverRange do Tung. Depois de voar walkMs, bombardeia,
// revezando 4 padrões (pedido do Victor, 2026-11-23: a luta estava fácil, eram sempre 3 bombas em linha). Em todos, a
// marca aparece no chão (o aviso) e a bomba cai nela bombFallMs depois; a explosão machuca até blastRadius
// (blastScale: o desenho, 142 u na escala 1, do tamanho da área):
// - linha: lineBombs marcas em linha atravessando o Tung, na direção do voo, a bombSpacing u uma da outra;
// - cruz: uma no Tung e crossArm em cada braço de um "+", a bombSpacing u (escapa-se pela diagonal);
// - rasante: voa em linha reta por cima do Tung a raidSpeed (até raidMs ou bater na parede), soltando uma bomba a
//   cada raidSpacing u voados: as marcas ficam no caminho e explodem uma depois da outra;
// - cerco: ringBombs marcas em volta do Tung, a ringRadius, e uma no meio, que cai ringDelayMs depois das outras
//   (fica no meio até o anel explodir e sai antes da do meio).
// A cada bombingsBeforeLanding bombardeios, pousa para abastecer por landMs (a janela de bater nele).
export const BOMBARDIRO = {
  walkMs: 1100,
  hoverRange: 260,
  bombFallMs: 700,
  blastRadius: 85,
  blastScale: 1.3,
  bombSpacing: 130,
  lineBombs: 5,
  crossArm: 2,
  raidSpeed: 520,
  raidSpacing: 110,
  raidMs: 1800,
  ringBombs: 8,
  ringRadius: 190,
  ringDelayMs: 500,
  bombingsBeforeLanding: 3,
  landMs: 1400,
  restMs: 400,
}

// Cappuccino Assassino (andares 3 e 4): anda atrás do Tung; perto (slashRange, o mesmo número para começar e para
// acertar), dá o corte de katana.
// - Sem nenhum clone vivo, logo depois de um corte (ou depois de andar walkMs), faz os clones (pedidos do Victor,
//   2026-11-23): 4 cópias dele aparecem na fumaça, uma no meio de cada lado da sala (direita, cima, esquerda e baixo),
//   a cloneWallMargin u das paredes (assim não ficam nas portas). Cada uma tem cloneHealth de vida, anda atrás do Tung
//   e dá o corte com o dano dos clones; ao cair, some numa fumaça. Morrem junto com ele.
// - Com clones vivos e o Tung além de teleportRange, depois de andar walkMs, se teleporta: vira fumaça, some e
//   reaparece behindDistance u atrás do Tung, já dando o corte.
export const CAPPUCCINO = { walkMs: 1500, behindDistance: 110, slashRange: 170, slashScale: 1.2, teleportRange: 300, cloneHealth: 1, cloneCooldownMs: 15000, cloneWallMargin: 120, restMs: 900 }

// Tralalero Tralala (andar 5), 3 fases (marcas em BOSS_PHASES):
// - fase 1: anda atrás do Tung; perto (biteRange), morde (acerta quem está a até biteRange nos quadros de acerto).
//   Depois de andar walkMs, faz a investida tripla: `dashes` avanços em linha reta a chargeSpeed (cada um até dashMs
//   ou até bater), com o aviso antes de cada um; no fim tropeça (a janela de bater, 720 ms);
// - fase 2 (os óculos escuros): ganha o canto (`notes` notas musicais em leque, abertas noteSpread radianos, a
//   noteSpeed u/s, que somem em noteMs; songVolleys rajadas seguidas, uma a cada canto-tralala, mirando o Tung de
//   novo a cada uma: pedido do Victor, 2026-11-23) e a pauta: uma pauta musical no chão, na fileira do Tung, saindo do lado dele
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
  noteSpeed: 500,
  noteMs: 2500,
  songVolleys: 3,
  staffLength: 455,
  staffHeight: 56,
  staffScale: 1.6,
  finSpeed: 300,
  finMaxMs: 2500,
  emergeRange: 40,
  phase3Speed: 1.3,
  restMs: 1100,
}
