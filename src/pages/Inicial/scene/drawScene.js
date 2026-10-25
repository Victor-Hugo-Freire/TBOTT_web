import { drawBackground } from './background.js'
import { drawCharacterShadow } from './character.js'
import { drawFireflies, drawFrame } from './effects.js'
import { drawLogo } from './logo.js'
import { drawPrompt } from './prompt.js'

// Desenha um quadro completo da tela inicial, de trás para a frente.
// time: segundos desde que a página abriu (é o que faz as animações andarem).
// view: tamanho do canvas e posição da área segura (veja getView em view.js).
export function drawScene(ctx, time, view) {
  // Limites da parte visível, nas coordenadas da cena (a área segura começa em 0,0)
  const bounds = {
    left: -view.offsetX,
    top: -view.offsetY,
    right: view.width - view.offsetX,
    bottom: view.height - view.offsetY,
  }

  ctx.save()
  ctx.translate(view.offsetX, view.offsetY)
  drawBackground(ctx, time, bounds)
  drawFireflies(ctx, time)
  drawCharacterShadow(ctx)
  drawLogo(ctx, time)
  drawPrompt(ctx, time)
  drawFrame(ctx, bounds)
  ctx.restore()
}
