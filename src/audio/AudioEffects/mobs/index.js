import cannoloWarning from './cannolo-carica/avisoAtaque.js'
import cannoloHurt from './cannolo-carica/dano.js'
import cannoloDeath from './cannolo-carica/morte.js'
import cannoloAttack from './cannolo-carica/ataque.js'
import cannoloCharge from './cannolo-carica/investida.js'
import cannoloImpact from './cannolo-carica/impacto.js'
import fenicotteroWarning from './fenicottero-fornarino/avisoAtaque.js'
import fenicotteroHurt from './fenicottero-fornarino/dano.js'
import fenicotteroDeath from './fenicottero-fornarino/morte.js'
import fenicotteroAttack from './fenicottero-fornarino/ataque.js'
import fenicotteroThrow from './fenicottero-fornarino/lancamento.js'
import fenicotteroFlight from './fenicottero-fornarino/voo.js'
import fenicotteroLanding from './fenicottero-fornarino/pouso.js'
import formagginoWarning from './formaggino-saltellino/avisoAtaque.js'
import formagginoHurt from './formaggino-saltellino/dano.js'
import formagginoDeath from './formaggino-saltellino/morte.js'
import formagginoAttack from './formaggino-saltellino/ataque.js'
import formagginoBite from './formaggino-saltellino/mordida.js'
import formagginoLanding from './formaggino-saltellino/pouso.js'
import mokaWarning from './moka-scudiera/avisoAtaque.js'
import mokaHurt from './moka-scudiera/dano.js'
import mokaDeath from './moka-scudiera/morte.js'
import mokaAttack from './moka-scudiera/ataque.js'
import mokaShield from './moka-scudiera/escudo.js'
import mokaRing from './moka-scudiera/anel.js'
import peperoncinoWarning from './peperoncino-kamikaze/avisoAtaque.js'
import peperoncinoHurt from './peperoncino-kamikaze/dano.js'
import peperoncinoDeath from './peperoncino-kamikaze/morte.js'
import peperoncinoAttack from './peperoncino-kamikaze/ataque.js'
import peperoncinoExplosion from './peperoncino-kamikaze/explosao.js'
import pinguinoWarning from './pinguino-sorbettino/avisoAtaque.js'
import pinguinoHurt from './pinguino-sorbettino/dano.js'
import pinguinoDeath from './pinguino-sorbettino/morte.js'
import pinguinoAttack from './pinguino-sorbettino/ataque.js'
import pinguinoSlide from './pinguino-sorbettino/deslize.js'
import pinguinoIce from './pinguino-sorbettino/gelo.js'
import pinguinoImpact from './pinguino-sorbettino/impacto.js'
import pinguinoLanding from './pinguino-sorbettino/pouso.js'
import pistacchioWarning from './pistacchio-sputacchio/avisoAtaque.js'
import pistacchioHurt from './pistacchio-sputacchio/dano.js'
import pistacchioDeath from './pistacchio-sputacchio/morte.js'
import pistacchioAttack from './pistacchio-sputacchio/ataque.js'
import pistacchioLaunch from './pistacchio-sputacchio/lancamento.js'
import pistacchioImpact from './pistacchio-sputacchio/impacto.js'
import polpettaWarning from './polpetta-sotterranea/avisoAtaque.js'
import polpettaHurt from './polpetta-sotterranea/dano.js'
import polpettaDeath from './polpetta-sotterranea/morte.js'
import polpettaAttack from './polpetta-sotterranea/ataque.js'
import polpettaBite from './polpetta-sotterranea/mordida.js'
import polpettaSink from './polpetta-sotterranea/afundar.js'
import vespinaWarning from './vespina-lambrettina/avisoAtaque.js'
import vespinaHurt from './vespina-lambrettina/dano.js'
import vespinaDeath from './vespina-lambrettina/morte.js'
import vespinaAttack from './vespina-lambrettina/ataque.js'
import vespinaMotor from './vespina-lambrettina/motor.js'
import vespinaDive from './vespina-lambrettina/mergulho.js'
import vespinaCurve from './vespina-lambrettina/curva.js'
import vespinaImpact from './vespina-lambrettina/impacto.js'
import zanzarinaWarning from './zanzarina-tarantella/avisoAtaque.js'
import zanzarinaHurt from './zanzarina-tarantella/dano.js'
import zanzarinaDeath from './zanzarina-tarantella/morte.js'
import zanzarinaAttack from './zanzarina-tarantella/ataque.js'
import zanzarinaDive from './zanzarina-tarantella/mergulho.js'

export const MOB_EFFECTS = [
  cannoloWarning, cannoloHurt, cannoloDeath, cannoloAttack, cannoloCharge, cannoloImpact,
  fenicotteroWarning, fenicotteroHurt, fenicotteroDeath, fenicotteroAttack,
  fenicotteroThrow, fenicotteroFlight, fenicotteroLanding,
  formagginoWarning, formagginoHurt, formagginoDeath, formagginoAttack,
  formagginoBite, formagginoLanding,
  mokaWarning, mokaHurt, mokaDeath, mokaAttack, mokaShield, mokaRing,
  peperoncinoWarning, peperoncinoHurt, peperoncinoDeath, peperoncinoAttack, peperoncinoExplosion,
  pinguinoWarning, pinguinoHurt, pinguinoDeath, pinguinoAttack, pinguinoSlide, pinguinoIce,
  pinguinoImpact, pinguinoLanding,
  pistacchioWarning, pistacchioHurt, pistacchioDeath, pistacchioAttack, pistacchioLaunch, pistacchioImpact,
  polpettaWarning, polpettaHurt, polpettaDeath, polpettaAttack, polpettaBite, polpettaSink,
  vespinaWarning, vespinaHurt, vespinaDeath, vespinaAttack, vespinaMotor, vespinaDive, vespinaCurve,
  vespinaImpact,
  zanzarinaWarning, zanzarinaHurt, zanzarinaDeath, zanzarinaAttack, zanzarinaDive,
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
