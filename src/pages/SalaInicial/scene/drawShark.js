import { EFFECT_SPRITES } from '../../../data/effectSprites.js'
import { getPullPoint, SHARK_DEATH_MS } from '../../../utils/roomInteractions.js'
import { drawSprite } from './drawSprite.js'

// O Tralalero na poça da Sala do Pacto: a barbatana contornando a borda e a morte do Tung puxado para a água.
// A barbatana é desenhada por código (como no protótipo): uma forma lisa anda por frações de pixel sem tremer.
// O respingo usa a folha de efeito que já existia, e o Tung, a pose de dano. Tudo em unidades da sala.

const OUTLINE = '#140806'
const SPLASH = EFFECT_SPRITES.respingo
const SPLASH_ANCHOR = { x: 90, y: 100 } // na folha do respingo: o meio da onda

// Fases da morte puxado pelo tubarão (em ms, desde que a barbatana pegou o Tung)
const FIN_ARRIVES_MS = 400 // a barbatana corre até ele
const PULLED_MS = 1000 // ele é arrastado para a água e afunda; depois sobem bolhas e a barbatana vai embora
const SINK_DEPTH = 130 // quanto ele desce abaixo da linha d'água

// Fases da queda sozinho na poça (em ms, desde que ele pisou nela)
const FIN_DIVE_MS = 350 // a barbatana mergulha e some
const FALL_SINK_MS = 700 // ele afunda onde pisou; depois sobem bolhas

// As imagens são carregadas na primeira vez que aparecem (como a chapa do garfo em drawDoors.js)
const images = {}
function getImage(sprite) {
  if (!images[sprite.id]) {
    images[sprite.id] = new Image()
    images[sprite.id].src = sprite.path
  }
  return images[sprite.id]
}

// Um quadro de uma folha de efeito, com o ponto anchor da folha em (x, y)
function drawEffectFrame(ctx, sprite, frame, anchor, x, y, scale) {
  const image = getImage(sprite)
  if (!image.complete || !image.naturalWidth) return
  const { frameWidth: width, frameHeight: height } = sprite
  ctx.save()
  ctx.imageSmoothingEnabled = false // pixel art: sem borrar (o respingo fica parado, então não treme)
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.drawImage(image, frame * width, 0, width, height, -anchor.x, -anchor.y, width, height)
  ctx.restore()
}

function lerp(from, to, t) {
  return from + (to - from) * t
}

// Contorno da barbatana nadando para a direita, com a base na linha d'água em (0, 0):
// a borda da frente (direita) é curva e a de trás desce de volta até a base
function traceFin(ctx) {
  ctx.beginPath()
  ctx.moveTo(24, 0)
  ctx.quadraticCurveTo(18, -30, -4, -46)
  ctx.quadraticCurveTo(-8, -18, -24, 0)
  ctx.closePath()
}

