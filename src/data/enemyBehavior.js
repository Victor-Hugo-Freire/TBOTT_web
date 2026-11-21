// Números dos inimigos que não estão no catálogo da API. A tabela enemies só tem vida, dano, velocidade e
// andar mínimo; o resto (tamanho do corpo e, depois, alcance, recarga e projéteis) fica aqui, como em economy.js.

// Caixa do corpo de cada inimigo, em unidades da sala, do pé até o alto da cabeça: é nela que o golpe acerta.
// Medida na parte opaca do quadro 0 da animação "parado" (pernas + tronco @1x, com o contorno).
export const ENEMY_BODIES = {
  'cannolo-carica': { width: 82, height: 107 },
  'fenicottero-fornarino': { width: 108, height: 136 },
  'formaggino-saltellino': { width: 131, height: 107 },
  'moka-scudiera': { width: 121, height: 121 },
  'peperoncino-kamikaze': { width: 92, height: 109 },
  'pinguino-sorbettino': { width: 105, height: 135 },
  'pistacchio-sputacchio': { width: 88, height: 105 },
  'polpetta-sotterranea': { width: 125, height: 97 },
  'vespina-lambrettina': { width: 117, height: 122 },
  'zanzarina-tarantella': { width: 139, height: 107 },
}

// Encostar machuca (decisão do Victor, 2026-11-21). A área de contato fica no chão, em volta dos pés do inimigo:
// passar por trás dele (a cabeça) não machuca. Largura = esta fração da largura do corpo (sem o contorno e as pontas).
export const CONTACT_WIDTH_SHARE = 0.7
export const CONTACT_DEPTH = 36 // u para trás dos pés
