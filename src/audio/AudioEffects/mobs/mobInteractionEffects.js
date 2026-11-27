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

export function captureMobAudioState(run) {
  return (run.targets ?? [])
    .filter((target) => MOB_ATTACK_CUE_ANIMATIONS[target.enemyId] && !target.boss && !target.clone)
    .map(({ id, enemyId, animation, health, dead }) => ({ id, enemyId, animation, health, dead }))
}

export function getMobInteractionSounds(previous, next) {
  const previousTargets = new Map(previous.map((target) => [target.id, target]))
  const sounds = []

  for (const target of next) {
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

  return [...new Set(sounds)]
}
