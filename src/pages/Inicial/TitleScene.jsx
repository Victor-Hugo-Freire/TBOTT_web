import { useEffect, useRef } from 'react'
import CharacterSprite from '../../components/CharacterSprite/CharacterSprite.jsx'
import { CHARACTER_SPRITES } from '../../data/characterSprites.js'
import { CHARACTER_SPOT } from './scene/character.js'
import { drawScene } from './scene/drawScene.js'
import { getView, SCENE_HEIGHT, SCENE_WIDTH } from './scene/view.js'

// ~30 quadros por segundo: suficiente para pixel art e economiza bateria
const FRAME_INTERVAL = 1000 / 30

// Posição do sprite na área segura, em porcentagem (acompanha a escala da cena)
// O personagem é posicionado pelos pés (feetX), para ficar em cima da sombra.
const SPRITE = CHARACTER_SPRITES.tungTungSahurPiscar
const spriteWidth = SPRITE.frameWidth * CHARACTER_SPOT.scale
const spriteHeight = SPRITE.frameHeight * CHARACTER_SPOT.scale
const CHARACTER_STYLE = {
  left: `${((CHARACTER_SPOT.x - SPRITE.feetX * CHARACTER_SPOT.scale) / SCENE_WIDTH) * 100}%`,
  top: `${((CHARACTER_SPOT.groundY + SPRITE.feetPadding * CHARACTER_SPOT.scale - spriteHeight) / SCENE_HEIGHT) * 100}%`,
  width: `${(spriteWidth / SCENE_WIDTH) * 100}%`,
}

// Cena animada da tela inicial: o cenário é desenhado em um canvas pequeno
// (pixel art) e ampliado pelo CSS; o personagem usa o sprite original por cima.
export default function TitleScene() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    // Quem pede "reduzir movimento" no sistema vê a cena parada
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let view
    let frameId = 0
    let lastFrameTime = -Infinity

    // Ajusta a resolução do canvas ao formato da tela e redesenha na hora
    function resize() {
      view = getView(canvas.clientWidth, canvas.clientHeight)
      canvas.width = view.width
      canvas.height = view.height
      drawScene(context, reduceMotion ? 0 : performance.now() / 1000, view)
    }

    function animate(now) {
      if (now - lastFrameTime >= FRAME_INTERVAL) {
        lastFrameTime = now
        drawScene(context, now / 1000, view)
      }
      frameId = requestAnimationFrame(animate)
    }

    resize()
    window.addEventListener('resize', resize)
    if (!reduceMotion) frameId = requestAnimationFrame(animate)

    // Ao sair da tela inicial, para a animação e o listener
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="title-scene">
      <canvas ref={canvasRef} className="title-scene__canvas" aria-hidden="true" />
      {/* Mesma área segura do canvas, para posicionar o personagem em pixels da cena */}
      <div className="title-scene__stage">
        <CharacterSprite sprite={SPRITE} animated className="title-scene__character" style={CHARACTER_STYLE} />
      </div>
    </div>
  )
}
