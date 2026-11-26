import { PATAPIM } from '../../../data/bossBehavior.js'
import { EFFECT_SPRITES } from '../../../data/effectSprites.js'
import { MOKA } from '../../../data/enemyBehavior.js'
import { getEnemyPose } from '../../../utils/enemies.js'
import { getEnemySprite, getLayerVariant } from '../../../utils/enemyBehaviors.js'
import { ROOT_MS, SEED_HEIGHT } from '../../../utils/enemyShots.js'
import { drawEffectSpriteFrame, getEffectSpriteFrame } from './drawItemEffects.js'
import { drawShadow } from './drawShadow.js'
import { drawFrame } from './drawSprite.js'

// Tamanho dos desenhos dos efeitos (escala 1 = o tamanho da folha no jogo)
const SHIELD_SCALE = 1.8 // escudo de vapor (71 u na escala 1) em volta do corpo do aliado
const SEED_SCALE = 1.3 // caroço
const PIZZA_SCALE = 1.3 // pizza
const MARK_SCALE = 1.95 // marca no chão (62 u na escala 1) do tamanho do queijo que a pizza vai deixar
const BOSS_SHADOW_SCALE = 2.5 // a sombra do chefe: 2,5x a do Tung (61 u), mais ou menos a largura da base dele
const NOTE_SCALE = 1.3 // nota musical do Tralalero (34 x 43 u na escala 1)
const NOTE_HEIGHT = 60 // a nota voa nesta altura acima da sombra dela
const BANANA_SCALE = 1.2 // banana-bumerangue do Chimpanzini (57 x 57 u na escala 1)
const BANANA_HEIGHT = 70 // a banana voa nesta altura acima da sombra dela
const ROOT_SCALE = 1.2 // raiz do Patapim (68 x 80 u na escala 1)
const ROOT_LIFT = 40 // o meio do desenho da raiz fica acima do ponto do chão de onde ela brota
const DROP_SCALE = 1.2 // gota de café da Ballerina (28 x 34 u na escala 1)
const DROP_HEIGHT = 50 // a gota voa nesta altura acima da sombra dela
const BOMB_SCALE = 1.3 // bomba do Bombardiro (40 x 51 u na escala 1)
const BOMB_FALL_HEIGHT = 500 // a bomba começa a cair desta altura acima da marca
const BOMB_MARK_SCALE = 1.9 // a marca no chão (91 u na escala 1) do tamanho da explosão (2 x blastRadius)
const BOSS_HIT_FLASH_MS = 180 // o chefe clareia por este tempo depois de cada golpe (ele não troca de pose: veja getEnemyPose)
const BOSS_HIT_FLASH_STRENGTH = 1 // o quanto ele clareia no instante do golpe (0 a 1)
const BOSS_HIT_FLASH_PASSES = 2 // quantas vezes o desenho é somado por cima (2 = o dobro de brilho)
const CLONE_ALPHA = 0.6 // os clones do Cappuccino são cópias meio transparentes dele (como os fantasmas da folha)

// Um inimigo (ou o chefe) na sala: a sombra, as pernas (atrás) e o tronco (na frente), com os pés em (enemy.x, enemy.y).
// A folha é de frente; virado para a esquerda, o desenho é espelhado em volta dos pés.
// Sem barra de vida nem número de dano (regra do Victor): o dano aparece pela animação "dano" e a morte pela "morte".
// Só o chefe tem barra, embaixo da tela (drawBossBar.js); no lugar da animação de dano, ele clareia um instante a cada golpe.
// Com o escudo de vapor da Moka, a bolha de vapor fica em volta do corpo até ele levar um golpe.
export function drawEnemy(ctx, enemy, reduceMotion, timeMs) {
  const pose = getEnemyPose(enemy, reduceMotion)
  if (!pose) return // a animação de morte já acabou: ele sumiu
  const sprite = getEnemySprite(enemy.enemyId)
  const { row } = sprite.animations[pose.animation]
  // O chefe numa fase com outra aparência (o Tralalero de óculos, o Chimpanzini descascado, a Nonna com menos camadas)
  // e o Pinguino com menos bolas usam a versão da folha (variantLayers, em bossSprites.js e enemySprites.js)
  const variant = getLayerVariant(enemy)
  const layers = (variant && sprite.variantLayers?.[variant]) || sprite.layers

  ctx.save()
  ctx.globalAlpha = pose.alpha * (enemy.clone ? CLONE_ALPHA : 1) // no fim da morte, ele e a sombra apagam juntos
  // Escondidos (a Polpetta no molho, o Tralalero debaixo do chão, só a barbatana) não têm sombra
  if ((enemy.boss || enemy.clone) && !enemy.hidden) drawScaledShadow(ctx, enemy.x, enemy.y, BOSS_SHADOW_SCALE)
  else if (!enemy.hidden) drawShadow(ctx, enemy)
  ctx.translate(enemy.x, enemy.y)
  if (enemy.facingLeft) ctx.scale(-1, 1)
  drawFrame(ctx, { ...sprite, path: layers.pernas }, row, pose.frame, 0, 0)
  drawFrame(ctx, { ...sprite, path: layers.tronco }, row, pose.frame, 0, 0)
  // O golpe no chefe: o mesmo desenho por cima, somando cor (só onde ele tem pixels), apagando em BOSS_HIT_FLASH_MS
  const hitFlash = enemy.boss && !enemy.dead ? 1 - enemy.hurtMs / BOSS_HIT_FLASH_MS : 0
  if (hitFlash > 0) {
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = pose.alpha * hitFlash * BOSS_HIT_FLASH_STRENGTH
    for (let pass = 0; pass < BOSS_HIT_FLASH_PASSES; pass++) {
      drawFrame(ctx, { ...sprite, path: layers.pernas }, row, pose.frame, 0, 0)
      drawFrame(ctx, { ...sprite, path: layers.tronco }, row, pose.frame, 0, 0)
    }
  }
  ctx.restore()

  if (enemy.shielded && !enemy.dead) {
    const shield = EFFECT_SPRITES['vapor-escudo']
    const frame = reduceMotion ? 0 : getEffectSpriteFrame(shield, timeMs, true)
    drawEffectSpriteFrame(ctx, shield, frame, enemy.x, enemy.y - enemy.height / 2, SHIELD_SCALE)
  }
}

