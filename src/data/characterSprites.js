// Sprites dos personagens. Os arquivos ficam em public/sprites/characters,
// então o endereço é fixo e pode ser guardado no banco como sprite_path.
// Uma folha é uma grade: uma linha por direção e uma coluna por quadro da caminhada.
// Em todos os quadros a cabeça fica no centro da célula e os pés na mesma altura,
// então trocar de quadro não faz o personagem "pular" de lugar.
// - feetPadding: pixels livres entre os pés e a base da célula
export const CHARACTER_SPRITES = {
  // Sala: o personagem é desenhado em duas camadas, para as pernas continuarem andando durante o golpe.
  // 1) Pernas (atrás): ciclo de 12 quadros por direção, mais o quadro 12 (parado). Desenhadas por código com o
  //    mesmo material do tronco (grade de 3 px, tom, grão e contorno do original); a perna de trás é mais escura.
  //    O ciclo se repete a cada 130 u andadas.
  tungTungSahurPernas: {
    src: '/sprites/characters/tung-tung-sahur/pernas.png',
    frameWidth: 296,
    frameHeight: 259,
    feetPadding: 18,
    framesPerRow: 13,
    idleFrame: 12, // pernas paradas (sem andar, ou "reduzir movimento")
    rows: { down: 0, left: 1, right: 2, up: 3 },
  },
  // 2) Tronco (na frente): cabeça, corpo, braço e bastão do original, sem as pernas, com balanço de 12 quadros
  //    (sobe e desce até 3 px nas laterais e até 5 px de frente e de costas, onde também balança 3 px para os lados;
  //    o bastão balança 5° e 8°). Rosto e paleta não mudam.
  // Os pés ficam no mesmo ponto de todos os quadros (feetPadding), então não há "pulo".
  tungTungSahurAndar: {
    src: '/sprites/characters/tung-tung-sahur/andar.png',
    frameWidth: 296,
    frameHeight: 259,
    feetPadding: 18,
    framesPerRow: 12,
    rows: { down: 0, left: 1, right: 2, up: 3 },
  },
  // Sala: golpe com o bastão, 8 quadros por direção (preparação, arco, impacto e volta).
  // A folha não tem rastro, brilho nem pernas: o arco branco é desenhado pelo jogo (drawAttackArc.js)
  // e as pernas vêm da folha tungTungSahurPernas. Em "up" o braço e o bastão ficam atrás da cabeça.
  // A célula é maior (420x380) porque o bastão sai do quadro de 296x259. O quadro original fica em
  // (62, 60) da célula, então os pés ficam em (210, 301): o mesmo ponto do andar, sem "pulo".
  // - durations: ms de cada quadro (630 ms no total)
  // - hitFrames: quadros em que o golpe acerta (160 a 350 ms)
  tungTungSahurAtaque: {
    src: '/sprites/characters/tung-tung-sahur/ataque.png',
    frameWidth: 420,
    frameHeight: 380,
    feetX: 210,
    feetPadding: 79,
    framesPerRow: 8,
    rows: { down: 0, left: 1, right: 2, up: 3 },
    durations: [70, 90, 40, 40, 110, 80, 90, 110],
    hitFrames: [2, 3, 4],
  },
  // Sala: dano, 4 quadros por direção (impacto, recuo, recuperação, volta ao normal; 410 ms).
  // O recuo já está desenhado nos quadros: os pés se mexem alguns pixels e voltam ao ponto original.
  tungTungSahurDano: {
    src: '/sprites/characters/tung-tung-sahur/dano.png',
    frameWidth: 296,
    frameHeight: 259,
    feetPadding: 18,
    framesPerRow: 4,
    rows: { down: 0, left: 1, right: 2, up: 3 },
    durations: [70, 110, 110, 120],
  },
  // Tela inicial: corpo inteiro piscando (quadros: aberto, meio, fechado, meio)
  tungTungSahurPiscar: {
    src: '/sprites/characters/tung-tung-sahur-piscar.png',
    frameWidth: 786,
    frameHeight: 1503,
    feetPadding: 36,
    feetX: 568, // centro dos pés (o taco faz a imagem ser mais larga à esquerda)
    framesPerRow: 4,
    rows: { down: 0 },
    // Tempo de cada quadro: olho aberto por 3 s e uma piscada rápida
    sequence: [
      { frame: 0, ms: 3000 },
      { frame: 1, ms: 60 },
      { frame: 2, ms: 90 },
      { frame: 3, ms: 60 },
    ],
  },
}

// Posição do quadro dentro da folha, no formato do background-position do CSS.
export function getFramePosition(sprite, direction, frame) {
  const rowCount = Object.keys(sprite.rows).length
  const x = sprite.framesPerRow > 1 ? (frame / (sprite.framesPerRow - 1)) * 100 : 0
  const y = rowCount > 1 ? (sprite.rows[direction] / (rowCount - 1)) * 100 : 0
  return `${x}% ${y}%`
}
