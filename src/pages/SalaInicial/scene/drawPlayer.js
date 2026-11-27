import { APPEARANCE_DRAW_ORDER } from '../../../data/appearanceSprites.js'
import { getAppearanceLayers } from '../../../utils/appearance.js'
import { getHoverOffset, getLegSwing, getPlayerPose } from '../../../utils/player.js'
import { getBaseStats } from '../../../utils/stats.js'
import { drawAttackArc } from './drawAttackArc.js'
import { drawShadow } from './drawShadow.js'
import { drawSprite, PLAYER_SPRITE_SCALE } from './drawSprite.js'
import { getImage, isImageReady } from './images.js'

// Quadril na folha das pernas (px da célula, medido no quadro parado: as pernas vão de y 168 a 240 e os pés ficam em 241;
// o topo fica escondido pelo tronco). As pernas de quem voa balançam em volta deste ponto.
const LEGS_HIP_Y = 175

// Desenha o personagem de baixo para cima: sombra, arco do golpe (atrás, para não tapá-lo) e depois,
// na ordem de APPEARANCE_DRAW_ORDER: aura dos itens (no chão), itens atrás, pernas, tronco (ou o corpo inteiro,
// no dano e na morte) e itens na frente. Na morte a sombra vem da própria folha (ele cai de lado).
// visibleItems = itens que aparecem no Tung (getVisibleItems, em appearance.js).
// characterId e timeMs: quem voa (o God) bate as asas e balança as pernas (player.flyMs); o chifre tem imagem por personagem.
// Quem voa é desenhado acima do chão (getLiftedFeet) e inclinado para o lado do voo (player.lean): a sombra, a aura do
// Caldo (no chão) e o arco do golpe ficam nos pés de verdade, e o corpo e os itens sobem e inclinam juntos.
export function drawPlayer(ctx, sheets, player, reduceMotion, visibleItems = [], characterId, timeMs = 0) {
  const flying = getBaseStats(characterId).flying
  const pose = getPlayerPose(player, reduceMotion, flying)
  const { sprite, image } = sheets[pose.sheet]
  const body = getLiftedFeet(player, characterId, reduceMotion, timeMs)
  if (!player.dead) drawShadow(ctx, player)
  drawAttackArc(ctx, player)

  const layers = getAppearanceLayers(visibleItems, pose, characterId)
  for (const position of APPEARANCE_DRAW_ORDER) {
    if (position === 'aura') {
      // A aura fica no chão; depois dela, o resto do corpo inclina em volta dos pés (só quem voa tem lean)
      for (const layer of layers) {
        if (layer.position === 'aura') drawLayer(ctx, sheets.walk.sprite, pose.direction, layer, player)
      }
      ctx.save()
      const lean = player.dead ? 0 : player.lean
      if (lean) {
        ctx.translate(body.x, body.y)
        ctx.rotate((lean * Math.PI) / 180)
        ctx.translate(-body.x, -body.y)
      }
    } else if (position === 'pernas') {
      if (pose.legs) {
        const legs = sheets.legs
        // Quem voa: as pernas penduradas balançam girando em volta do quadril
        const swing = getLegSwing(player, flying, reduceMotion)
        ctx.save()
        if (swing) {
          const hipY = body.y - (legs.sprite.frameHeight - legs.sprite.feetPadding - LEGS_HIP_Y) * PLAYER_SPRITE_SCALE
          ctx.translate(body.x, hipY)
          ctx.rotate((swing * Math.PI) / 180)
          ctx.translate(-body.x, -hipY)
        }
        drawSprite(ctx, legs.image, legs.sprite, pose.legs.direction, pose.legs.frame, body)
        ctx.restore()
      }
    } else if (position === 'tronco') {
      drawSprite(ctx, image, sprite, pose.direction, pose.frame, body)
    } else {
      for (const layer of layers) {
        if (layer.position === position) drawLayer(ctx, sheets.walk.sprite, pose.direction, layer, body)
      }
    }
  }
  ctx.restore()
}

// Os pés de onde o personagem é DESENHADO: os de verdade, subidos pelo voo (getHoverOffset) se ele voa.
// Os efeitos que acompanham o corpo (bolha do escudo, item erguido) usam isto também.
export function getLiftedFeet(player, characterId, reduceMotion, timeMs) {
  const lift = getHoverOffset(player, getBaseStats(characterId), timeMs, reduceMotion)
  return { ...player, y: player.y - lift }
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
