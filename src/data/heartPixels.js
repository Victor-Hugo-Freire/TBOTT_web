// Coração de vida do HUD, em pixel art desenhada por código (um retângulo por pixel, como a fonte do jogo).
// O formato lembra o do Isaac (gordinho, contorno grosso, brilho em cima à esquerda), mas é de MADEIRA, como
// o corpo do Tung Tung: tons do tronco dele, veios e um nó.
// - full: madeira inteira;
// - half: só a metade esquerda de madeira;
// - empty: o mesmo contorno com o interior entalhado (oco).
// Os três estados têm o mesmo tamanho e o mesmo contorno. Cada caractere é uma cor de `palette`; '.' é transparente.
export const HEART_PIXELS = {
  width: 13,
  height: 12,
  palette: {
    '#': '#140806', // contorno (o mesmo dos obstáculos)
    h: '#f8a850', // brilho
    l: '#cc6c22', // madeira clara
    b: '#a04410', // madeira (o tom do tronco)
    s: '#7c300c', // sombra
    v: '#602208', // veios e a borda de dentro do oco
    d: '#38180c', // nó da madeira e a sombra de dentro do oco
    e: '#583828', // fundo do oco
  },
  full: [
    '..####.####..',
    '.#llll#lllb#.',
    '#lhhlbllvbbs#',
    '#lhlvllbvbbs#',
    '#llbvlbbbvbs#',
    '#lbbvlbbdvss#',
    '#bbbvbbbbvss#',
    '.#bbbvbbvss#.',
    '..#bbvbbss#..',
    '...#bvsss#...',
    '....#sss#....',
    '.....###.....',
  ],
  half: [
    '..####.####..',
    '.#llll#dddd#.',
    '#lhhlbdeeeee#',
    '#lhlvldeeeev#',
    '#llbvldeeeev#',
    '#lbbvldeeeev#',
    '#bbbvbdeeevv#',
    '.#bbbvdeevv#.',
    '..#bbvdevv#..',
    '...#bvdev#...',
    '....#sde#....',
    '.....###.....',
  ],
  empty: [
    '..####.####..',
    '.#dddd#dddd#.',
    '#ddeeedeeeee#',
    '#deeeeeeeeev#',
    '#deeeeeeeeev#',
    '#eeeeeeeeeev#',
    '#eeeeeeeeevv#',
    '.#eeeeeeevv#.',
    '..#eeeeevv#..',
    '...#eeeev#...',
    '....#eee#....',
    '.....###.....',
  ],
}
