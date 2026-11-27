import glassBreak from './quebraGarrafao.js'
import objectBreak from './quebraObjeto.js'
import objectRoll from './objetoRolando.js'
import drumHit from './batidaTambor.js'
import wallHit from './batidaParede.js'
import doorUnlock from './destravaPorta.js'
import doorOpen from './abrePorta.js'
import drumLand from './quedaTambor.js'
import pickup from './coletaItem.js'
import arcadeSpin from './fliperama.js'
import arcadeResult from './resultadoFliperama.js'
import objectImpact from './impactoObjeto.js'
import rest from './descanso.js'

export const ROOM_INTERACTION_EFFECTS = [
  glassBreak,
  objectBreak,
  objectRoll,
  drumHit,
  wallHit,
  doorUnlock,
  doorOpen,
  drumLand,
  pickup,
  arcadeSpin,
  arcadeResult,
  objectImpact,
  rest,
]

export function registerRoomInteractionEffects(audioManager) {
  for (const { name, createSource, options } of ROOM_INTERACTION_EFFECTS) {
    audioManager.registerEffect(name, createSource, options)
  }
}

export function unregisterRoomInteractionEffects(audioManager) {
  for (const { name } of ROOM_INTERACTION_EFFECTS) {
    audioManager.unregisterEffect(name)
  }
}
