export const BOSS_ATTACK_CUE_ANIMATIONS = {
  'cinquecento-turbo': ['atacando', 'preparando-investida', 'investida'],
  'tralalero-tralala': ['preparando-investida', 'investida', 'atacando', 'canto-tralala', 'pauta', 'salto-mergulho'],
  'chimpanzini-bananini': ['atacando'],
  'nonna-lasagnona': ['atacando', 'invocar'],
  'brr-brr-patapim': ['atacando', 'raizes'],
  'ballerina-cappuccina': ['pirueta', 'atacando'],
  'bombardiro-crocodilo': ['atacando'],
  'cappuccino-assassino': ['teleporte', 'atacando', 'clones'],
}

export const BOSS_ATTACK_SOUND_CUES = {
  'cinquecento-turbo': ['aviso', 'investida', 'impacto', 'buzina', 'vulneravel'],
  'tralalero-tralala': ['investida', 'canto', 'pauta', 'mergulho', 'respingo', 'mordida', 'impacto', 'vulneravel', 'fase2', 'fase3'],
  'chimpanzini-bananini': ['banana', 'casca', 'fase2'],
  'nonna-lasagnona': ['colherada', 'invocar', 'camada'],
  'brr-brr-patapim': ['pisao', 'raizes'],
  'ballerina-cappuccina': ['pirueta', 'impacto', 'vulneravel', 'gotas'],
  'bombardiro-crocodilo': ['bomba', 'explosao', 'pouso'],
  'cappuccino-assassino': ['corte', 'teleporte', 'clones', 'clone-dano', 'clone-dissolver'],
}

export function captureBossAudioState(run) {
  return {
    targets: (run.targets ?? [])
      .filter((target) => target.boss && !target.clone)
      .map(({ id, enemyId, animation, health, dead }) => ({ id, enemyId, animation, health, dead })),
    clones: (run.targets ?? [])
      .filter((target) => target.clone && target.enemyId === 'cappuccino-assassino')
      .map(({ id, health, dead }) => ({ id, health, dead })),
    playerHit: run.player?.lastDamageEvent ?? null,
    bossEvents: run.bossEvents ?? [],
    bossEventSequence: run.bossEventSequence ?? 0,
  }
}

export function getBossInteractionSounds(previous, next) {
  const previousTargets = new Map(previous.targets.map((target) => [target.id, target]))
  const sounds = []

  for (const target of next.targets) {
    const before = previousTargets.get(target.id)
    if (!before || before.enemyId !== target.enemyId || before.dead) continue

    if (target.dead) {
      sounds.push(`boss-${target.enemyId}-morte`)
      continue
    }
    if (target.health < before.health) sounds.push(`boss-${target.enemyId}-dano`)
    if (target.animation !== before.animation &&
      BOSS_ATTACK_CUE_ANIMATIONS[target.enemyId]?.includes(target.animation)) {
      sounds.push(`boss-${target.enemyId}-aviso`)
    }
  }

  const previousClones = new Map((previous.clones ?? []).map((clone) => [clone.id, clone]))
  for (const clone of next.clones ?? []) {
    const before = previousClones.get(clone.id)
    if (!before || before.dead) continue
    if (clone.dead) sounds.push('boss-cappuccino-assassino-clone-dissolver')
    else if (clone.health < before.health) sounds.push('boss-cappuccino-assassino-clone-dano')
  }

  if (next.playerHit?.sequence !== previous.playerHit?.sequence &&
    BOSS_ATTACK_SOUND_CUES[next.playerHit?.cause]) {
    sounds.push(`boss-${next.playerHit.cause}-ataque`)
  }

  for (const event of next.bossEvents) {
    if (event.sequence <= previous.bossEventSequence) continue
    if (!BOSS_ATTACK_SOUND_CUES[event.enemyId]?.includes(event.cue)) continue
    sounds.push(`boss-${event.enemyId}-${event.cue}`)
  }

  return [...new Set(sounds)]
}
