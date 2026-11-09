// Aparência do Tung Tung com itens (proposta: se a equipe desistir, apague este arquivo e a pasta
// public/sprites/characters/tung-tung-sahur/aparencia/). Nenhuma tela usa estes dados ainda.
// Cada item visível é uma camada separada, por cima ou por baixo do personagem; o Tung original não muda.
// - Cada camada é uma imagem do tamanho da célula do tronco (296x259, a mesma de tungTungSahurAndar) e já vem
//   desenhada no lugar certo do QUADRO 0 do andar. Só existe esse quadro: nos outros, o jogo soma o deslocamento de APPEARANCE_ANCHORS.
// - Slots: cabeca, costas, bastao e aura (pés não foi feito). No máximo 1 item por slot; se 2 itens disputam o slot,
//   fica visível o de maior raridade e, empatando, o mais recente (o efeito do escondido continua valendo).
// - position diz quando desenhar a camada:
//   1) 'aura' (no chão) e 2) 'atras', antes das pernas; 3) pernas; 4) tronco; 5) 'frente', depois do tronco.
// - Deslocamento por quadro (px da célula, em relação ao quadro 0 do andar):
//   cabeca e costas seguem APPEARANCE_ANCHORS.<direção>.walk[quadro].head (no golpe, attackHead; no dano, hurtHead);
//   bastao segue batRing (o anel muda de lugar) e batAngle (o ângulo muda até 8 graus no andar). No golpe o bastão
//   dá a volta inteira e isso NÃO foi medido: esconda o slot bastao durante o ataque;
//   aura não se mexe (os pés ficam parados).
// - Dano: o 1º quadro é o Tung inteiro branco e os outros são vermelhos; esconda as camadas no dano ou tinja igual.
// Gerado a partir de ancoras.json e das camadas da arte (docs/sprites/aparencia/).

// Ordem de desenho das posições (pernas e tronco são do personagem)
export const APPEARANCE_DRAW_ORDER = ['aura', 'atras', 'pernas', 'tronco', 'frente']

// Chave = id do item (o mesmo de itemSprites.js). layers.<direção> = null: a camada não aparece nessa direção.
export const APPEARANCE_SPRITES = {
  'chifre-da-sorte': {
    slot: 'cabeca',
    layers: {
      down: { path: '/sprites/characters/tung-tung-sahur/aparencia/chifre-da-sorte-baixo.png', position: 'frente' },
      left: { path: '/sprites/characters/tung-tung-sahur/aparencia/chifre-da-sorte-esquerda.png', position: 'frente' },
      right: { path: '/sprites/characters/tung-tung-sahur/aparencia/chifre-da-sorte-direita.png', position: 'frente' },
      up: { path: '/sprites/characters/tung-tung-sahur/aparencia/chifre-da-sorte-cima.png', position: 'frente' },
    },
  },
  'rolo-de-bronze': {
    slot: 'bastao',
    layers: {
      down: { path: '/sprites/characters/tung-tung-sahur/aparencia/rolo-de-bronze-baixo.png', position: 'frente' },
      left: { path: '/sprites/characters/tung-tung-sahur/aparencia/rolo-de-bronze-esquerda.png', position: 'frente' },
      right: { path: '/sprites/characters/tung-tung-sahur/aparencia/rolo-de-bronze-direita.png', position: 'frente' },
      up: { path: '/sprites/characters/tung-tung-sahur/aparencia/rolo-de-bronze-cima.png', position: 'frente' },
    },
  },
  'concha-longa': {
    slot: 'costas',
    layers: {
      down: { path: '/sprites/characters/tung-tung-sahur/aparencia/concha-longa-baixo.png', position: 'atras' },
      left: { path: '/sprites/characters/tung-tung-sahur/aparencia/concha-longa-esquerda.png', position: 'atras' },
      right: { path: '/sprites/characters/tung-tung-sahur/aparencia/concha-longa-direita.png', position: 'atras' },
      up: { path: '/sprites/characters/tung-tung-sahur/aparencia/concha-longa-cima.png', position: 'frente' },
    },
  },
  'caldo-da-mamae': {
    slot: 'aura',
    layers: {
      down: { path: '/sprites/characters/tung-tung-sahur/aparencia/caldo-da-mamae-baixo.png', position: 'aura' },
      left: { path: '/sprites/characters/tung-tung-sahur/aparencia/caldo-da-mamae-esquerda.png', position: 'aura' },
      right: { path: '/sprites/characters/tung-tung-sahur/aparencia/caldo-da-mamae-direita.png', position: 'aura' },
      up: { path: '/sprites/characters/tung-tung-sahur/aparencia/caldo-da-mamae-cima.png', position: 'aura' },
    },
  },
  'elixir-eletrico': {
    slot: 'costas',
    layers: {
      down: null,
      left: { path: '/sprites/characters/tung-tung-sahur/aparencia/elixir-eletrico-esquerda.png', position: 'atras' },
      right: { path: '/sprites/characters/tung-tung-sahur/aparencia/elixir-eletrico-direita.png', position: 'atras' },
      up: { path: '/sprites/characters/tung-tung-sahur/aparencia/elixir-eletrico-cima.png', position: 'frente' },
    },
  },
}

