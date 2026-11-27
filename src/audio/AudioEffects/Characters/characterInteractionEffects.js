import { WALK_CYCLE_DISTANCE } from '../../../utils/spriteAnimation.js'

const CHARACTER_ID = 'tung-tung-sahur'
const SOUND_PREFIX = 'character-tung-tung-sahur'
const STEP_DISTANCE = WALK_CYCLE_DISTANCE / 2
const ITEM_AUDIO_CUES = {
  'caldo-da-mamae': { escudo: 'escudo', cura: 'cura' },
  'cafe-duplo': { impulso: 'cafe-impulso' },
  tiramisu: { ativacao: 'tiramisu' },
  'concha-longa': { poca: 'concha-poca' },
  'parmesao-curado': {
    lancamento: 'parmesao-lancamento',
    impacto: 'parmesao-impacto',
  },
  'dente-de-tubarao': { frenesi: 'dente-frenesi' },
}

export function captureCharacterAudioState(run) {
  const player = run.player ?? {}
  return {
    characterId: run.characterId,
    walkDistance: player.walkDistance ?? 0,
    swingCount: run.effects?.swingCount ?? 0,
    hitIds: run.swing?.hitIds ?? [],
    damageSequence: player.lastDamageEvent?.sequence ?? 0,
    dead: Boolean(run.death),
    itemCount: run.items?.length ?? 0,
    itemFlashes: (run.flashes ?? [])
      .filter(({ itemId, elapsedMs }) => itemId && elapsedMs === 0)
      .map(({ itemId, variant, targetId }) => `${itemId}:${variant}:${targetId ?? ''}`),
    itemAudioEvents: run.itemAudioEvents ?? [],
    itemAudioEventSequence: run.itemAudioEventSequence ?? 0,
  }
}

export function getCharacterInteractionSounds(previous, next) {
  if (!previous || !next ||
    previous.characterId !== CHARACTER_ID || next.characterId !== CHARACTER_ID) return []

  if (!previous.dead && next.dead) return [`${SOUND_PREFIX}-morte`]

  const sounds = []
  const previousStep = Math.floor(previous.walkDistance / STEP_DISTANCE)
  const nextStep = Math.floor(next.walkDistance / STEP_DISTANCE)
  if (next.walkDistance > previous.walkDistance && nextStep > previousStep) {
    sounds.push(`${SOUND_PREFIX}-passo`)
  }
  if (next.swingCount > previous.swingCount) sounds.push(`${SOUND_PREFIX}-ataque`)
  if (next.hitIds.some((id) => !previous.hitIds.includes(id))) {
    sounds.push(`${SOUND_PREFIX}-acerto`)
  }
  if (next.damageSequence > previous.damageSequence) sounds.push(`${SOUND_PREFIX}-dano`)
  if (next.itemCount > previous.itemCount) sounds.push(`${SOUND_PREFIX}-item-coleta`)

  const previousItemFlashes = new Set(previous.itemFlashes)
  if (next.itemFlashes.some((flash) => !previousItemFlashes.has(flash))) {
    sounds.push(`${SOUND_PREFIX}-item-efeito`)
  }

  for (const event of next.itemAudioEvents) {
    if (event.sequence <= previous.itemAudioEventSequence) continue
    const cue = ITEM_AUDIO_CUES[event.itemId]?.[event.cue]
    if (cue) sounds.push(`${SOUND_PREFIX}-item-${cue}`)
  }

  return [...new Set(sounds)]
}
