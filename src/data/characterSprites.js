// Sprites dos personagens. Os arquivos ficam em public/sprites/characters,
// então o endereço é fixo e pode ser guardado no banco como sprite_path.
// Uma folha é uma grade: uma linha por direção e uma coluna por quadro da caminhada.
// Em todos os quadros a cabeça fica no centro da célula e os pés na mesma altura,
// então trocar de quadro não faz o personagem "pular" de lugar.
// - feetPadding: pixels livres entre os pés e a base da célula
// A vista esquerda do original é cerca de 4% menor que as outras (cabeça de 137 contra 142 px):
// o jogo a desenha 4% maior, a partir dos pés. As pernas já têm o mesmo tamanho dos dois lados.
const LEFT_VIEW_SCALE = { left: 1.04 }

export const CHARACTER_SPRITES = {
  // Sala: o personagem é desenhado em duas camadas, para as pernas continuarem andando durante o golpe.
  // 1) Pernas (atrás): ciclo de 12 quadros por direção, mais o quadro 12 (parado). Desenhadas por código com o
  //    mesmo material do tronco (grade de 3 px, tom, grão e contorno do original); a perna de trás é mais escura.
  //    De lado, o pé apoiado anda para trás em linha reta (como o chão passando) e o pé no ar volta em curva,
  //    com passada de 30 px para cada lado. De frente e de costas, o pé apoiado fica no lugar e o outro sobe 18 px.
  //    O ciclo se repete a cada 80 u andadas (WALK_CYCLE_DISTANCE).
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
  //    (um quique por passo: sobe até 7 px nas laterais e até 9 px de frente e de costas, onde também joga 5 px
  //    para os lados; o bastão balança 9° e 13°, com atraso). O tronco só é movido, nunca girado: rosto e paleta
  //    não mudam. O quadro 0 é a pose parada (o golpe e o dano terminam nela).
  // Os pés ficam no mesmo ponto de todos os quadros (feetPadding), então não há "pulo".
  tungTungSahurAndar: {
    src: '/sprites/characters/tung-tung-sahur/andar.png',
    frameWidth: 296,
    frameHeight: 259,
    feetPadding: 18,
    framesPerRow: 12,
    rows: { down: 0, left: 1, right: 2, up: 3 },
    directionScale: LEFT_VIEW_SCALE,
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
    directionScale: LEFT_VIEW_SCALE,
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
    directionScale: LEFT_VIEW_SCALE,
  },
  // Sala: morte, uma linha só (sempre de frente, seja qual for a direção em que ele estava).
  // Ele tomba como árvore cortada: o bastão escapa, o corpo cai duro de lado, quica e fica deitado.
  // O último quadro é o que fica na tela. A célula é larga porque o corpo deitado e o bastão saem do quadro de 296x259.
  // - durations: ms de cada quadro
  // Quadros: 0 parado (igual à pose do jogo), 1 leva o golpe e o bastão escapa, 2 e 3 cambaleia, 4 a 6 tomba
  // cada vez mais rápido, 7 bate no chão (voam lascas de madeira), 8 quica, 9 e 10 deita e o bastão cai e rola,
  // 11 tudo parado. É diferente da morte dos inimigos: o corpo não achata, o rosto não muda e não há poeira.
  // A folha já traz a sombra dele (o jogo não desenha a sombra dos pés durante a morte).
  // Gerada por gerar_morte.py (fora do repositório), só com peças do original; os números vêm do morte.json dele.
  tungTungSahurMorte: {
    src: '/sprites/characters/tung-tung-sahur/morte.png',
    frameWidth: 600,
    frameHeight: 400,
    feetX: 380,
    feetPadding: 40,
    framesPerRow: 12,
    rows: { down: 0 },
    durations: [100, 80, 100, 90, 80, 70, 60, 120, 120, 120, 150, 300],
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
