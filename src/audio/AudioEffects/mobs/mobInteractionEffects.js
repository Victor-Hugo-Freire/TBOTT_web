export const MOB_ATTACK_CUE_ANIMATIONS = {
  'cannolo-carica': ['preparando'],
  'fenicottero-fornarino': ['atacando'],
  'formaggino-saltellino': ['atacando'],
  'moka-scudiera': ['atacando', 'escudo'],
  'peperoncino-kamikaze': ['aceso'],
  'pinguino-sorbettino': ['atacando'],
  'pistacchio-sputacchio': ['atacando'],
  'polpetta-sotterranea': ['emergindo'],
  'vespina-lambrettina': ['acelerando'],
  'zanzarina-tarantella': ['atacando'],
}

export const MOB_ATTACK_SOUND_CUES = {
  'cannolo-carica': ['investida', 'impacto'],
  'fenicottero-fornarino': ['lancamento', 'voo', 'pouso'],
  'formaggino-saltellino': ['mordida', 'pouso'],
  'moka-scudiera': ['escudo', 'anel'],
  'peperoncino-kamikaze': ['explosao'],
  'pinguino-sorbettino': ['deslize', 'gelo', 'impacto', 'pouso'],
  'pistacchio-sputacchio': ['lancamento', 'impacto'],
  'polpetta-sotterranea': ['mordida', 'afundar'],
  'vespina-lambrettina': ['motor', 'mergulho', 'curva', 'impacto'],
  'zanzarina-tarantella': ['mergulho'],
}

export function captureMobAudioState(run) {
  return {
    targets: (run.targets ?? [])
      .filter((target) => MOB_ATTACK_CUE_ANIMATIONS[target.enemyId] && !target.boss && !target.clone)
      .map(({ id, enemyId, animation, health, dead }) => ({ id, enemyId, animation, health, dead })),
    playerHit: run.player?.lastDamageEvent ?? null,
    mobEvents: run.mobEvents ?? [],
    mobEventSequence: run.mobEventSequence ?? 0,
  }
}

export function getMobInteractionSounds(previous, next) {
  const previousTargets = new Map(previous.targets.map((target) => [target.id, target]))
  const sounds = []

  for (const target of next.targets) {
    const before = previousTargets.get(target.id)
    if (!before || before.enemyId !== target.enemyId || before.dead) continue

    if (target.dead) {
      sounds.push(`mob-${target.enemyId}-morte`)
      continue
    }
    if (target.health < before.health) sounds.push(`mob-${target.enemyId}-dano`)
    if (target.animation !== before.animation &&
      MOB_ATTACK_CUE_ANIMATIONS[target.enemyId]?.includes(target.animation)) {
      sounds.push(`mob-${target.enemyId}-aviso`)
    }
  }

  if (next.playerHit?.sequence !== previous.playerHit?.sequence &&
    MOB_ATTACK_CUE_ANIMATIONS[next.playerHit?.cause]) {
    sounds.push(`mob-${next.playerHit.cause}-ataque`)
  }

  for (const event of next.mobEvents) {
    if (event.sequence <= previous.mobEventSequence) continue
    if (!MOB_ATTACK_SOUND_CUES[event.enemyId]?.includes(event.cue)) continue
    sounds.push(`mob-${event.enemyId}-${event.cue}`)
  }

  return [...new Set(sounds)]
}