// Âncoras medidas no Tung (12 quadros do andar, 8 do ataque e 4 do dano, por direção)
export const APPEARANCE_ANCHORS = {
  down: {
    walk: [
      { head: [0, 0], batRing: [240.2, 213.9], batAngle: -137.8 },
      { head: [1, -2], batRing: [233.3, 220.8], batAngle: -134.2 },
      { head: [3, -4], batRing: [237.3, 215.8], batAngle: -130.8 },
      { head: [3, -5], batRing: [236.6, 215.6], batAngle: -129.9 },
      { head: [3, -4], batRing: [237.3, 215.8], batAngle: -130.8 },
      { head: [1, -2], batRing: [233.3, 220.8], batAngle: -134.2 },
      { head: [0, 0], batRing: [240.2, 213.9], batAngle: -137.8 },
      { head: [-1, -2], batRing: [242.1, 208.2], batAngle: -141.8 },
      { head: [-3, -4], batRing: [242.4, 203.1], batAngle: -144.7 },
      { head: [-3, -5], batRing: [243.1, 200.5], batAngle: -145.8 },
      { head: [-3, -4], batRing: [242.4, 203.1], batAngle: -144.7 },
      { head: [-2, -3], batRing: [241.1, 207.2], batAngle: -141.8 },
    ],
    attackHead: [[0, -3], [0, -6], [0, 2], [0, 5], [0, 7], [0, 5], [0, 2], [0, 0]],
    hurtHead: [[0, -4], [0, -8], [0, -4], [0, 0]],
  },
  left: {
    walk: [
      { head: [0, 0], batRing: [246.1, 160.8], batAngle: 141.9 },
      { head: [0, -1], batRing: [246.5, 163.0], batAngle: 144.3 },
      { head: [0, -3], batRing: [247.1, 163.4], batAngle: 146.0 },
      { head: [0, -3], batRing: [247.9, 164.1], batAngle: 146.8 },
      { head: [0, -3], batRing: [247.1, 163.4], batAngle: 146.0 },
      { head: [0, -1], batRing: [246.5, 163.0], batAngle: 144.3 },
      { head: [0, 0], batRing: [246.1, 160.8], batAngle: 141.9 },
      { head: [0, -1], batRing: [245.9, 160.7], batAngle: 139.1 },
      { head: [0, -3], batRing: [245.4, 158.3], batAngle: 137.3 },
      { head: [0, -3], batRing: [244.5, 152.4], batAngle: 136.9 },
      { head: [0, -3], batRing: [245.4, 158.3], batAngle: 137.3 },
      { head: [0, -2], batRing: [245.9, 159.7], batAngle: 139.1 },
    ],
    attackHead: [[3, 0], [6, 0], [-2, 0], [-5, 0], [-7, 0], [-5, 0], [-2, 0], [0, 0]],
    hurtHead: [[5, 0], [18, 18], [15, 4], [0, 0]],
  },
  right: {
    walk: [
      { head: [0, 0], batRing: [39.4, 159.6], batAngle: 31.8 },
      { head: [0, -1], batRing: [39.8, 155.6], batAngle: 34.4 },
      { head: [0, -3], batRing: [39.3, 154.3], batAngle: 36.6 },
      { head: [0, -3], batRing: [39.0, 156.6], batAngle: 37.5 },
      { head: [0, -3], batRing: [39.3, 154.3], batAngle: 36.6 },
      { head: [0, -1], batRing: [39.8, 155.6], batAngle: 34.4 },
      { head: [0, 0], batRing: [39.4, 159.6], batAngle: 31.8 },
      { head: [0, -1], batRing: [38.9, 162.8], batAngle: 29.5 },
      { head: [0, -3], batRing: [39.1, 167.3], batAngle: 28.2 },
      { head: [0, -3], batRing: [39.3, 169.1], batAngle: 27.6 },
      { head: [0, -3], batRing: [39.1, 167.3], batAngle: 28.2 },
      { head: [0, -2], batRing: [38.9, 161.8], batAngle: 29.5 },
    ],
    attackHead: [[-3, 0], [-6, 0], [2, 0], [5, 0], [7, 0], [5, 0], [2, 0], [0, 0]],
    hurtHead: [[-4, 0], [-18, 16], [-12, 3], [0, 0]],
  },
  up: {
    walk: [
      { head: [0, 0], batRing: [242.4, 155.3], batAngle: 137.2 },
      { head: [1, -2], batRing: [244.3, 158.0], batAngle: 141.4 },
      { head: [3, -4], batRing: [245.5, 158.0], batAngle: 144.4 },
      { head: [3, -5], batRing: [246.2, 158.5], batAngle: 145.7 },
      { head: [3, -4], batRing: [245.5, 158.0], batAngle: 144.4 },
      { head: [1, -2], batRing: [244.3, 158.0], batAngle: 141.4 },
      { head: [0, 0], batRing: [242.4, 155.3], batAngle: 137.2 },
      { head: [-1, -2], batRing: [241.2, 150.1], batAngle: 131.1 },
      { head: [-3, -4], batRing: [239.5, 147.2], batAngle: 127.0 },
      { head: [-3, -5], batRing: [239.0, 143.5], batAngle: 125.6 },
      { head: [-3, -4], batRing: [239.5, 147.2], batAngle: 127.0 },
      { head: [-2, -3], batRing: [240.5, 149.3], batAngle: 130.2 },
    ],
    attackHead: [[0, 3], [0, 6], [0, -2], [0, -5], [0, -7], [0, -5], [0, -2], [0, 0]],
    hurtHead: [[0, 4], [0, 8], [0, 4], [0, 0]],
  },
}
