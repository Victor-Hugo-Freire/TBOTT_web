// Paleta da sala, medida na imagem de referência (docs/referencias/sala-inicial-vazia.png).
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

  // Piso de madeira
  floorA: '#483020',
  floorB: '#583828',
  floorC: '#604028',
  floorJoint: '#201810',
}

// Luz do piso: centro (em unidades da sala) e raio
export const FLOOR_LIGHT = { x: 650, y: 335, radius: 570 }
