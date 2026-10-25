import { drawShape, ellipsePath } from './draw.js'

// Onde o Tung Tung Sahur fica na cena, em pixels da cena.
// O sprite é mostrado por cima do canvas pelo componente CharacterSprite
// (veja TitleScene.jsx); no canvas fica só a sombra no chão.
export const CHARACTER_SPOT = {
  x: 179, // centro dos pés
  groundY: 203, // linha do chão onde ficam os pés
  scale: 0.083, // o quadro tem 1503 px de altura; assim o personagem fica com ~119 px da cena
}

export function drawCharacterShadow(ctx) {
  drawShape(ctx, ellipsePath(CHARACTER_SPOT.x, CHARACTER_SPOT.groundY - 2, 30, 5), 'rgba(10, 4, 3, 0.55)', null)
}
