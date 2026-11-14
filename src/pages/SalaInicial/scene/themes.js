import { COLORS } from './colors.js'

// Paletas das salas: os 5 andares e as 9 salas especiais, vindas do protótipo da issue #18
// (docs/referencias/prototipo-salas-issue-18/lib.js, objeto PAL). Os nomes dos campos são os mesmos do protótipo.
//
// - top, panelA, panelB, beam, beamLight: parede escura de cima, com painéis, e a viga
// - beamBase, beamShadow: viga de baixo (entre a parede e o piso) e a sombra dela
// - base, baseLine: rodapé de lajotas e as linhas entre elas
// - wall, wallCols, mortar: padrão da faixa de parede (brick, tile, facade, metal ou planks), cores e rejunte
// - floor, floorCols, joint: padrão do piso (planks, checker, cobble, concrete, dock ou slabs), cores e juntas
// - side, side2: tons das paredes laterais no protótipo
// - stoneA, stoneB, post, postLight: pedras e coluna das paredes laterais desta sala (veja withSideWalls)
// - doorFrame, doorTrim, doorLeaf: batente, acabamento e folha das portas
// - glow: cor da luz do piso, no formato 'r,g,b'

// A Cantina é a sala de hoje: as cores vêm de colors.js, para a imagem continuar idêntica.
const cantina = {
  top: COLORS.topWall,
  panelA: COLORS.topPanelA,
  panelB: COLORS.topPanelB,
  beam: COLORS.beam,
  beamLight: COLORS.beamLight,
  beamBase: COLORS.beamBase,
  beamShadow: COLORS.beamShadow,
  base: COLORS.baseboard,
  baseLine: COLORS.baseboardLine,
  wall: 'brick',
  wallCols: [COLORS.brickA, COLORS.brickB, COLORS.brickC],
  mortar: COLORS.mortar,
  floor: 'planks',
  floorCols: [COLORS.floorA, COLORS.floorB, COLORS.floorC],
  joint: COLORS.floorJoint,
  side: '#2e2018',
  side2: '#382a20',
  stoneA: COLORS.stoneA,
  stoneB: COLORS.stoneB,
  post: COLORS.post,
  postLight: COLORS.postLight,
  doorFrame: '#4a3020',
  doorTrim: '#2a1a10',
  doorLeaf: '#5a3a22',
  glow: '170,118,70',
}

// Mistura duas cores '#rrggbb' meio a meio
function mixColors(first, second) {
  const channel = (index) => {
    const a = parseInt(first.slice(1 + index * 2, 3 + index * 2), 16)
    const b = parseInt(second.slice(1 + index * 2, 3 + index * 2), 16)
    return Math.round((a + b) / 2).toString(16).padStart(2, '0')
  }
  return `#${channel(0)}${channel(1)}${channel(2)}`
}

// Os outros temas partem da Cantina e trocam só o que muda (como o mix() do protótipo).
// As paredes laterais saem dos tons do próprio tema: as pedras usam side2 e side, e a coluna
// vai da média das pedras até um tom puxado um quarto para a cor do piso, para emendar com o chão
// daquela sala sem virar uma faixa clara nos pisos claros (como o da Mamãe).
function withSideWalls(changes) {
  const theme = { ...cantina, ...changes }
  return {
    ...theme,
    stoneA: theme.side2,
    stoneB: theme.side,
    post: mixColors(theme.side, theme.side2),
    postLight: mixColors(theme.side2, mixColors(theme.side2, theme.floorCols[0])),
  }
}

