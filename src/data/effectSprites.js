// Efeitos visuais dos inimigos e chefes (projéteis, impactos, poeira, ondas). Ficam em public/sprites/effects/<id>.png.
// Cada folha tem uma linha só; todos os quadros duram o mesmo tempo (o "ms" do efeitos.json).
// Os inimigos e chefes apontam para estes ids em animations.<nome>.emits.effect.
// Os efeitos dos itens ficam em itemSprites.js (variants de cada item).

// Chave = id do efeito
export const EFFECT_SPRITES = {
  almondega: {
    id: 'almondega',
    path: '/sprites/effects/almondega.png',
    scale: 1,
    frameWidth: 72,
    frameHeight: 72,
    framesPerRow: 4,
    animations: {
      almondega: { row: 0, frames: 4, durations: [100, 100, 100, 100] },
    },
  },
  'banana-bumerangue': {
    id: 'banana-bumerangue',
    path: '/sprites/effects/banana-bumerangue.png',
    scale: 1,
    frameWidth: 120,
    frameHeight: 120,
    framesPerRow: 4,
    animations: {
      'banana-bumerangue': { row: 0, frames: 4, durations: [60, 60, 60, 60] },
    },
  },
  barbatana: {
    id: 'barbatana',
    path: '/sprites/effects/barbatana.png',
    scale: 1,
    frameWidth: 210,
    frameHeight: 150,
    framesPerRow: 4,
    animations: {
      barbatana: { row: 0, frames: 4, durations: [120, 120, 120, 120] },
    },
  },
  'bolhas-molho': {
    id: 'bolhas-molho',
    path: '/sprites/effects/bolhas-molho.png',
    scale: 1,
    frameWidth: 210,
    frameHeight: 102,
    framesPerRow: 4,
    animations: {
      'bolhas-molho': { row: 0, frames: 4, durations: [140, 140, 140, 140] },
    },
  },
  bomba: {
    id: 'bomba',
    path: '/sprites/effects/bomba.png',
    scale: 1,
    frameWidth: 84,
    frameHeight: 108,
    framesPerRow: 4,
    animations: {
      bomba: { row: 0, frames: 4, durations: [100, 100, 100, 100] },
    },
  },
  buzina: {
    id: 'buzina',
    path: '/sprites/effects/buzina.png',
    scale: 1,
    frameWidth: 600,
    frameHeight: 240,
    framesPerRow: 4,
    animations: {
      buzina: { row: 0, frames: 4, durations: [90, 90, 90, 90] },
    },
  },
  caroco: {
    id: 'caroco',
    path: '/sprites/effects/caroco.png',
    scale: 1,
    frameWidth: 72,
    frameHeight: 72,
    framesPerRow: 4,
    animations: {
      caroco: { row: 0, frames: 4, durations: [80, 80, 80, 80] },
    },
  },
  'casca-escorregadia': {
    id: 'casca-escorregadia',
    path: '/sprites/effects/casca-escorregadia.png',
    scale: 1,
    frameWidth: 120,
    frameHeight: 84,
    framesPerRow: 2,
    animations: {
      'casca-escorregadia': { row: 0, frames: 2, durations: [200, 200] },
    },
  },
  'corte-katana': {
    id: 'corte-katana',
    path: '/sprites/effects/corte-katana.png',
    scale: 1,
    frameWidth: 270,
    frameHeight: 210,
    framesPerRow: 4,
    animations: {
      'corte-katana': { row: 0, frames: 4, durations: [50, 50, 50, 50] },
    },
  },
  'estrela-atordoado': {
    id: 'estrela-atordoado',
    path: '/sprites/effects/estrela-atordoado.png',
    scale: 1,
    frameWidth: 156,
    frameHeight: 90,
    framesPerRow: 4,
    animations: {
      'estrela-atordoado': { row: 0, frames: 4, durations: [120, 120, 120, 120] },
    },
  },
  explosao: {
    id: 'explosao',
    path: '/sprites/effects/explosao.png',
    scale: 1,
    frameWidth: 300,
    frameHeight: 300,
    framesPerRow: 6,
    animations: {
      explosao: { row: 0, frames: 6, durations: [70, 70, 70, 70, 70, 70] },
    },
  },
  folha: {
    id: 'folha',
    path: '/sprites/effects/folha.png',
    scale: 1,
    frameWidth: 60,
    frameHeight: 60,
    framesPerRow: 4,
    animations: {
      folha: { row: 0, frames: 4, durations: [140, 140, 140, 140] },
    },
  },
  fumaca: {
    id: 'fumaca',
    path: '/sprites/effects/fumaca.png',
    scale: 1,
    frameWidth: 192,
    frameHeight: 168,
    framesPerRow: 4,
    animations: {
      fumaca: { row: 0, frames: 4, durations: [110, 110, 110, 110] },
    },
  },
  'gota-cafe': {
    id: 'gota-cafe',
    path: '/sprites/effects/gota-cafe.png',
    scale: 1,
    frameWidth: 60,
    frameHeight: 72,
    framesPerRow: 4,
    animations: {
      'gota-cafe': { row: 0, frames: 4, durations: [100, 100, 100, 100] },
    },
  },
  impacto: {
    id: 'impacto',
    path: '/sprites/effects/impacto.png',
    scale: 1,
    frameWidth: 144,
    frameHeight: 144,
    framesPerRow: 4,
    animations: {
      impacto: { row: 0, frames: 4, durations: [60, 60, 60, 60] },
    },
  },
  'marca-chao': {
    id: 'marca-chao',
    path: '/sprites/effects/marca-chao.png',
    scale: 1,
    frameWidth: 192,
    frameHeight: 120,
    framesPerRow: 4,
    animations: {
      'marca-chao': { row: 0, frames: 4, durations: [120, 120, 120, 120] },
    },
  },
  'marca-pneu': {
    id: 'marca-pneu',
    path: '/sprites/effects/marca-pneu.png',
    scale: 1,
    frameWidth: 270,
    frameHeight: 72,
    framesPerRow: 3,
    animations: {
      'marca-pneu': { row: 0, frames: 3, durations: [110, 110, 110] },
    },
  },
  'nota-musical': {
    id: 'nota-musical',
    path: '/sprites/effects/nota-musical.png',
    scale: 1,
    frameWidth: 72,
    frameHeight: 90,
    framesPerRow: 4,
    animations: {
      'nota-musical': { row: 0, frames: 4, durations: [150, 150, 150, 150] },
    },
  },
  'onda-choque': {
    id: 'onda-choque',
    path: '/sprites/effects/onda-choque.png',
    scale: 1,
    frameWidth: 480,
    frameHeight: 270,
    framesPerRow: 6,
    animations: {
      'onda-choque': { row: 0, frames: 6, durations: [80, 80, 80, 80, 80, 80] },
    },
  },
  pauta: {
    id: 'pauta',
    path: '/sprites/effects/pauta.png',
    scale: 1,
    frameWidth: 600,
    frameHeight: 132,
    framesPerRow: 6,
    animations: {
      pauta: { row: 0, frames: 6, durations: [90, 90, 90, 90, 90, 90] },
    },
  },
  'pizza-lancada': {
    id: 'pizza-lancada',
    path: '/sprites/effects/pizza-lancada.png',
    scale: 1,
    frameWidth: 96,
    frameHeight: 96,
    framesPerRow: 4,
    animations: {
      'pizza-lancada': { row: 0, frames: 4, durations: [70, 70, 70, 70] },
    },
  },
  poeira: {
    id: 'poeira',
    path: '/sprites/effects/poeira.png',
    scale: 1,
    frameWidth: 168,
    frameHeight: 84,
    framesPerRow: 4,
    animations: {
      poeira: { row: 0, frames: 4, durations: [90, 90, 90, 90] },
    },
  },
  poof: {
    id: 'poof',
    path: '/sprites/effects/poof.png',
    scale: 1,
    frameWidth: 192,
    frameHeight: 192,
    framesPerRow: 5,
    animations: {
      poof: { row: 0, frames: 5, durations: [70, 70, 70, 70, 70] },
    },
  },
  'queijo-quente': {
    id: 'queijo-quente',
    path: '/sprites/effects/queijo-quente.png',
    scale: 1,
    frameWidth: 210,
    frameHeight: 102,
    framesPerRow: 4,
    animations: {
      'queijo-quente': { row: 0, frames: 4, durations: [160, 160, 160, 160] },
    },
  },
  raiz: {
    id: 'raiz',
    path: '/sprites/effects/raiz.png',
    scale: 1,
    frameWidth: 144,
    frameHeight: 168,
    framesPerRow: 4,
    animations: {
      raiz: { row: 0, frames: 4, durations: [90, 90, 90, 90] },
    },
  },
  'rastro-gelo': {
    id: 'rastro-gelo',
    path: '/sprites/effects/rastro-gelo.png',
    scale: 1,
    frameWidth: 210,
    frameHeight: 90,
    framesPerRow: 4,
    animations: {
      'rastro-gelo': { row: 0, frames: 4, durations: [140, 140, 140, 140] },
    },
  },
  respingo: {
    id: 'respingo',
    path: '/sprites/effects/respingo.png',
    scale: 1,
    frameWidth: 180,
    frameHeight: 120,
    framesPerRow: 4,
    animations: {
      respingo: { row: 0, frames: 4, durations: [80, 80, 80, 80] },
    },
  },
  'vapor-anel': {
    id: 'vapor-anel',
    path: '/sprites/effects/vapor-anel.png',
    scale: 1,
    frameWidth: 420,
    frameHeight: 240,
    framesPerRow: 5,
    animations: {
      'vapor-anel': { row: 0, frames: 5, durations: [90, 90, 90, 90, 90] },
    },
  },
  'vapor-escudo': {
    id: 'vapor-escudo',
    path: '/sprites/effects/vapor-escudo.png',
    scale: 1,
    frameWidth: 180,
    frameHeight: 156,
    framesPerRow: 4,
    animations: {
      'vapor-escudo': { row: 0, frames: 4, durations: [120, 120, 120, 120] },
    },
  },
}
