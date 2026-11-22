// Vida do personagem, em funções puras (sem React, sem canvas), para testar.
// A vida é contada em MEIOS corações: 6 = 3 corações cheios. Assim meio coração é sempre um número inteiro.
// A vida máxima é um atributo do personagem (6 no Tung, veja characterStats.js), e os itens podem mudá-la (stats.js).

// Quanto cada tipo de golpe tira:
// - leve: batida de inimigo e obstáculo que machuca (a chapa quente) = meio coração;
// - pesado: explosões e ataques mais fortes = 1 coração inteiro.
export const DAMAGE_LIGHT = 1
export const DAMAGE_HEAVY = 2

// Vida depois de levar `amount` de dano: nunca fica abaixo de 0
export function applyDamage(health, amount) {
  return Math.max(0, health - amount)
}

// Vida válida: inteiro de 0 a maxHealth. Qualquer outra coisa (ou save antigo, sem vida) = vida cheia.
// Vida acima do máximo (a vida máxima diminuiu) também vira o máximo.
export function normalizeHealth(value, maxHealth) {
  return Number.isInteger(value) && value >= 0 && value <= maxHealth ? value : maxHealth
}

// Estado de cada coração do HUD, da esquerda para a direita: 'full', 'half' ou 'empty'.
// maxHealth = vida máxima atual (2 meios corações por coração).
// Ex.: vida 3 (um coração e meio) com máximo 6 = ['full', 'half', 'empty'].
export function getHeartStates(health, maxHealth) {
  const states = []
  for (let heart = 0; heart < maxHealth / 2; heart++) {
    const remaining = health - heart * 2
    states.push(remaining >= 2 ? 'full' : remaining === 1 ? 'half' : 'empty')
  }
  return states
}

// O que matou o personagem, para o aviso de morte. A causa é o id do obstáculo ou do inimigo (e, depois, do chefe).
// O texto completa a frase "O Tung Tung morreu para ...".
const DEATH_CAUSES = {
  chapa: 'a chapa quente',
  cacos: 'os cacos de vidro', // do garrafão quebrado
  tralalero: 'o Tralalero', // puxado para a poça da Sala do Pacto
  'poca-tralalero': 'a poça do Tralalero', // caiu sozinho na poça, com a barbatana longe
  // Inimigos (a causa é o id do inimigo: encostar, ataque ou projétil dele)
  'cannolo-carica': 'o Cannolo Carica',
  'fenicottero-fornarino': 'o Fenicottero Fornarino',
  'formaggino-saltellino': 'o Formaggino Saltellino',
  'moka-scudiera': 'a Moka Scudiera',
  'peperoncino-kamikaze': 'o Peperoncino Kamikaze',
  'pinguino-sorbettino': 'o Pinguino Sorbettino',
  'pistacchio-sputacchio': 'o Pistacchio Sputacchio',
  'polpetta-sotterranea': 'a Polpetta Sotterranea',
  'vespina-lambrettina': 'a Vespina Lambrettina',
  'zanzarina-tarantella': 'a Zanzarina Tarantella',
}

export function getDeathCauseLabel(cause) {
  return DEATH_CAUSES[cause] ?? 'um perigo da sala'
}
