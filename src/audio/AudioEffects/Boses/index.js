import cinquecento from './cinquecento-turbo/index.js'
import tralalero from './tralalero-tralala/index.js'
import chimpanzini from './chimpanzini-bananini/index.js'
import nonna from './nonna-lasagnona/index.js'
import patapim from './brr-brr-patapim/index.js'
import ballerina from './ballerina-cappuccina/index.js'
import bombardiro from './bombardiro-crocodilo/index.js'
import cappuccino from './cappuccino-assassino/index.js'

export const BOSS_EFFECTS = [
  ...cinquecento,
  ...tralalero,
  ...chimpanzini,
  ...nonna,
  ...patapim,
  ...ballerina,
  ...bombardiro,
  ...cappuccino,
]

export function registerBossEffects(audioManager) {
  for (const { name, createSource, options } of BOSS_EFFECTS) {
    audioManager.registerEffect(name, createSource, options)
  }
}

export function unregisterBossEffects(audioManager) {
  for (const { name } of BOSS_EFFECTS) {
    audioManager.unregisterEffect(name)
  }
}
