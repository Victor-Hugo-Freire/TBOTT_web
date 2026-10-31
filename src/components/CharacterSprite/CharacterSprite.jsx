import { useEffect, useState } from 'react'
import { getFramePosition } from '../../data/characterSprites.js'
import './CharacterSprite.css'

// Mostra um personagem a partir da folha de sprites, sem distorcer os pixels.
// Quem usa define a largura (por className ou style); a altura segue a proporção do quadro.
// - direction: 'down', 'left', 'right' ou 'up' (uma linha da folha)
// - frame: quadro mostrado quando não está animado
// - animated: percorre os quadros da direção. Se o sprite tiver uma sequence
//   (quadro + tempo em ms, como no piscar), segue esses tempos; senão usa fps.
// - label: texto para leitores de tela; sem ele, o sprite é decorativo
export default function CharacterSprite({ sprite, direction = 'down', frame = 0, animated = false, fps = 5, label, className = '', style }) {
  const [currentFrame, setCurrentFrame] = useState(frame)

  useEffect(() => {
    // Quem pede "reduzir movimento" no sistema vê o personagem parado
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!animated || reduceMotion) return

    const steps = sprite.sequence ?? Array.from({ length: sprite.framesPerRow }, (_, index) => ({ frame: index, ms: 1000 / fps }))
    let index = 0
    let timer

    // Espera o tempo do quadro atual e passa para o próximo
    function scheduleNext() {
      timer = setTimeout(() => {
        index = (index + 1) % steps.length
        setCurrentFrame(steps[index].frame)
        scheduleNext()
      }, steps[index].ms)
    }

    scheduleNext()
    return () => clearTimeout(timer)
  }, [animated, fps, sprite])

  const rowCount = Object.keys(sprite.rows).length

  return (
    <div
      className={`character-sprite ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{
        aspectRatio: `${sprite.frameWidth} / ${sprite.frameHeight}`,
        backgroundImage: `url(${sprite.src})`,
        backgroundSize: `${sprite.framesPerRow * 100}% ${rowCount * 100}%`,
        backgroundPosition: getFramePosition(sprite, direction, animated ? currentFrame : frame),
        ...style,
      }}
    />
  )
}