// Rastros dos inimigos no chão (o gelo do Pinguino e o queijo quente do Fenicottero), embaixo de todos: a folha
// do efeito com o nome do rastro (kind) repete e apaga no fim
const TRAIL_FADE_MS = 500

export function drawEnemyFloor(ctx, floor) {
  for (const trail of floor) {
    const sprite = EFFECT_SPRITES[trail.kind]
    ctx.save()
    ctx.globalAlpha = Math.min(1, (trail.ms - trail.ageMs) / TRAIL_FADE_MS)
    drawEffectSpriteFrame(ctx, sprite, getEffectSpriteFrame(sprite, trail.ageMs, true), trail.x, trail.y, trail.scale ?? 1)
    ctx.restore()
  }
}

// Sombra de um personagem `scale` vezes maior: 0,5 embaixo de um projétil e BOSS_SHADOW_SCALE embaixo do chefe
function drawScaledShadow(ctx, x, y, scale) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  drawShadow(ctx, { x: 0, y: 0 })
  ctx.restore()
}

// A parte dos projéteis que fica no chão, embaixo de todos: a sombra do caroço e da pizza, a marca de onde a pizza
// vai cair e o anel de vapor da Moka crescendo
export function drawEnemyShotsFloor(ctx, shots) {
  for (const shot of shots) {
    if (shot.kind === 'anel') {
      const sprite = EFFECT_SPRITES['vapor-anel']
      drawEffectSpriteFrame(ctx, sprite, getEffectSpriteFrame(sprite, shot.ageMs, false), shot.x, shot.y, MOKA.ringScale)
      continue
    }
    if (shot.kind === 'pizza') {
      const mark = EFFECT_SPRITES['marca-chao']
      drawEffectSpriteFrame(ctx, mark, getEffectSpriteFrame(mark, shot.ageMs, true), shot.to.x, shot.to.y, MARK_SCALE)
    }
    if (shot.kind === 'bomba') {
      // A marca de onde a bomba vai cair, do tamanho da explosão
      const mark = EFFECT_SPRITES['marca-chao']
      drawEffectSpriteFrame(ctx, mark, getEffectSpriteFrame(mark, shot.ageMs, true), shot.x, shot.y, BOMB_MARK_SCALE)
    }
    if (shot.kind === 'raizes') continue // as raízes saem do chão: não têm sombra
    drawScaledShadow(ctx, shot.x, shot.y, 0.5)
  }
}

// O caroço e a pizza no ar, girando, por cima de todos
export function drawEnemyShots(ctx, shots) {
  for (const shot of shots) {
    if (shot.kind === 'caroco') {
      const sprite = EFFECT_SPRITES.caroco
      drawEffectSpriteFrame(ctx, sprite, getEffectSpriteFrame(sprite, shot.ageMs, true), shot.x, shot.y - SEED_HEIGHT, SEED_SCALE)
    }
    if (shot.kind === 'pizza') {
      const sprite = EFFECT_SPRITES['pizza-lancada']
      drawEffectSpriteFrame(ctx, sprite, getEffectSpriteFrame(sprite, shot.ageMs, true), shot.x, shot.y - shot.height, PIZZA_SCALE)
    }
    if (shot.kind === 'nota') {
      const sprite = EFFECT_SPRITES['nota-musical']
      drawEffectSpriteFrame(ctx, sprite, getEffectSpriteFrame(sprite, shot.ageMs, true), shot.x, shot.y - NOTE_HEIGHT, NOTE_SCALE)
    }
    if (shot.kind === 'banana') {
      const sprite = EFFECT_SPRITES['banana-bumerangue']
      drawEffectSpriteFrame(ctx, sprite, getEffectSpriteFrame(sprite, shot.ageMs, true), shot.x, shot.y - BANANA_HEIGHT, BANANA_SCALE)
    }
    if (shot.kind === 'gota') {
      const sprite = EFFECT_SPRITES['gota-cafe']
      drawEffectSpriteFrame(ctx, sprite, getEffectSpriteFrame(sprite, shot.ageMs, true), shot.x, shot.y - DROP_HEIGHT, DROP_SCALE)
    }
    if (shot.kind === 'bomba') {
      // A bomba cai do alto até a marca, cada vez mais rápido
      const t = Math.min(1, shot.ageMs / shot.fallMs)
      const sprite = EFFECT_SPRITES.bomba
      drawEffectSpriteFrame(ctx, sprite, getEffectSpriteFrame(sprite, shot.ageMs, true), shot.x, shot.y - BOMB_FALL_HEIGHT * (1 - t * t), BOMB_SCALE)
    }
    if (shot.kind === 'raizes') {
      // Cada raiz brota rootStepMs depois da anterior e toca a folha dela uma vez
      const sprite = EFFECT_SPRITES.raiz
      shot.points.forEach((point, index) => {
        const rootMs = shot.ageMs - index * PATAPIM.rootStepMs
        if (rootMs >= 0 && rootMs < ROOT_MS) {
          drawEffectSpriteFrame(ctx, sprite, getEffectSpriteFrame(sprite, rootMs, false), point.x, point.y - ROOT_LIFT, ROOT_SCALE)
        }
      })
    }
  }
}