export const ROOM_THEMES = {
  cantina,

  // Andares
  cucina: withSideWalls({ top: '#0a0d0d', panelA: '#243230', panelB: '#1e2a28', beam: '#2a2018', beamLight: '#4a3a2a', beamBase: '#2a2018', base: '#3a2e24', wall: 'tile', wallCols: ['#3a4a48', '#324240', '#2d3a38'], mortar: '#161e1c', floor: 'checker', floorCols: ['#5a4a3a', '#463828'], side: '#2e2c28', side2: '#38342e', doorFrame: '#6a6a64', doorTrim: '#3a3a38', doorLeaf: '#7a5a38', glow: '200,150,90' }),
  // A fachada não usa rejunte; o mortar daqui só aparece entre as pedras das paredes laterais
  piazza: withSideWalls({ top: '#08090e', panelA: '#1a1c2a', panelB: '#14162a', beam: '#1c1a24', beamLight: '#32304a', beamBase: '#1e1c28', beamShadow: '#0c0c12', base: '#26283a', baseLine: '#12121c', wall: 'facade', wallCols: ['#5a4430', '#6a5038'], mortar: '#14151c', floor: 'cobble', floorCols: ['#3a3d4a', '#2f323d', '#444858'], joint: '#14151c', side: '#2a2c3a', side2: '#323446', doorFrame: '#3a3a48', doorTrim: '#22222c', doorLeaf: '#4a3a2a', glow: '150,160,220' }),
  pastificio: withSideWalls({ top: '#0c0c0e', panelA: '#2a2c30', panelB: '#222428', beam: '#25262a', beamLight: '#4a4c52', beamBase: '#2a2b30', beamShadow: '#0e0e10', base: '#33353a', baseLine: '#16171a', wall: 'metal', wallCols: ['#3b3f44', '#33373c', '#42464c'], mortar: '#16181a', floor: 'concrete', floorCols: ['#4a4640', '#3d3a35'], joint: '#1c1a18', side: '#2c2e32', side2: '#34363a', doorFrame: '#5a5e64', doorTrim: '#c8a020', doorLeaf: '#4a4e54', glow: '210,190,120' }),
  porto: withSideWalls({ top: '#080c10', panelA: '#1c2a34', panelB: '#16222c', beam: '#1c2630', beamLight: '#34485a', beamBase: '#202c36', beamShadow: '#0a1014', base: '#2a3640', baseLine: '#10181e', wall: 'planks', wallCols: ['#2c3a44', '#26333c', '#34444e'], mortar: '#10181e', floor: 'dock', floorCols: ['#5a4a38', '#4e4030', '#665440'], side: '#26323a', side2: '#2e3c46', doorFrame: '#4a5a64', doorTrim: '#2a3640', doorLeaf: '#5a4a38', glow: '120,170,200' }),

  // Salas especiais: cada uma usa a sua paleta em qualquer andar
  chefe: withSideWalls({ top: '#140a0a', panelA: '#3a1210', panelB: '#2e0e0c', beam: '#2a1210', beamLight: '#5a2220', beamBase: '#2a1412', wall: 'brick', wallCols: ['#5a2a24', '#6a302a', '#4a221c'], mortar: '#201010', floor: 'checker', floorCols: ['#3a1a18', '#2e1412'], side: '#3a2220', side2: '#462a28', glow: '200,90,60' }),
  tesouro: withSideWalls({ top: '#2a1c10', panelA: '#5a4020', panelB: '#4a3418', beam: '#4a3418', beamLight: '#7a5a30', beamBase: '#5a4220', base: '#5a4020', wall: 'tile', wallCols: ['#c8a870', '#b89860', '#a88850'], mortar: '#6a4a20', floor: 'planks', floorCols: ['#9a7040', '#a87c48', '#8a6238'], joint: '#4a2a10', side: '#7a5a34', side2: '#8a6a40', glow: '240,200,120' }),
  loja: withSideWalls({ top: '#1a1208', panelA: '#3a2810', panelB: '#2e200c', beam: '#3a2814', beamLight: '#6a4a28', wall: 'planks', wallCols: ['#6a4a2a', '#5a3e22', '#7a5632'], mortar: '#2a1a0c', floor: 'checker', floorCols: ['#7a6a58', '#5a4c3e'], side: '#3a2a1c', side2: '#46342a', glow: '230,180,110' }),
  pacto: withSideWalls({ top: '#060a10', panelA: '#102030', panelB: '#0c1824', beam: '#0e1c2a', beamLight: '#2a4a6a', beamBase: '#10202e', beamShadow: '#060c12', base: '#10202e', baseLine: '#08121a', wall: 'tile', wallCols: ['#1c3a4a', '#16303e', '#224654'], mortar: '#0a1820', floor: 'checker', floorCols: ['#14242e', '#0e1a22'], side: '#12222e', side2: '#182c3a', glow: '70,150,190' }),
  mamae: withSideWalls({ top: '#2a2010', panelA: '#6a5430', panelB: '#5a4628', beam: '#7a6238', beamLight: '#c8a860', beamBase: '#8a7040', base: '#8a7040', wall: 'tile', wallCols: ['#e0d0a0', '#d4c490', '#c8b880'], mortar: '#8a7440', floor: 'checker', floorCols: ['#e8dcc0', '#c8683a'], side: '#8a7448', side2: '#9a8456', glow: '255,230,160' }),
  fliperama: withSideWalls({ top: '#1a0e1e', panelA: '#4a1a3a', panelB: '#3a1430', beam: '#3a1a2e', beamLight: '#7a3a5a', beamBase: '#3a1a30', base: '#3a1a30', wall: 'brick', wallCols: ['#6a2a4a', '#5a2240', '#7a3454'], mortar: '#2a1020', floor: 'checker', floorCols: ['#3a2a4a', '#2a1e38'], side: '#32203a', side2: '#3c2846', glow: '220,140,200' }),
  palco: withSideWalls({ top: '#14060a', panelA: '#4a1424', panelB: '#3a101c', beam: '#2a0c14', beamLight: '#7a2a3a', beamBase: '#2e1018', base: '#3a1420', wall: 'tile', wallCols: ['#6a1a2a', '#5a1624', '#7a2232'], mortar: '#2a0c14', floor: 'planks', floorCols: ['#3a2418', '#4a2c1c', '#2e1c12'], side: '#3a1620', side2: '#461c28', glow: '230,150,120' }),
  adega: withSideWalls({ top: '#0c0a0a', panelA: '#2a2420', panelB: '#221c18', beam: '#1c1816', beamLight: '#3a3430', beamBase: '#201c1a', base: '#2a2420', wall: 'brick', wallCols: ['#3a3430', '#444038', '#302c28'], mortar: '#141210', floor: 'slabs', floorCols: ['#3a3632', '#44403a', '#302c28'], joint: '#141210', side: '#2a2622', side2: '#34302a', glow: '220,170,100' }),
  descanso: withSideWalls({ top: '#14100c', panelA: '#3a3020', panelB: '#30281a', beam: '#2c241a', beamLight: '#5a4a30', beamBase: '#30281c', base: '#3a3020', wall: 'planks', wallCols: ['#6a5a44', '#5e4f3a', '#76664e'], mortar: '#2a2014', floor: 'planks', floorCols: ['#6a5238', '#74593c', '#5e4830'], joint: '#2a1c10', side: '#3a3022', side2: '#463a2a', glow: '240,190,120' }),
}
