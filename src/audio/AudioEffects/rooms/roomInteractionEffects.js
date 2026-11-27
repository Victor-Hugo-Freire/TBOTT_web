const DRUM_LAND_MS = 550

export function captureRoomAudioState(run) {
  const room = run.floor.rooms.find(({ id }) => id === run.roomId)
  return {
    roomId: run.roomId,
    roomType: room?.type ?? null,
    hits: room?.hits ?? 0,
    cleared: Boolean(room?.cleared),
    plays: room?.plays ?? 0,
    emptied: room ? [...room.emptied] : [],
    itemCount: run.items?.length ?? 0,
    drops: room ? room.drops.map(({ kind, amount, x, y }) => ({ kind, amount, x, y })) : [],
    obstacles: run.obstacles.map(({ id, kind, mechanic, removed, rolling }) => ({
      id,
      kind,
      mechanic,
      removed: Boolean(removed),
      rolling: Boolean(rolling),
    })),
    unlocking: Boolean(run.unlocking),
    arcadeSpinning: Boolean(run.arcadeSpin),
    roomTransition: run.transition?.type === 'room',
    drumElapsedMs: run.drumDrop?.elapsedMs ?? null,
    sleeping: Boolean(run.sleep),
  }
}

export function getRoomInteractionSounds(previous, next) {
  if (!previous || !next) return []

  const sounds = []
  const sameRoom = previous.roomId === next.roomId

  if (sameRoom) {
    const previousObstacles = new Map(previous.obstacles.map((obstacle) => [obstacle.id, obstacle]))
    for (const obstacle of next.obstacles) {
      const before = previousObstacles.get(obstacle.id)
      if (!before) continue

      if (before.mechanic === 'quebravel' && !before.removed &&
        (obstacle.removed || obstacle.mechanic === 'cacos')) {
        sounds.push(before.kind === 'garrafao' ? 'room-glass-break' : 'room-object-break')
      } else if (before.mechanic === 'rolante') {
        if (!before.rolling && obstacle.rolling) sounds.push('room-object-roll')
        if (obstacle.rolling && obstacle.removed && !before.removed) sounds.push('room-object-impact')
      }
    }

    if (next.hits > previous.hits) {
      sounds.push(next.roomType === 'chefe' ? 'room-drum-hit' : 'room-wall-hit')
    }
    if (!previous.cleared && next.cleared) sounds.push('room-door-open')
    if (!previous.unlocking && next.unlocking) sounds.push('room-door-unlock')
    if (next.plays > previous.plays) sounds.push('room-arcade-spin')
    if (next.itemCount === previous.itemCount &&
      next.emptied.some((id) => !previous.emptied.includes(id))) sounds.push('room-pickup')
    if (hasCollectedDrop(previous.drops, next.drops)) sounds.push('room-pickup')
    if (previous.arcadeSpinning && !next.arcadeSpinning) sounds.push('room-arcade-result')
    if (!previous.sleeping && next.sleeping) sounds.push('room-rest')

    const drumLanded = previous.drumElapsedMs !== null &&
      previous.drumElapsedMs < DRUM_LAND_MS &&
      (next.drumElapsedMs === null || next.drumElapsedMs >= DRUM_LAND_MS)
    if (drumLanded) sounds.push('room-drum-land')
  }

  if (!previous.roomTransition && next.roomTransition) sounds.push('room-door-open')
  return [...new Set(sounds)]
}

function hasCollectedDrop(previousDrops, nextDrops) {
  const remaining = nextDrops.map((drop) => `${drop.kind}:${drop.amount}:${drop.x}:${drop.y}`)
  for (const drop of previousDrops) {
    const key = `${drop.kind}:${drop.amount}:${drop.x}:${drop.y}`
    const index = remaining.indexOf(key)
    if (index === -1) return true
    remaining.splice(index, 1)
  }
  return false
}
