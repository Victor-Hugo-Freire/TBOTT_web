// Paleta da sala, medida nas imagens de referência (docs/referencias/sala-inicial-vazia.png e o protótipo do Figma).
export const COLORS = {
  // Parede de cima, vigas e rodapé
  topWall: '#0a0807',
  topPanelA: '#302018',
  topPanelB: '#281818',
  beam: '#201810',
  beamLight: '#37261e',
  beamShadow: '#130f0e',
  beamBase: '#281b17',
  baseboard: '#302018',
  baseboardLine: '#181010',

  // Tijolos
  brickA: '#503028',
  brickB: '#603830',
  brickC: '#402820',
  mortar: '#201810',

  // Paredes laterais: blocos de pedra e coluna junto do piso.
  // A coluna é um degradê: começa na média das pedras (post) e termina no tom do piso junto da parede (postLight).
  stoneA: '#3b261b',
  stoneB: '#33211a',
  post: '#37241a',
  postLight: '#3e2a1c',

  // Piso de madeira
  floorA: '#483020',
  floorB: '#583828',
  floorC: '#604028',
  floorJoint: '#201810',
}

// Luz do piso: centro (em unidades da sala) e raio
export const FLOOR_LIGHT = { x: 800, y: 380, radius: 700 }
