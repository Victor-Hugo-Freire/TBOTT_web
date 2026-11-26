import { BOSS_PHASES } from '../data/bossBehavior.js'
import { LAST_FLOOR } from './floorGenerator.js'
import { createRandom, mixSeed, pick } from './random.js'

// Chefes (issue #47): quem é o chefe de cada andar e em que fase ele está.
// O chefe em si é um inimigo grande (createBoss, em enemies.js) e age por bossBehaviors.js.
// Funções puras (sem React, sem canvas), para testar com node:test.

const BOSS_SEED = 7300 // separa o sorteio dos chefes dos outros sorteios da run (inimigos 7100 e 7200, itens 9100...)

// O chefe de cada andar da run: [id do andar 1, ..., id do andar 5], ou null no andar sem chefe possível.
// Cada andar sorteia entre os chefes do catálogo que podem aparecer nele (minFloor <= andar <= maxFloor) e que ainda
// não saíram na run. Com os andares do seed da API, isso dá a regra da issue:
// - andares 1 e 2: Cinquecento Turbo, Chimpanzini Bananini, Nonna Lasagnona ou Brr Brr Patapim;
// - andares 3 e 4: Ballerina Cappuccina, Bombardiro Crocodilo, Cappuccino Assassino ou a Nonna, se ela não saiu;
// - andar 5: sempre o Tralalero Tralala (o único com andar 5).
// Os ids são ordenados antes do sorteio: a ordem em que a API manda o catálogo não muda os chefes da run.
// Não vai para o save: sai da seed. bossCatalog = chefes por id (buildBossCatalog); vazio = nenhum andar tem chefe.
export function pickRunBosses(seed, bossCatalog) {
  const random = createRandom(mixSeed(seed, BOSS_SEED))
  const ids = Object.keys(bossCatalog).sort()
  const bosses = []
  for (let floorNumber = 1; floorNumber <= LAST_FLOOR; floorNumber++) {
    const candidates = []
    for (const id of ids) {
      const { minFloor, maxFloor } = bossCatalog[id]
      if (minFloor <= floorNumber && floorNumber <= maxFloor && !bosses.includes(id)) candidates.push(id)
    }
    bosses.push(candidates.length > 0 ? pick(random, candidates) : null)
  }
  return bosses
}

// Fase do chefe: 1 no começo, e mais 1 a cada marca de BOSS_PHASES que a vida já alcançou (vida <= marca).
// Ex.: o Tralalero (marcas 2/3 e 1/3) está na fase 2 com 60% da vida e na fase 3 com 30%.
export function getBossPhase(boss) {
  const marks = BOSS_PHASES[boss.enemyId] ?? []
  let phase = 1
  for (const mark of marks) {
    if (boss.health <= boss.maxHealth * mark) phase += 1
  }
  return phase
}
