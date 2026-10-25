// Área segura da cena, em pixels da pixel art. Ela tem a proporção do frame
// "tela inicial" do protótipo (1440x1024): cada pixel da cena vale 4px no Figma.
// Título, personagem e mensagem ficam sempre dentro dela.
export const SCENE_WIDTH = 360
export const SCENE_HEIGHT = 256

// Calcula o tamanho do canvas para preencher a tela sem cortar a área segura.
// Em telas mais largas a cena ganha mais vila nas laterais; em telas mais
// altas, ganha céu e chão. offsetX/offsetY dizem onde a área segura começa.
export function getView(screenWidth, screenHeight) {
  if (!screenWidth || !screenHeight) {
    return { width: SCENE_WIDTH, height: SCENE_HEIGHT, offsetX: 0, offsetY: 0 }
  }

  const screenRatio = screenWidth / screenHeight
  const sceneRatio = SCENE_WIDTH / SCENE_HEIGHT
  const isWider = screenRatio > sceneRatio
  // A sobra de cada lado é um número inteiro: a área segura fica exatamente
  // no centro, como a área do personagem no CSS (veja .title-scene__stage)
  const offsetX = isWider ? Math.round((SCENE_HEIGHT * screenRatio - SCENE_WIDTH) / 2) : 0
  const offsetY = isWider ? 0 : Math.round((SCENE_WIDTH / screenRatio - SCENE_HEIGHT) / 2)

  return {
    width: SCENE_WIDTH + offsetX * 2,
    height: SCENE_HEIGHT + offsetY * 2,
    offsetX,
    offsetY,
  }
}
