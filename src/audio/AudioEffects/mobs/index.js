import cannoloWarning from './cannolo-carica/avisoAtaque.js'
import cannoloHurt from './cannolo-carica/dano.js'
import cannoloDeath from './cannolo-carica/morte.js'
import fenicotteroWarning from './fenicottero-fornarino/avisoAtaque.js'
import fenicotteroHurt from './fenicottero-fornarino/dano.js'
import fenicotteroDeath from './fenicottero-fornarino/morte.js'
import formagginoWarning from './formaggino-saltellino/avisoAtaque.js'
import formagginoHurt from './formaggino-saltellino/dano.js'
import formagginoDeath from './formaggino-saltellino/morte.js'
import mokaWarning from './moka-scudiera/avisoAtaque.js'
import mokaHurt from './moka-scudiera/dano.js'
import mokaDeath from './moka-scudiera/morte.js'
import peperoncinoWarning from './peperoncino-kamikaze/avisoAtaque.js'
import peperoncinoHurt from './peperoncino-kamikaze/dano.js'
import peperoncinoDeath from './peperoncino-kamikaze/morte.js'
import pinguinoWarning from './pinguino-sorbettino/avisoAtaque.js'
import pinguinoHurt from './pinguino-sorbettino/dano.js'
import pinguinoDeath from './pinguino-sorbettino/morte.js'
import pistacchioWarning from './pistacchio-sputacchio/avisoAtaque.js'
import pistacchioHurt from './pistacchio-sputacchio/dano.js'
import pistacchioDeath from './pistacchio-sputacchio/morte.js'
import polpettaWarning from './polpetta-sotterranea/avisoAtaque.js'
import polpettaHurt from './polpetta-sotterranea/dano.js'
import polpettaDeath from './polpetta-sotterranea/morte.js'
import vespinaWarning from './vespina-lambrettina/avisoAtaque.js'
import vespinaHurt from './vespina-lambrettina/dano.js'
import vespinaDeath from './vespina-lambrettina/morte.js'
import zanzarinaWarning from './zanzarina-tarantella/avisoAtaque.js'
import zanzarinaHurt from './zanzarina-tarantella/dano.js'
import zanzarinaDeath from './zanzarina-tarantella/morte.js'

export const MOB_EFFECTS = [
  cannoloWarning, cannoloHurt, cannoloDeath,
  fenicotteroWarning, fenicotteroHurt, fenicotteroDeath,
  formagginoWarning, formagginoHurt, formagginoDeath,
  mokaWarning, mokaHurt, mokaDeath,
  peperoncinoWarning, peperoncinoHurt, peperoncinoDeath,
  pinguinoWarning, pinguinoHurt, pinguinoDeath,
  pistacchioWarning, pistacchioHurt, pistacchioDeath,
  polpettaWarning, polpettaHurt, polpettaDeath,
  vespinaWarning, vespinaHurt, vespinaDeath,
  zanzarinaWarning, zanzarinaHurt, zanzarinaDeath,
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
