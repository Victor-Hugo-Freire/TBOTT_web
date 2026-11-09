'use strict'
// Rodada 3 do protótipo: barra de vida do chefe, texto na fonte pixel do jogo e pedestal com item.
// Depende de lib.js (c, R, E, BM, ICON), fonte.js (SMALL_FONT), chefe-sprite.js e itens-sprites.js.

// ---------- imagens (base64 gerado por gerar-sprites.py) ----------
const IMG = { ped: {}, item: {}, chefe: null, cons: {} }
function carregarImg(src) { return new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.src = src }) }
async function carregarImagens() {
  for (const [k, v] of Object.entries(PEDESTAIS_SRC)) IMG.ped[k] = await carregarImg(v)
  for (const [k, v] of Object.entries(ITENS_SRC)) IMG.item[k] = await carregarImg(v)
  IMG.chefe = await carregarImg(CHEFE.src)
  for (const [k, v] of Object.entries(CONSUMIVEIS_SRC)) IMG.cons[k] = await carregarImg(v)
}
// Desenha um PNG de pixel art ampliado sem suavizar (o garfo e o grão refinados)
function pixelImg(im, x, y, escala, sx = 0, sy = 0, sw = im.width, sh = im.height) {
  c.imageSmoothingEnabled = false
  c.drawImage(im, sx, sy, sw, sh, x, y, sw * escala, sh * escala)
  c.imageSmoothingEnabled = true
}

// ---------- texto na fonte do jogo (SMALL_FONT 5x7: só maiúsculas, sem acento) ----------
function pxLargura(str, u) {
  const t = semAcento(str); let w = 0
  for (const ch of t) w += (ch === ' ' ? 3 : (SMALL_FONT.glyphs[ch] ?? SMALL_FONT.glyphs['?'])[0].length) + SMALL_FONT.spacing
  return (w - SMALL_FONT.spacing) * u
}
const semAcento = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toUpperCase()
function pxTexto(str, x, y, u, cor, align = 'left', contorno = '#140806') {
  const t = semAcento(str)
  if (align === 'center') x -= pxLargura(str, u) / 2
  if (align === 'right') x -= pxLargura(str, u)
  const passo = (col, dx, dy) => {
    let px = x
    for (const ch of t) {
      if (ch === ' ') { px += (3 + SMALL_FONT.spacing) * u; continue }
      const g = SMALL_FONT.glyphs[ch] ?? SMALL_FONT.glyphs['?']
      g.forEach((lin, r) => [...lin].forEach((v, k) => { if (v === '#') R(px + k * u + dx, y + r * u + dy, u, u, col) }))
      px += (g[0].length + SMALL_FONT.spacing) * u
    }
  }
  if (contorno) for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) passo(contorno, dx * u, dy * u)
  passo(cor, 0, 0)
  return pxLargura(str, u)
}

// ---------- barra de vida do chefe ----------
// Camadas (em "pixels de arte" de u px): moldura preta, anel dourado, fundo escuro e 6 linhas de preenchimento com luz de cima.
// Tamanho total: (w + 6) x 12 pixels de arte. Posição (x, y) = canto superior esquerdo da moldura.
const BARRA_PAL = {
  normal: ['#ee7a52', '#d4513a', '#bc3a2e', '#bc3a2e', '#962c26', '#74201e'],
  fase2: ['#f6b04a', '#e68a2c', '#cc5a1c', '#cc5a1c', '#a23e14', '#7c2c10'],
  vulneravel: ['#c4f4e6', '#92dcc6', '#62bea6', '#62bea6', '#46a08a', '#32806e'],
  pisca: ['#ffb097', '#ff7a5c', '#f0503c', '#f0503c', '#c83c30', '#9c2a24'],
}
const BARRA_OURO = { normal: ['#e8c050', '#a8782a', '#6a4a1a'], morto: ['#9a9088', '#6a6058', '#463e38'], alerta: ['#ff8a70', '#d83c2c', '#7a1c14'] }

