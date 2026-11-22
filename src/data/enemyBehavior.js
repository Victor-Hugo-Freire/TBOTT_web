// Números dos inimigos que não estão no catálogo da API. A tabela enemies só tem vida, dano, velocidade e
// andar mínimo; o resto (tamanho do corpo e, depois, alcance, recarga e projéteis) fica aqui, como em economy.js.

// Caixa do corpo de cada inimigo, em unidades da sala, do pé até o alto da cabeça: é nela que o golpe acerta.
// Medida na parte opaca do quadro 0 da animação "parado" (pernas + tronco @1x, com o contorno).
export const ENEMY_BODIES = {
  'cannolo-carica': { width: 82, height: 107 },
  'fenicottero-fornarino': { width: 108, height: 136 },
  'formaggino-saltellino': { width: 131, height: 107 },
  'moka-scudiera': { width: 121, height: 121 },
  'peperoncino-kamikaze': { width: 92, height: 109 },
  'pinguino-sorbettino': { width: 105, height: 135 },
  'pistacchio-sputacchio': { width: 88, height: 105 },
  'polpetta-sotterranea': { width: 125, height: 97 },
  'vespina-lambrettina': { width: 117, height: 122 },
  'zanzarina-tarantella': { width: 139, height: 107 },
}

// Encostar machuca (decisão do Victor, 2026-11-21). A área de contato fica no chão, em volta dos pés do inimigo:
// passar por trás dele (a cabeça) não machuca. Largura = esta fração da largura do corpo (sem o contorno e as pontas).
export const CONTACT_WIDTH_SHARE = 0.7
export const CONTACT_DEPTH = 36 // u para trás dos pés

// Ao entrar na sala, os inimigos esperam este tempo parados antes de agir (dá para o Tung se situar)
export const START_WAIT_MS = 700

// Perigos do chão (a chapa quente e os cacos do garrafão): encostar na chapa ou pisar nos cacos tira HAZARD_DAMAGE
// do inimigo, que só leva esse dano de novo depois de HAZARD_COOLDOWN_MS. Ao escolher o caminho, ele desvia dos
// cacos e passa a pelo menos HAZARD_AVOID_MARGIN u da chapa (menos que 25 u: a casa de cima da chapa continua livre).
export const HAZARD_DAMAGE = 1
export const HAZARD_COOLDOWN_MS = 1000
export const HAZARD_AVOID_MARGIN = 16

// Inimigos que voam: passam por cima dos obstáculos (só as paredes e as portas os param) e o piso (esteira,
// líquido, grudento) e os perigos do chão não os afetam. A Vespina tem rodas de lambreta (anda no chão) e o
// Fenicottero é um forno num pé só: só a Zanzarina voa.
export const FLYING_ENEMIES = ['zanzarina-tarantella']

// ---------- inimigos de corpo a corpo (etapa 2). Distâncias em u, tempos em ms, velocidades em u/s. ----------
// A velocidade de andar de cada um vem do catálogo (speed); aqui ficam as outras.

// Formaggino Saltellino: persegue andando; perto, agacha e salta (nos quadros de acerto) mordendo; descansa ao pousar
export const FORMAGGINO = { attackRange: 170, jumpDistance: 150, restMs: 450 }

// Cannolo Carica: perto, raspa o pé (preparando) e investe em linha reta; bateu em algo, fica atordoado
export const CANNOLO = { chargeRange: 520, chargeSpeed: 560, maxChargeMs: 1400, stunnedMs: 1200, restMs: 500 }

// Polpetta Sotterranea: escondida no molho, vai para baixo do Tung; emerge (a janela de bater), morde,
// fica um pouco na superfície e afunda de novo. Escondida, nada a acerta e encostar não machuca.
export const POLPETTA = { hiddenMs: 1800, emergeRange: 40, surfacedMs: 700 }

// Peperoncino Kamikaze: corre até o Tung, acende (o aviso) e, aceso, corre litSpeedMultiplier vezes mais rápido atrás
// dele até explodir, morrendo junto. Morto antes de acender, não explode.
// blastScale: o desenho da explosão (142 u de largura na escala 1) cresce até mostrar a área do dano (2 x blastRadius).
export const PEPERONCINO = { fuseRange: 120, fuseMs: 800, litSpeedMultiplier: 1.5, blastRadius: 160, blastScale: 2.25 }

// Pinguino Sorbettino: perto, se joga de barriga e desliza em linha reta, deixando um rastro de gelo escorregadio
export const PINGUINO = { slideRange: 480, slideSpeed: 460, maxSlideMs: 1300, restMs: 700, trailSpacing: 60, trailMs: 4000 }

// ---------- os que atiram e voam (etapa 3) ----------

// Pistacchio Sputacchio: com o Tung a até shootRange e nada no meio, cospe um caroço (seedSpeed u/s) que voa reto
// até acertar o Tung ou bater no que bloqueia
export const PISTACCHIO = { shootRange: 520, seedSpeed: 380, restMs: 1100 }

// Fenicottero Fornarino: lança uma pizza em arco onde o Tung está (ela voa flightMs por cima de tudo, e a marca no
// chão mostra onde vai cair); onde cai, fica queijo quente por cheeseMs. Com o Tung perto demais (minRange), ele
// se afasta antes de lançar.
export const FENICOTTERO = { throwRange: 650, minRange: 180, flightMs: 1000, arcHeight: 160, cheeseMs: 4000, restMs: 1500 }

// Moka Scudiera: com um aliado sem escudo na sala, apita e põe nele um escudo de vapor, que anula o próximo dano
// (e descansa shieldRestMs); senão, chega a até attackRange do Tung e solta um anel de vapor que cresce até ringRadius.
// ringScale: o desenho do anel (193 u de largura na escala 1) cresce até mostrar essa área.
export const MOKA = { attackRange: 150, ringRadius: 170, ringScale: 1.75, restMs: 900, shieldRestMs: 1500 }

// Vespina Lambrettina: com o Tung a até attackRange e o caminho livre, acelera parada (a fumaça fica smokeMs na
// sala) e mergulha a diveSpeed, virando um pouco atrás dele (diveTurn, em radianos por segundo); depois faz uma
// curva fechada (curveTurn) e mergulha de novo, `dives` vezes ao todo
export const VESPINA = { attackRange: 380, diveSpeed: 560, diveTurn: 1.5, curveSpeed: 300, curveTurn: 6, dives: 2, smokeMs: 2500, restMs: 800 }

// Zanzarina Tarantella: voa até o Tung dançando (balança para os lados até `sway` da direção, num vaivém a cada
// swayMs) e, perto (diveRange), mergulha com o ferrão, cobrindo diveDistance nos quadros de acerto
export const ZANZARINA = { diveRange: 220, diveDistance: 240, sway: 0.8, swayMs: 900, restMs: 600 }
