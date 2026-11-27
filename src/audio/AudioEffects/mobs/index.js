import cannoloWarning from './cannolo-carica/avisoAtaque.js'
import cannoloHurt from './cannolo-carica/dano.js'
import cannoloDeath from './cannolo-carica/morte.js'
import cannoloAttack from './cannolo-carica/ataque.js'
import fenicotteroWarning from './fenicottero-fornarino/avisoAtaque.js'
import fenicotteroHurt from './fenicottero-fornarino/dano.js'
import fenicotteroDeath from './fenicottero-fornarino/morte.js'
import fenicotteroAttack from './fenicottero-fornarino/ataque.js'
import formagginoWarning from './formaggino-saltellino/avisoAtaque.js'
import formagginoHurt from './formaggino-saltellino/dano.js'
import formagginoDeath from './formaggino-saltellino/morte.js'
import formagginoAttack from './formaggino-saltellino/ataque.js'
import mokaWarning from './moka-scudiera/avisoAtaque.js'
import mokaHurt from './moka-scudiera/dano.js'
import mokaDeath from './moka-scudiera/morte.js'
import mokaAttack from './moka-scudiera/ataque.js'
import peperoncinoWarning from './peperoncino-kamikaze/avisoAtaque.js'
import peperoncinoHurt from './peperoncino-kamikaze/dano.js'
import peperoncinoDeath from './peperoncino-kamikaze/morte.js'
import peperoncinoAttack from './peperoncino-kamikaze/ataque.js'
import pinguinoWarning from './pinguino-sorbettino/avisoAtaque.js'
import pinguinoHurt from './pinguino-sorbettino/dano.js'
import pinguinoDeath from './pinguino-sorbettino/morte.js'
import pinguinoAttack from './pinguino-sorbettino/ataque.js'
import pistacchioWarning from './pistacchio-sputacchio/avisoAtaque.js'
import pistacchioHurt from './pistacchio-sputacchio/dano.js'
import pistacchioDeath from './pistacchio-sputacchio/morte.js'
import pistacchioAttack from './pistacchio-sputacchio/ataque.js'
import polpettaWarning from './polpetta-sotterranea/avisoAtaque.js'
import polpettaHurt from './polpetta-sotterranea/dano.js'
import polpettaDeath from './polpetta-sotterranea/morte.js'
import polpettaAttack from './polpetta-sotterranea/ataque.js'
import vespinaWarning from './vespina-lambrettina/avisoAtaque.js'
import vespinaHurt from './vespina-lambrettina/dano.js'
import vespinaDeath from './vespina-lambrettina/morte.js'
import vespinaAttack from './vespina-lambrettina/ataque.js'
import zanzarinaWarning from './zanzarina-tarantella/avisoAtaque.js'
import zanzarinaHurt from './zanzarina-tarantella/dano.js'
import zanzarinaDeath from './zanzarina-tarantella/morte.js'
import zanzarinaAttack from './zanzarina-tarantella/ataque.js'

export const MOB_EFFECTS = [
  cannoloWarning, cannoloHurt, cannoloDeath, cannoloAttack,
  fenicotteroWarning, fenicotteroHurt, fenicotteroDeath, fenicotteroAttack,
  formagginoWarning, formagginoHurt, formagginoDeath, formagginoAttack,
  mokaWarning, mokaHurt, mokaDeath, mokaAttack,
  peperoncinoWarning, peperoncinoHurt, peperoncinoDeath, peperoncinoAttack,
  pinguinoWarning, pinguinoHurt, pinguinoDeath, pinguinoAttack,
  pistacchioWarning, pistacchioHurt, pistacchioDeath, pistacchioAttack,
  polpettaWarning, polpettaHurt, polpettaDeath, polpettaAttack,
  vespinaWarning, vespinaHurt, vespinaDeath, vespinaAttack,
  zanzarinaWarning, zanzarinaHurt, zanzarinaDeath, zanzarinaAttack,
]

export function registerMobEffects(audioManager) {
  for (const { name, createSource, options } of MOB_EFFECTS) {
    audioManager.registerEffect(name, createSource, options)
  }
}

export function unregisterMobEffects(audioManager) {
  for (const { name } of MOB_EFFECTS) {
    audioManager.unregisterEffect(name)
  }
}
