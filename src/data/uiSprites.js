// Elementos de HUD. Ficam em public/sprites/ui/.
// Ícones de 60x60 do garfo e do grão de café no contador do HUD (imagem parada, sem grade).
// A barra de vida dos chefes ainda NÃO existe como imagem (no protótipo é desenhada por código): ver docs/sprites/DIVERGENCIAS.md.

// Chave = id do elemento
export const UI_SPRITES = {
  'garfo-hud': {
    id: 'garfo-hud',
    path: '/sprites/ui/garfo-hud.png',
    scale: 1,
    frameWidth: 60,
    frameHeight: 60,
  },
  'grao-de-cafe-hud': {
    id: 'grao-de-cafe-hud',
    path: '/sprites/ui/grao-de-cafe-hud.png',
    scale: 1,
    frameWidth: 60,
    frameHeight: 60,
  },
}
