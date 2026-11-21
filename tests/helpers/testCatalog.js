import { buildItemCatalog } from '../../src/utils/itemCatalog.js'

// Catálogo de teste no formato de GET /api/catalog, com as salas e os efeitos do seed 0002_items.sql da API,
// na ordem da API (por nome). Os testes não dependem da API nem do banco.
const ITEMS = [
  {
    id: 'batuta-do-maestro',
    name: 'Batuta do Maestro',
    rarity: 'incomum',
    roomTypes: ['palco'],
    effect: { trigger: 'golpe-no-ritmo', rhythmWindowMs: 150, extraDamage: 1, comboHits: 4, waveRange: 80 },
  },
  {
    id: 'cafe-duplo',
    name: 'Café Duplo',
    rarity: 'comum',
    roomTypes: ['tesouro'],
    effect: { trigger: 'levar-dano', speedMultiplier: 1.05, boostSpeedMultiplier: 1.4, boostDurationMs: 3000 },
  },
  {
    id: 'caldo-da-mamae',
    name: 'Caldo da Mamãe',
    rarity: 'especial',
    roomTypes: ['god'],
    effect: { trigger: 'entrar-em-sala', blockedHitsPerRoom: 1, healAtHealth: 2, healAmount: 4, healsPerFloor: 1 },
  },
  { id: 'chifre-da-sorte', name: 'Chifre da Sorte', rarity: 'incomum', roomTypes: ['fliperama'], effect: { trigger: 'abate', extraCoinChance: 0.1 } },
  {
    id: 'concha-longa',
    name: 'Concha Longa',
    rarity: 'comum',
    roomTypes: ['tesouro'],
    effect: { trigger: 'golpe-acerta', puddleDurationMs: 2000, enemySpeedMultiplier: 0.5 },
  },
  {
    id: 'dente-de-tubarao',
    name: 'Dente de Tubarão',
    rarity: 'especial',
    roomTypes: ['pacto'],
    effect: {
      trigger: 'abate',
      attackSpeedBonus: 0.15,
      maxAttackSpeedBonus: 0.3,
      bonusDurationMs: 4000,
      maxStacks: 3,
      lowHealthDamageMultiplier: 2,
      maxHealthCost: 2,
    },
  },
  {
    id: 'elixir-eletrico',
    name: 'Elixir Elétrico',
    rarity: 'raro',
    roomTypes: ['adega'],
    effect: { trigger: 'terceiro-golpe-seguido', extraDamage: 2, chainTargets: 2, chainRange: 120, chainDamage: 1 },
  },
  { id: 'mucarela', name: 'Muçarela', rarity: 'incomum', roomTypes: ['tesouro'], effect: { trigger: 'golpe-acerta', stunDurationMs: 800 } },
  {
    id: 'palitos-de-pao',
    name: 'Palitos de Pão',
    rarity: 'comum',
    roomTypes: ['tesouro'],
    effect: { trigger: 'quarto-golpe', attackSpeedBonus: 0.4, pushRange: 60 },
  },
  {
    id: 'parmesao-curado',
    name: 'Parmesão Curado',
    rarity: 'comum',
    roomTypes: ['tesouro'],
    effect: { trigger: 'golpe', shards: 3, shardDamage: 1 },
  },
  {
    id: 'rolo-de-bronze',
    name: 'Rolo de Bronze',
    rarity: 'incomum',
    roomTypes: ['chefe'],
    effect: { trigger: 'golpe-acerta', pushDistance: 120, wallExtraDamage: 2 },
  },
  {
    id: 'tiramisu',
    name: 'Tiramisu',
    rarity: 'incomum',
    roomTypes: ['loja'],
    price: 15,
    effect: { trigger: 'golpe-acerta', attackSpeedBonus: 0.25, moveSpeedMultiplier: 1.2, bonusDurationMs: 2000 },
  },
]

export const TEST_CATALOG = buildItemCatalog(ITEMS).items
export const TREASURE_ITEMS = ['cafe-duplo', 'concha-longa', 'mucarela', 'palitos-de-pao', 'parmesao-curado']