// Barbatana na água. fin = { x, y, turn } (veja getSharkFinPosition): turn 1 nada para a direita, -1 para a esquerda.
// Nas pontas da volta (turn perto de 0) ela fica estreita e vira aos poucos, sem pular de um lado para o outro.
// timeMs anima a onda em volta dela.
export function drawSharkFin(ctx, fin, timeMs) {
  const wave = Math.sin(timeMs / 140) // de -1 a 1: a onda cresce e diminui
  const side = fin.turn < 0 ? -1 : 1
  const width = Math.max(0.3, Math.abs(fin.turn)) // de frente ela parece mais fina, mas nunca some
  ctx.save()
  ctx.translate(fin.x, fin.y)
  ctx.scale(side * width, 1)

  // Rastro atrás da barbatana e a onda em volta da base
  ctx.strokeStyle = 'rgba(170, 215, 240, 0.45)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(-46, 3, 14 + wave * 2, 3, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(170, 215, 240, 0.7)'
  ctx.beginPath()
  ctx.ellipse(-8, 2, 34 + wave * 3, 6, 0, 0, Math.PI * 2)
  ctx.stroke()

  // Barbatana: contorno escuro, azul, a parte de trás na sombra e um brilho na frente
  traceFin(ctx)
  ctx.lineJoin = 'round'
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = 5
  ctx.stroke()
  ctx.fillStyle = '#3a78b0'
  ctx.fill()
  ctx.fillStyle = '#2a5a8a'
  ctx.beginPath()
  ctx.moveTo(-4, -46)
  ctx.quadraticCurveTo(-8, -18, -24, 0)
  ctx.lineTo(-6, 0)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(190, 225, 245, 0.7)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(16, -4)
  ctx.quadraticCurveTo(12, -24, -1, -36)
  ctx.stroke()

  // Espuma na base, onde a barbatana corta a água
  ctx.fillStyle = 'rgba(225, 242, 255, 0.85)'
  ctx.beginPath()
  ctx.ellipse(0, 1, 26, 3.5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// O Tung assustado (quadro 1 da animação de dano, de frente), com os pés em feet
function drawScaredTung(ctx, sheets, feet) {
  drawSprite(ctx, sheets.hurt.image, sheets.hurt.sprite, 'down', 1, feet)
}

// Morte pelo Tralalero, no lugar do drawPlayer. player.dead.elapsed diz em que ponto a animação está;
// fin é onde a barbatana estava quando ele foi pego (run.death.fin).
// Depois dela (e com "reduzir movimento", ou ao recarregar uma run já acabada) a água fica calma, sem o Tung.
export function drawSharkGrab(ctx, sheets, player, fin, reduceMotion) {
  const elapsed = player.dead.elapsed
  if (reduceMotion || elapsed >= SHARK_DEATH_MS) return

  // Para onde ele é puxado (dentro da poça, do lado dele); a barbatana sai de onde estava e volta para lá depois
  const target = getPullPoint(player)
  const start = fin
  const finTurn = target.x < start.x ? -1 : 1 // -1: a barbatana vai para a esquerda até ele

  // 1) Ele leva um susto e a barbatana atravessa a poça até ele
  if (elapsed < FIN_ARRIVES_MS) {
    const t = elapsed / FIN_ARRIVES_MS
    drawSharkFin(ctx, { x: lerp(start.x, target.x, t), y: lerp(start.y, target.y, t), turn: finTurn }, elapsed)
    drawScaredTung(ctx, sheets, player)
    return
  }

  // 2) Arrastado até a água (primeiros 40%) e depois afunda: o que passa da linha d'água some
  if (elapsed < PULLED_MS) {
    const t = (elapsed - FIN_ARRIVES_MS) / (PULLED_MS - FIN_ARRIVES_MS)
    const pull = Math.min(1, t / 0.4)
    const sink = Math.max(0, (t - 0.4) / 0.6)
    const feet = { x: lerp(player.x, target.x, pull), y: lerp(player.y, target.y, pull) + sink * SINK_DEPTH }
    if (pull < 1) drawSharkFin(ctx, { x: target.x - 24 * finTurn, y: target.y, turn: finTurn }, elapsed)

    ctx.save()
    if (pull >= 1) {
      ctx.beginPath()
      ctx.rect(feet.x - 200, target.y - 400, 400, 406)
      ctx.clip()
    }
    drawScaredTung(ctx, sheets, feet)
    ctx.restore()

    if (pull >= 1) {
      const splashMs = elapsed - (FIN_ARRIVES_MS + (PULLED_MS - FIN_ARRIVES_MS) * 0.4)
      const frame = Math.min(3, Math.floor(splashMs / SPLASH.animations.respingo.durations[0]))
      drawEffectFrame(ctx, SPLASH, frame, SPLASH_ANCHOR, target.x, target.y, 1)
    }
    return
  }

  // 3) Bolhas sobem onde ele afundou e a barbatana volta para onde estava
  const t = (elapsed - PULLED_MS) / (SHARK_DEATH_MS - PULLED_MS)
  drawBubbles(ctx, target, t)
  drawSharkFin(ctx, { x: lerp(target.x, start.x, t), y: lerp(target.y, start.y, t), turn: -finTurn }, elapsed)
}

// Três bolhas subindo e sumindo (t de 0 a 1) acima do ponto onde ele afundou
function drawBubbles(ctx, point, t) {
  ctx.strokeStyle = `rgba(150, 205, 235, ${1 - t})`
  ctx.lineWidth = 2
  for (let bubble = 0; bubble < 3; bubble++) {
    ctx.beginPath()
    ctx.arc(point.x - 14 + bubble * 14, point.y - t * 34 - bubble * 8, 5 - bubble, 0, Math.PI * 2)
    ctx.stroke()
  }
}

// Morte por cair sozinho na poça (a barbatana estava longe), no lugar do drawPlayer.
// A barbatana mergulha onde estava (fin = run.death.fin) e ele afunda onde pisou, com respingo e bolhas.
// Depois dela (e com "reduzir movimento", ou ao recarregar uma run já acabada) a água fica calma, sem o Tung.
export function drawPuddleFall(ctx, sheets, player, fin, reduceMotion) {
  const elapsed = player.dead.elapsed
  if (reduceMotion || elapsed >= SHARK_DEATH_MS) return

  // A barbatana desce e some embaixo da linha d'água
  if (elapsed < FIN_DIVE_MS) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(fin.x - 80, fin.y - 120, 160, 124)
    ctx.clip()
    drawSharkFin(ctx, { x: fin.x, y: fin.y + (elapsed / FIN_DIVE_MS) * 55, turn: fin.turn }, elapsed)
    ctx.restore()
  }

  // Ele afunda onde pisou: o que passa da linha d'água (a altura dos pés) some
  if (elapsed < FALL_SINK_MS) {
    const feet = { x: player.x, y: player.y + (elapsed / FALL_SINK_MS) * SINK_DEPTH }
    ctx.save()
    ctx.beginPath()
    ctx.rect(player.x - 200, player.y - 400, 400, 406)
    ctx.clip()
    drawScaredTung(ctx, sheets, feet)
    ctx.restore()
    const frame = Math.min(3, Math.floor(elapsed / SPLASH.animations.respingo.durations[0]))
    drawEffectFrame(ctx, SPLASH, frame, SPLASH_ANCHOR, player.x, player.y, 1)
    return
  }

  drawBubbles(ctx, player, (elapsed - FALL_SINK_MS) / (SHARK_DEATH_MS - FALL_SINK_MS))
}
