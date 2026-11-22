export const ZZFX_ATTACK = [
  0.8, 0.02, 185, 0.004, 0.025, 0.12, 2, 0.65,
  0.75, 0.1, 0, 0, 0, 0.12, 0, 0, 0.02, 0.7, 0.02, 0, 500,
]

export const ZZFX_DAMAGE = [
  0.9, 0.18, 105, 0.008, 0.04, 0.22, 3, 1.8,
  -1.3, -0.2, 80, 0.08, 0, 0.35, 2.5, 0.06, 0.04, 0.45, 0.08, 0.7, 0,
]

export const ZZFX_COLLECT = [
  0.7, 0.01, 420, 0.006, 0.08, 0.16, 1, 1,
  1.8, 0.02, 12, 0.045, 0.09, 0.01, 0, 0, 0.01, 0.8, 0.02, 0.02, 0,
]

export const ZZFX_INTERFACE = [
  0.45, 0.005, 640, 0.004, 0.035, 0.06, 0, 1,
  0.2, 0, 0, 0, 0, 0, 0, 0, 0.01, 0.9, 0.01, 0.1, 0,
]

export const ZZFX_EXPERIMENTAL_PRESETS = [
  { id: 'attack', label: 'Ataque', parameters: ZZFX_ATTACK, description: 'Golpe curto, agressivo e com corpo triangular.' },
  { id: 'damage', label: 'Dano', parameters: ZZFX_DAMAGE, description: 'Agressão grave, ruído, queda de frequência e filtro.' },
  { id: 'collect', label: 'Coleta', parameters: ZZFX_COLLECT, description: 'Duas regiões de energia rápida e frequência ascendente.' },
  { id: 'interface', label: 'Interface', parameters: ZZFX_INTERFACE, description: 'Pulso curto e discreto para confirmação.' },
]

export const ZZFXM_EXPERIMENTAL_SONG = [
  [
    [0.34, 0.02, 196, 0.005, 0.09, 0.12, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.75, 0.02],
    [0.28, 0.01, 261.6, 0.004, 0.12, 0.14, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.7, 0.02],
  ],
  [
    [[0, -0.8, 12, 0, 7, 12, 0], [1, 0.8, 16, 0, 12, 16, 0]],
    [[0, 0, 7, 12, 0, 7, 12], [1, 0, 12, 16, 0, 12, 16]],
  ],
  [0, 1, 0, 1],
  110,
]