function bossBar({ x, y, w = 150, u = 4, hp = 1, ghost, nome = '', estado = 'normal', marcas = [], piscar = 0, icone = 'boss' }) {
  ghost = ghost ?? hp
  const W = w + 6, cantos = (x0, y0, ww, hh, cor) => { R(x0 + u, y0, (ww - 2) * u, hh * u, cor); R(x0, y0 + u, ww * u, (hh - 2) * u, cor) }
  const ouro = estado === 'vazia' ? BARRA_OURO.morto : piscar ? BARRA_OURO.alerta : BARRA_OURO.normal
  const pal = BARRA_PAL[piscar ? 'pisca' : estado === 'fase2' || estado === 'vulneravel' ? estado : 'normal']
  // placa com o nome: coroa da Sala do Chefe e o nome na fonte do jogo
  BM(ICON[icone], 3, x, y - 4 * u - 24, R, true)
  pxTexto(nome, x + 34, y - 4 * u - 17, 3, '#f4ecdc')
  if (estado === 'vulneravel') pxTexto('VULNERAVEL', x + (W - 1) * u,y - 4 * u - 17, 3, '#92dcc6', 'right')
  cantos(x, y, W, 12, '#140806')
  cantos(x + u, y + u, W - 2, 10, ouro[1])
  R(x + 2 * u, y + u, (W - 4) * u, u, ouro[0]); R(x + 2 * u, y + 10 * u, (W - 4) * u, u, ouro[2])      // luz em cima, sombra embaixo
  R(x + 2 * u, y + 2 * u, (w + 2) * u, 8 * u, '#1c0e0a')
  R(x + 3 * u, y + 3 * u, w * u, 6 * u, '#3a1a14')                                                         // trilho vazio
  const n = Math.round(Math.max(hp, 0) * w), g = Math.round(Math.max(ghost, 0) * w)
  for (let r = 0; r < 6; r++) {
    if (g > n) R(x + (3 + n) * u, y + (3 + r) * u, (g - n) * u, u, ['#fff4cc', '#f4e2aa', '#e6cf90', '#e6cf90', '#c8b078', '#a89460'][r])   // pedaço perdido (some em seguida)
    if (n > 0) R(x + 3 * u, y + (3 + r) * u, n * u, u, pal[r])
  }
  if (n > 0 && n < w) R(x + (2 + n) * u, y + 3 * u, u, 6 * u, '#fff', 0.5)                                 // ponta do preenchimento
  for (const f of marcas) {                                                                              // marca de fase: losango e risco
    const col = 3 + Math.round(f * w), cruzada = hp < f
    R(x + col * u, y + 3 * u, u, 6 * u, '#1c0e0a')
    R(x + (col - 1) * u, y + 2 * u, 3 * u, u, cruzada ? '#ffd860' : '#6a4a1a'); R(x + col * u, y + u, u, u, cruzada ? '#ffd860' : '#6a4a1a')
  }
  return { w: W * u, h: 12 * u }
}

// ---------- pedestal com item (sprites de itens/, escala 0,5 como o Tung Tung na sala) ----------
function pedestalComItem(ped, item, fx, fy, s = 0.5) {
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'
  c.drawImage(IMG.ped[ped], 0, 0, ITEM_CEL.w, ITEM_CEL.h, fx - ITEM_CEL.feetX * s, fy - ITEM_CEL.feetY * s, ITEM_CEL.w * s, ITEM_CEL.h * s)
  E(fx, fy - 41 * s, 22, 5, '#000', 0.32)                                                    // sombra no prato (o jogo é que desenha a sombra)
  if (item) c.drawImage(IMG.item[item], 0, 0, ITEM_CEL.w, ITEM_CEL.h, fx - ITEM_CEL.feetX * s, fy - ITEM_CEL.feetY * s, ITEM_CEL.w * s, ITEM_CEL.h * s)
}

// ---------- chefe na sala (Cinquecento Turbo, rodada 6) ----------
function chefeNaSala(fx, fy, s = 0.5) {
  E(fx, fy, 130, 22, '#000', 0.35)
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'
  c.drawImage(IMG.chefe, 0, 0, CHEFE.w, CHEFE.h, fx - CHEFE.feetX * s, fy - CHEFE.feetY * s, CHEFE.w * s, CHEFE.h * s)
}
