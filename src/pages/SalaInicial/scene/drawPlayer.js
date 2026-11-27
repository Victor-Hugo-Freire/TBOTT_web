import { APPEARANCE_DRAW_ORDER } from '../../../data/appearanceSprites.js'
import { getAppearanceLayers } from '../../../utils/appearance.js'
import { getPlayerPose } from '../../../utils/player.js'
import { getBaseStats } from '../../../utils/stats.js'
import { drawAttackArc } from './drawAttackArc.js'
import { drawShadow } from './drawShadow.js'
import { drawSprite, PLAYER_SPRITE_SCALE } from './drawSprite.js'
import { getImage, isImageReady } from './images.js'

// Desenha o personagem de baixo para cima: sombra, arco do golpe (atrás, para não tapá-lo) e depois,
// na ordem de APPEARANCE_DRAW_ORDER: aura dos itens (no chão), itens atrás, pernas, tronco (ou o corpo inteiro,
// no dano e na morte) e itens na frente. Na morte a sombra vem da própria folha (ele cai de lado).
// visibleItems = itens que aparecem no Tung (getVisibleItems, em appearance.js).
// characterId e timeMs: quem voa (o God) bate as asas pelo tempo, mesmo parado; o chifre tem imagem por personagem.
export function drawPlayer(ctx, sheets, player, reduceMotion, visibleItems = [], characterId, timeMs = 0) {
  const pose = getPlayerPose(player, reduceMotion, getBaseStats(characterId).flying, timeMs)
  const { sprite, image } = sheets[pose.sheet]
  if (!player.dead) drawShadow(ctx, player)
  drawAttackArc(ctx, player)

  const layers = getAppearanceLayers(visibleItems, pose, characterId)
  for (const position of APPEARANCE_DRAW_ORDER) {
    if (position === 'pernas') {
      if (pose.legs) {
        const legs = sheets.legs
        drawSprite(ctx, legs.image, legs.sprite, pose.legs.direction, pose.legs.frame, player)
      }
    } else if (position === 'tronco') {
      drawSprite(ctx, image, sprite, pose.direction, pose.frame, player)
    } else {
      for (const layer of layers) {
        if (layer.position === position) drawLayer(ctx, sheets.walk.sprite, pose.direction, layer, player)
      }
    }
  }
}

// Uma camada de item: a imagem tem o tamanho da célula do andar e já vem no lugar do quadro 0 do andar,
// então é desenhada como esse quadro (mesmo pivô e mesmo tamanho), mais o deslocamento do quadro atual.
// O bastão também gira em volta do anel.
function drawLayer(ctx, walkSprite, direction, layer, feet) {
  const image = getImage(layer.path)
  if (!isImageReady(image)) return
  const size = PLAYER_SPRITE_SCALE * (walkSprite.directionScale?.[direction] ?? 1)
  const left = feet.x - (walkSprite.frameWidth / 2) * size
  const top = feet.y - (walkSprite.frameHeight - walkSprite.feetPadding) * size

  ctx.save()
  ctx.translate(left + layer.offset[0] * size, top + layer.offset[1] * size)
  if (layer.rotation) {
    const [pivotX, pivotY] = layer.pivot
    ctx.translate(pivotX * size, pivotY * size)
    ctx.rotate((layer.rotation * Math.PI) / 180)
    ctx.translate(-pivotX * size, -pivotY * size)
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0, walkSprite.frameWidth * size, walkSprite.frameHeight * size)
  ctx.restore()
}
