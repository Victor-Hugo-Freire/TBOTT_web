import { buildBossCatalog, buildEnemyCatalog, buildItemCatalog } from '../../src/utils/itemCatalog.js'

// Catálogo de teste no formato de GET /api/catalog, com as salas e os efeitos do seed 0002_items.sql da API,
// na ordem da API (por nome). Os testes não dependem da API nem do banco.
const ITEMS = [
  {
    id: 'batuta-do-maestro',
    name: 'Batuta do Maestro',
    rarity: 'incomum',
    roomTypes: ['palco'],
    effect: { trigger: 'golpe-no-ritmo', rhythmWindowMs: 150, extraDamage: 1, comboHits: 4, waveRange: 80, invincibilityBonusMs: 200 },
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
    effect: { trigger: 'golpe-acerta', puddleDurationMs: 2000, enemySpeedMultiplier: 0.5, attackAreaMultiplier: 1.3 },
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
    effect: {
      trigger: 'terceiro-golpe-seguido',
      extraDamage: 2,
      chainTargets: 2,
      chainRange: 120,
      chainDamage: 1,
      speedMultiplier: 1.1,
      attackSpeedBonus: 0.11,
    },
  },
  {
    id: 'mucarela',
    name: 'Muçarela',
    rarity: 'incomum',
    roomTypes: ['tesouro'],
    effect: { trigger: 'golpe-acerta', stunDurationMs: 800, restunDelayMs: 2000, maxHealthBonus: 2 },
  },
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

// Inimigos no formato de GET /api/catalog, com os números do seed 0003_enemies.sql da API (na ordem da API:
// andar mínimo e depois nome)
const ENEMIES = [
  { id: 'formaggino-saltellino', name: 'Formaggino Saltellino', health: 6, damage: 1, speed: 150, behavior: 'perseguir', minFloor: 1 },
  { id: 'pistacchio-sputacchio', name: 'Pistacchio Sputacchio', health: 6, damage: 1, speed: 90, behavior: 'atirar', minFloor: 1 },
  { id: 'zanzarina-tarantella', name: 'Zanzarina Tarantella', health: 5, damage: 1, speed: 200, behavior: 'vagar', minFloor: 1 },
  { id: 'cannolo-carica', name: 'Cannolo Carica', health: 9, damage: 1, speed: 120, behavior: 'investir', minFloor: 2 },
  { id: 'pinguino-sorbettino', name: 'Pinguino Sorbettino', health: 9, damage: 1, speed: 140, behavior: 'investir', minFloor: 2 },
  { id: 'polpetta-sotterranea', name: 'Polpetta Sotterranea', health: 9, damage: 1, speed: 100, behavior: 'emboscar', minFloor: 2 },
  { id: 'fenicottero-fornarino', name: 'Fenicottero Fornarino', health: 9, damage: 2, speed: 70, behavior: 'atirar', minFloor: 3 },
  { id: 'moka-scudiera', name: 'Moka Scudiera', health: 12, damage: 1, speed: 100, behavior: 'proteger', minFloor: 3 },
  { id: 'vespina-lambrettina', name: 'Vespina Lambrettina', health: 6, damage: 1, speed: 240, behavior: 'investir', minFloor: 3 },
  { id: 'peperoncino-kamikaze', name: 'Peperoncino Kamikaze', health: 5, damage: 2, speed: 230, behavior: 'explodir', minFloor: 4 },
]

export const TEST_ENEMIES = buildEnemyCatalog(ENEMIES).enemies

// Chefes no formato de GET /api/catalog, com os números do seed 0004_bosses.sql da API (na ordem da API: andar
// mínimo e depois nome). Sem os caminhos dos sprites: o jogo usa os de bossSprites.js.
const BOSSES = [
  {
    id: 'brr-brr-patapim', name: 'Brr Brr Patapim', health: 66, damage: 1, minFloor: 1, maxFloor: 2,
    attacks: [{ id: 'atacando', name: 'Pisão', damage: 2 }, { id: 'raizes', name: 'Raízes', damage: 1 }],
  },
  {
    id: 'chimpanzini-bananini', name: 'Chimpanzini Bananini', health: 60, damage: 1, minFloor: 1, maxFloor: 2,
    attacks: [{ id: 'atacando', name: 'Banana-bumerangue', damage: 1 }, { id: 'descascar', name: 'Casca escorregadia', damage: 0 }],
  },
  {
    id: 'cinquecento-turbo', name: 'Cinquecento Turbo', health: 60, damage: 1, minFloor: 1, maxFloor: 2,
    attacks: [{ id: 'investida', name: 'Investida', damage: 2 }, { id: 'atacando', name: 'Buzina', damage: 1 }],
  },
  {
    id: 'nonna-lasagnona', name: 'Nonna Lasagnona', health: 72, damage: 1, minFloor: 1, maxFloor: 4,
    attacks: [{ id: 'atacando', name: 'Colherada', damage: 2 }, { id: 'invocar', name: 'Almôndegas', damage: 1 }],
  },
  {
    id: 'ballerina-cappuccina', name: 'Ballerina Cappuccina', health: 84, damage: 1, minFloor: 3, maxFloor: 4,
    attacks: [{ id: 'pirueta', name: 'Pirueta', damage: 1 }, { id: 'atacando', name: 'Gota de café', damage: 1 }],
  },
  {
    id: 'bombardiro-crocodilo', name: 'Bombardiro Crocodilo', health: 90, damage: 1, minFloor: 3, maxFloor: 4,
    attacks: [{ id: 'atacando', name: 'Bombardeio', damage: 2 }],
  },
  {
    id: 'cappuccino-assassino', name: 'Cappuccino Assassino', health: 84, damage: 1, minFloor: 3, maxFloor: 4,
    attacks: [{ id: 'atacando', name: 'Corte de katana', damage: 2 }, { id: 'clones', name: 'Clones', damage: 1 }],
  },
  {
    id: 'tralalero-tralala', name: 'Tralalero Tralala', health: 135, damage: 2, minFloor: 5, maxFloor: 5,
    attacks: [
      { id: 'investida', name: 'Investida', damage: 2 },
      { id: 'atacando', name: 'Mordida', damage: 2 },
      { id: 'canto-tralala', name: 'Canto', damage: 1 },
      { id: 'pauta', name: 'Pauta musical', damage: 1 },
      { id: 'salto-mergulho', name: 'Mergulho', damage: 2 },
    ],
  },
]

export const TEST_BOSSES = buildBossCatalog(BOSSES).bosses
