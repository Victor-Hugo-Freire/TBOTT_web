// Números da economia do jogo (grãos de café, garfos e corações), num lugar só para ajustar.
// Regra do Victor: grão, garfo e coração no chão só aparecem como recompensa da sala limpa ou no chão das Adegas
// (obstáculos quebrados não soltam nada). A Loja vende e o Fliperama sorteia.

// Recompensa ao eliminar todos os inimigos da sala. Não é garantida; as chances somam 1.
export const ROOM_REWARD_CHANCES = { nada: 0.4, graos: 0.3, coracao: 0.15, garfo: 0.15 }

// Quando a recompensa é grão: o tamanho do grupo (só existem desenhos de 1, 3 e 5 grãos). As chances somam 1.
export const GRAIN_GROUP_CHANCES = [
  { amount: 1, chance: 0.6 },
  { amount: 3, chance: 0.3 },
  { amount: 5, chance: 0.1 },
]

// Coração no chão (e o da Loja): só cura, até isto, em meios corações (2 = 1 coração). Não aumenta a vida máxima.
export const HEART_HEAL = 2

// Adega: no chão, sempre um grupo de grãos e um garfo
export const CELLAR_GRAINS = 3

// Loja: preço, em grãos, do garfo e do coração (o item tem o preço do catálogo da API: o Tiramisu custa 15)
export const SHOP_PRICES = { garfo: 7, coracao: 5 }

// Fliperama: a porta abre pagando grão; cada jogada no tambor custa grãos e gira por um tempo antes do prêmio
export const ARCADE_DOOR_PRICE = 1
export const ARCADE_PLAY_PRICE = 1
export const ARCADE_SPIN_MS = 1000
// Prêmio da jogada. As chances somam 1. "item" = o item do Fliperama (Chifre da Sorte), só um por run:
// depois que ele já saiu, esse prêmio vira ARCADE_ITEM_REPEAT_GRAINS grãos.
export const ARCADE_PRIZE_CHANCES = { item: 0.15, graos: 0.25, garfo: 0.15, nada: 0.45 }
export const ARCADE_GRAIN_PRIZE = 3
export const ARCADE_ITEM_REPEAT_GRAINS = 5

// Aviso curto em cima do Tung ("Faltam grãos", "Vida cheia"...): tempo na tela
export const NOTICE_MS = 1400

// Limites do progresso salvo
export const MAX_GRAINS = 99

// Nome e descrição do garfo e do coração da Loja (a caixa de descrição perto do pedestal)
export const CONSUMABLE_INFO = {
  garfo: { name: 'Garfo', description: 'Abre uma sala trancada com o nó de espaguete.' },
  coracao: { name: 'Coração', description: 'Cura 1 coração.' },
}
