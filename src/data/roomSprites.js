// Elementos de sala (issue #18). Ficam em public/sprites/rooms/.
// Por enquanto só os pedestais dos itens: uma imagem de 300x384 sem animação, com os pés em (150, 354),
// a mesma célula das folhas de itemSprites.js depois da escala (o item é desenhado por cima).
// Ainda NÃO existem como imagem: fundos das salas, portas e minimapa. No protótipo da issue #18
// eles são desenhados por código (canvas). Ver docs/sprites/DIVERGENCIAS.md.

// Chave = variante do pedestal (qual sala usa cada uma ainda é proposta: ver itens/spawn.md da arte)
export const PEDESTAL_SPRITES = {
  base: {
    id: 'pedestal-base',
    path: '/sprites/rooms/pedestals/pedestal-base.png',
    scale: 1,
    frameWidth: 300,
    frameHeight: 384,
    feetX: 150,
    feetPadding: 30,
  },
  loja: {
    id: 'pedestal-loja',
    path: '/sprites/rooms/pedestals/pedestal-loja.png',
    scale: 1,
    frameWidth: 300,
    frameHeight: 384,
    feetX: 150,
    feetPadding: 30,
  },
  pacto: {
    id: 'pedestal-pacto',
    path: '/sprites/rooms/pedestals/pedestal-pacto.png',
    scale: 1,
    frameWidth: 300,
    frameHeight: 384,
    feetX: 150,
    feetPadding: 30,
  },
  adega: {
    id: 'pedestal-adega',
    path: '/sprites/rooms/pedestals/pedestal-adega.png',
    scale: 1,
    frameWidth: 300,
    frameHeight: 384,
    feetX: 150,
    feetPadding: 30,
  },
}
