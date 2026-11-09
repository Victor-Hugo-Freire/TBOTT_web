'use strict'
// Biblioteca de desenho dos protótipos de sala (issue #18). Tudo em canvas 2D, sem imagens, no estilo de drawRoom.js.
// Medidas em pixels do quadro de 1440x1024 (o mesmo tamanho do quadro "sala inicial vazia" do Figma).

const W = 1440
const H = 1024
// Faixas da sala (medidas no print da "sala inicial" do Figma)
const G = { topY: 35, topEnd: 120, beamEnd: 162, brickEnd: 267, lowEnd: 295, fl: 140, fr: 1300, ft: 295, fb: 843, baseEnd: 914, wl: 63, wr: 1377 }
// Grade de 13x7 células sobre o piso
const CELL = { x0: G.fl, y0: G.ft, w: (G.fr - G.fl) / 13, h: (G.fb - G.ft) / 7 }
const CENTER = { x: 720, y: 569 }

let c = null
const setCtx = (ctx) => { c = ctx }

const nz = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
const pick = (arr, s) => arr[Math.floor(nz(s) * arr.length)]

// ---------- primitivas ----------
function R(x, y, w, h, col, a = 1) { c.globalAlpha = a; c.fillStyle = col; c.fillRect(x, y, w, h); c.globalAlpha = 1 }
function RR(x, y, w, h, r, col, a = 1) { c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); c.globalAlpha = 1 }
function E(x, y, rx, ry, col, a = 1) { c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1 }
function EL(x, y, rx, ry, col, lw, a = 1) { c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1 }
function SR(x, y, w, h, col, lw, a = 1) { c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = lw; c.strokeRect(x, y, w, h); c.globalAlpha = 1 }
function POLY(pts, col, a = 1) { c.globalAlpha = a; c.fillStyle = col; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); c.globalAlpha = 1 }
function TXT(str, x, y, size, col, weight = 600, align = 'left') {
  c.fillStyle = col; c.font = `${weight} ${size}px "Segoe UI", system-ui, sans-serif`; c.textAlign = align; c.textBaseline = 'alphabetic'; c.fillText(str, x, y)
}
function glow(x, y, r, rgb, a0) {
  const g = c.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, `rgba(${rgb},${a0})`); g.addColorStop(1, `rgba(${rgb},0)`)
  c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r)
}

// ---------- ícones 8x8 (minimapa, portas, coletáveis) ----------
const ICON = {
  boss: { pal: { 1: '#e84a3a', 2: '#f4c040' }, rows: ['1..11..1', '1.1111.1', '11111111', '11111111', '22222222', '22222222', '........', '........'] },
  cloche: { pal: { 1: '#f0c040', 2: '#ffe890', 3: '#c8c8c8' }, rows: ['...22...', '..1111..', '.111111.', '11111111', '11111111', '33333333', '........', '........'] },
  grao: { pal: { 1: '#d09050', 2: '#4a2810' }, rows: ['..1111..', '.111121.', '11112111', '11121111', '11211111', '.121111.', '..1111..', '........'] },
  tubarao: { pal: { 1: '#8ab8d8', 2: '#4a88b8' }, rows: ['...1....', '...11...', '..111...', '..1111..', '.11111..', '.111111.', '22222222', '........'] },
  bem: { pal: { 1: '#ff7090', 3: '#ffe070' }, rows: ['..3333..', '........', '.11..11.', '11111111', '11111111', '.111111.', '..1111..', '...11...'] },
  bola: { pal: { 1: '#e04848', 2: '#f4f0e8' }, rows: ['..1111..', '.111111.', '11122111', '11222211', '11222211', '11122111', '.111111.', '..1111..'] },
  mascara: { pal: { 1: '#e8c860', 2: '#2a1810' }, rows: ['.111111.', '11111111', '12211221', '12211221', '11111111', '12222221', '.122221.', '..1111..'] },
  garrafa: { pal: { 1: '#5ab070', 2: '#d8b888', 3: '#f0e8c8' }, rows: ['...22...', '...11...', '...11...', '..1111..', '.111111.', '.133331.', '.111111.', '.111111.'] },
  zz: { pal: { 1: '#aac0f0', 2: '#7e98d0' }, rows: ['..11111.', '....11..', '...11...', '..11111.', '........', '.222....', '..2.....', '.222....'] },
  garfo: { pal: { 1: '#e0e4ec', 2: '#aab0bc' }, rows: ['.1.1.1..', '.1.1.1..', '.1.1.1..', '.11111..', '..111...', '...2....', '...2....', '...2....'] },
  vida: { pal: { 1: '#2a2a2a' }, rows: ['.11..11.', '11111111', '11111111', '.111111.', '..1111..', '...11...', '........', '........'] },
}

// Desenha um bitmap. rr(x, y, w, h, cor) é quem pinta (assim as portas giram junto). ol = contorno escuro de 1 px.
function BM(I, px, x, y, rr = R, ol = false) {
  const draw = (dx, dy, only) => {
    I.rows.forEach((row, j) => {
      for (let i = 0; i < row.length;) {
        const ch = row[i]
        if (ch === '.') { i++; continue }
        let k = i
        while (k < row.length && row[k] === ch) k++
        rr(x + dx + i * px, y + dy + j * px, (k - i) * px, px, only || I.pal[ch])
        i = k
      }
    })
  }
  if (ol) { const o = Math.max(1, px / 2); for (const [dx, dy] of [[-o, 0], [o, 0], [0, -o], [0, o]]) draw(dx, dy, '#140806') }
  draw(0, 0)
}

// ---------- paletas ----------
const cantina = {
  top: '#0a0807', panelA: '#302018', panelB: '#281818', beam: '#201810', beamLight: '#37261e', beamBase: '#281b17', beamShadow: '#130f0e',
  base: '#302018', baseLine: '#181010', wall: 'brick', wallCols: ['#503028', '#603830', '#402820'], mortar: '#201810',
  floor: 'planks', floorCols: ['#483020', '#583828', '#604028'], joint: '#201810', side: '#2e2018', side2: '#382a20',
  doorFrame: '#4a3020', doorTrim: '#2a1a10', doorLeaf: '#5a3a22', glow: '170,118,70',
}
const mix = (o) => ({ ...cantina, ...o })
const PAL = {
  cantina,
  cucina: mix({ top: '#0a0d0d', panelA: '#243230', panelB: '#1e2a28', beam: '#2a2018', beamLight: '#4a3a2a', beamBase: '#2a2018', base: '#3a2e24', wall: 'tile', wallCols: ['#3a4a48', '#324240', '#2d3a38'], mortar: '#161e1c', floor: 'checker', floorCols: ['#5a4a3a', '#463828'], side: '#2e2c28', side2: '#38342e', doorFrame: '#6a6a64', doorTrim: '#3a3a38', doorLeaf: '#7a5a38', glow: '200,150,90' }),
  piazza: mix({ top: '#08090e', panelA: '#1a1c2a', panelB: '#14162a', beam: '#1c1a24', beamLight: '#32304a', beamBase: '#1e1c28', beamShadow: '#0c0c12', base: '#26283a', baseLine: '#12121c', wall: 'facade', wallCols: ['#5a4430', '#6a5038'], floor: 'cobble', floorCols: ['#3a3d4a', '#2f323d', '#444858'], joint: '#14151c', side: '#2a2c3a', side2: '#323446', doorFrame: '#3a3a48', doorTrim: '#22222c', doorLeaf: '#4a3a2a', glow: '150,160,220' }),
  pastificio: mix({ top: '#0c0c0e', panelA: '#2a2c30', panelB: '#222428', beam: '#25262a', beamLight: '#4a4c52', beamBase: '#2a2b30', beamShadow: '#0e0e10', base: '#33353a', baseLine: '#16171a', wall: 'metal', wallCols: ['#3b3f44', '#33373c', '#42464c'], mortar: '#16181a', floor: 'concrete', floorCols: ['#4a4640', '#3d3a35'], joint: '#1c1a18', side: '#2c2e32', side2: '#34363a', doorFrame: '#5a5e64', doorTrim: '#c8a020', doorLeaf: '#4a4e54', glow: '210,190,120' }),
  porto: mix({ top: '#080c10', panelA: '#1c2a34', panelB: '#16222c', beam: '#1c2630', beamLight: '#34485a', beamBase: '#202c36', beamShadow: '#0a1014', base: '#2a3640', baseLine: '#10181e', wall: 'planks', wallCols: ['#2c3a44', '#26333c', '#34444e'], mortar: '#10181e', floor: 'dock', floorCols: ['#5a4a38', '#4e4030', '#665440'], side: '#26323a', side2: '#2e3c46', doorFrame: '#4a5a64', doorTrim: '#2a3640', doorLeaf: '#5a4a38', glow: '120,170,200' }),
  chefe: mix({ top: '#140a0a', panelA: '#3a1210', panelB: '#2e0e0c', beam: '#2a1210', beamLight: '#5a2220', beamBase: '#2a1412', wall: 'brick', wallCols: ['#5a2a24', '#6a302a', '#4a221c'], mortar: '#201010', floor: 'checker', floorCols: ['#3a1a18', '#2e1412'], side: '#3a2220', side2: '#462a28', glow: '200,90,60' }),
  tesouro: mix({ top: '#2a1c10', panelA: '#5a4020', panelB: '#4a3418', beam: '#4a3418', beamLight: '#7a5a30', beamBase: '#5a4220', base: '#5a4020', wall: 'tile', wallCols: ['#c8a870', '#b89860', '#a88850'], mortar: '#6a4a20', floor: 'planks', floorCols: ['#9a7040', '#a87c48', '#8a6238'], joint: '#4a2a10', side: '#7a5a34', side2: '#8a6a40', glow: '240,200,120' }),
  loja: mix({ top: '#1a1208', panelA: '#3a2810', panelB: '#2e200c', beam: '#3a2814', beamLight: '#6a4a28', wall: 'planks', wallCols: ['#6a4a2a', '#5a3e22', '#7a5632'], mortar: '#2a1a0c', floor: 'checker', floorCols: ['#7a6a58', '#5a4c3e'], side: '#3a2a1c', side2: '#46342a', glow: '230,180,110' }),
  pacto: mix({ top: '#060a10', panelA: '#102030', panelB: '#0c1824', beam: '#0e1c2a', beamLight: '#2a4a6a', beamBase: '#10202e', beamShadow: '#060c12', base: '#10202e', baseLine: '#08121a', wall: 'tile', wallCols: ['#1c3a4a', '#16303e', '#224654'], mortar: '#0a1820', floor: 'checker', floorCols: ['#14242e', '#0e1a22'], side: '#12222e', side2: '#182c3a', glow: '70,150,190' }),
  mamae: mix({ top: '#2a2010', panelA: '#6a5430', panelB: '#5a4628', beam: '#7a6238', beamLight: '#c8a860', beamBase: '#8a7040', base: '#8a7040', wall: 'tile', wallCols: ['#e0d0a0', '#d4c490', '#c8b880'], mortar: '#8a7440', floor: 'checker', floorCols: ['#e8dcc0', '#c8683a'], side: '#8a7448', side2: '#9a8456', glow: '255,230,160' }),
  fliperama: mix({ top: '#1a0e1e', panelA: '#4a1a3a', panelB: '#3a1430', beam: '#3a1a2e', beamLight: '#7a3a5a', beamBase: '#3a1a30', base: '#3a1a30', wall: 'brick', wallCols: ['#6a2a4a', '#5a2240', '#7a3454'], mortar: '#2a1020', floor: 'checker', floorCols: ['#3a2a4a', '#2a1e38'], side: '#32203a', side2: '#3c2846', glow: '220,140,200' }),
  palco: mix({ top: '#14060a', panelA: '#4a1424', panelB: '#3a101c', beam: '#2a0c14', beamLight: '#7a2a3a', beamBase: '#2e1018', base: '#3a1420', wall: 'tile', wallCols: ['#6a1a2a', '#5a1624', '#7a2232'], mortar: '#2a0c14', floor: 'planks', floorCols: ['#3a2418', '#4a2c1c', '#2e1c12'], side: '#3a1620', side2: '#461c28', glow: '230,150,120' }),
  adega: mix({ top: '#0c0a0a', panelA: '#2a2420', panelB: '#221c18', beam: '#1c1816', beamLight: '#3a3430', beamBase: '#201c1a', base: '#2a2420', wall: 'brick', wallCols: ['#3a3430', '#444038', '#302c28'], mortar: '#141210', floor: 'slabs', floorCols: ['#3a3632', '#44403a', '#302c28'], joint: '#141210', side: '#2a2622', side2: '#34302a', glow: '220,170,100' }),
  descanso: mix({ top: '#14100c', panelA: '#3a3020', panelB: '#30281a', beam: '#2c241a', beamLight: '#5a4a30', beamBase: '#30281c', base: '#3a3020', wall: 'planks', wallCols: ['#6a5a44', '#5e4f3a', '#76664e'], mortar: '#2a2014', floor: 'planks', floorCols: ['#6a5238', '#74593c', '#5e4830'], joint: '#2a1c10', side: '#3a3022', side2: '#463a2a', glow: '240,190,120' }),
}

// ---------- base da sala ----------
function wallStrip(P) {
  const x0 = G.wl, y0 = G.topY + 15, w = G.wr - G.wl, h = G.brickEnd - y0
  c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip()
  if (P.wall === 'facade') {
    R(x0, y0, w, h, P.wallCols[0])
    for (let k = 0; k < 13; k++) R(x0, y0 + k * 18, w, 1, '#000', 0.14)
    R(x0, y0 + 104, w, 8, P.wallCols[1]); R(x0, y0 + 104, w, 2, '#fff', 0.12); R(x0, y0 + 110, w, 3, '#000', 0.3) // friso entre os dois andares
    for (let f = 0; f < 2; f++) for (let k = 0; k < 6; k++) {
      const x = 150 + k * 215, y = y0 + 12 + f * 112
      R(x - 12, y, 10, 78, '#3a5a3a'); R(x + 58, y, 10, 78, '#3a5a3a')
      R(x, y, 56, 78, '#1a1410'); R(x + 3, y + 3, 50, 72, nz(k + 3 + f * 7) > 0.4 ? '#e8c860' : '#2a3a5a')
      R(x + 27, y, 2, 78, '#1a1410'); R(x, y + 38, 56, 2, '#1a1410'); R(x - 4, y + 78, 64, 5, P.wallCols[1])
      if (f) { R(x - 2, y + 78, 60, 12, '#4a3020'); for (let n = 0; n < 5; n++) E(x + 6 + n * 11, y + 78, 4, 4, ['#c03a3a', '#e8c860', '#e870a0'][n % 3]) } // floreira
    }
  } else {
    const [bw, bh, stag] = { brick: [91, 26, true], tile: [52, 35, false], metal: [115, 35, false], planks: [300, 21, true] }[P.wall]
    R(x0, y0, w, h, P.mortar)
    for (let r = 0, y = y0 - 6; y < y0 + h; r++, y += bh) {
      const sh = stag ? (r % 2) * bw / 2 : 0
      for (let k = 0, x = x0 - sh; x < x0 + w; k++, x += bw) {
        R(x + 1, y + 1, bw - 2, bh - 2, pick(P.wallCols, r * 31 + k + 1))
        if (P.wall === 'metal') { R(x + 6, y + 6, 4, 4, '#74787e'); R(x + bw - 10, y + 6, 4, 4, '#74787e') }
      }
    }
  }
  const gg = c.createLinearGradient(0, y0, 0, y0 + h)
  gg.addColorStop(0, 'rgba(0,0,0,0.5)'); gg.addColorStop(0.35, 'rgba(0,0,0,0.08)'); gg.addColorStop(1, 'rgba(0,0,0,0.25)')
  c.fillStyle = gg; c.fillRect(x0, y0, w, h)
  c.restore()
}

function floorFill(P) {
  const { fl, fr, ft, fb } = G, fw = fr - fl, fh = fb - ft
  c.save(); c.beginPath(); c.rect(fl, ft, fw, fh); c.clip()
  const cols = P.floorCols
  if (P.floor === 'planks') {
    for (let k = 0, x = fl; x < fr; k++, x += 96) {
      const jy = ft + 60 + Math.floor(nz(k + 7) * 300)
      R(x, ft, 96, fh, pick(cols, k + 40)); R(x, jy, 96, 2, P.joint); R(x, ft, 3, fh, P.joint); R(x + 3, ft, 2, fh, '#fff', 0.05)
      for (let n = 0; n < 5; n++) R(x + 10 + nz(k * 9 + n) * 76, ft + nz(k * 5 + n + 1) * (fh - 100), 1, 40 + nz(k + n * 3) * 90, '#000', 0.14) // veios
      E(x + 12, jy + 6, 1.8, 1.8, '#000', 0.45); E(x + 84, jy + 6, 1.8, 1.8, '#000', 0.45) // pregos
    }
  } else if (P.floor === 'checker') {
    R(fl, ft, fw, fh, cols[0])
    const tw = fw / 20, th = fh / 10
    for (let j = 0; j < 10; j++) for (let i = 0; i < 20; i++) { if ((i + j) % 2) R(fl + i * tw, ft + j * th, tw, th, cols[1]); R(fl + i * tw, ft + j * th, tw, th, nz(i * 13 + j * 7) > 0.5 ? '#fff' : '#000', 0.035) }
    for (let i = 0; i <= 20; i++) R(fl + i * tw - 1, ft, 2, fh, '#000', 0.18)
    for (let j = 0; j <= 10; j++) R(fl, ft + j * th - 1, fw, 2, '#000', 0.18)
  } else if (P.floor === 'cobble') {
    R(fl, ft, fw, fh, P.joint)
    for (let r = 0, y = ft; y < fb; r++, y += 34) {
      for (let x = fl - nz(r) * 40, k = 0; x < fr; k++) {
        const w = 40 + nz(r * 17 + k) * 30
        R(x + 2, y + 2, w - 4, 30, pick(cols, r * 53 + k)); R(x + 2, y + 2, w - 4, 3, '#fff', 0.07)
        x += w
      }
    }
  } else if (P.floor === 'concrete') {
    R(fl, ft, fw, fh, cols[0])
    for (let x = fl + 145; x < fr; x += 145) R(x, ft, 3, fh, P.joint)
    for (let y = ft + 137; y < fb; y += 137) R(fl, y, fw, 3, P.joint)
    for (let k = 0; k < 14; k++) R(fl + nz(k) * fw, ft + nz(k + 50) * fh, 40 + nz(k + 9) * 90, 18 + nz(k + 3) * 30, cols[1], 0.55)
    for (let x = fl; x < fr; x += 36) { const col = (x - fl) / 36 % 2 ? '#c8a020' : '#1a1a1a'; R(x, ft, 36, 12, col); R(x, fb - 12, 36, 12, col) }
    for (let y = ft; y < fb; y += 36) { const col = (y - ft) / 36 % 2 ? '#c8a020' : '#1a1a1a'; R(fl, y, 12, 36, col); R(fr - 12, y, 12, 36, col) }
  } else if (P.floor === 'dock') {
    for (let r = 0, y = ft; y < fb; r++, y += 38) {
      R(x0Dock(r), y, fw + 200, 38, pick(cols, r * 7 + 2)); R(fl, y, fw, 3, P.joint)
      for (let x = fl + nz(r) * 190; x < fr; x += 190) R(x, y + 17, 3, 3, '#1a1008')
    }
  } else if (P.floor === 'slabs') {
    R(fl, ft, fw, fh, P.joint)
    for (let r = 0, y = ft; y < fb; r++, y += 91) {
      for (let x = fl - (r % 2) * 58, k = 0; x < fr; x += 116, k++) { R(x + 2, y + 2, 112, 87, pick(cols, r * 19 + k)); R(x + 2, y + 2, 112, 3, '#fff', 0.05) }
    }
  }
  // rodada 4: as rachaduras do piso sairam (o Victor descartou rachaduras); no lugar, um grao leve de poeira em todo piso
  for (let k = 0; k < 320; k++) R(fl + nz(k * 3 + 1) * fw, ft + nz(k * 5 + 2) * fh, 2, 2, nz(k + 11) > 0.5 ? '#fff' : '#000', 0.07)
  // sombra de contato das paredes (em cima, nos lados e um pouco embaixo)
  const sombra = (x0, y0, x1, y1, a, rx, ry, rw, rh) => { const gr = c.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(rx, ry, rw, rh) }
  sombra(0, ft, 0, ft + 60, 0.5, fl, ft, fw, 60); sombra(fl, 0, fl + 40, 0, 0.35, fl, ft, 40, fh); sombra(fr, 0, fr - 40, 0, 0.35, fr - 40, ft, 40, fh); sombra(0, fb, 0, fb - 30, 0.3, fl, fb - 30, fw, 30)
  c.restore()
}
function crack(x, y, n, s) {
  c.save(); c.globalAlpha = 0.3; c.strokeStyle = '#000'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y)
  for (let i = 0; i < n; i++) { x += 12 + nz(s + i) * 14; y += (nz(s + i + 9) - 0.5) * 30; c.lineTo(x, y) }
  c.stroke(); c.restore()
}
const x0Dock = () => G.fl

function sidesAndBase(P) {
  for (const [x0, x1] of [[G.wl, G.fl], [G.fr, G.wr]]) {
    const w = x1 - x0
    R(x0, G.topY, w, G.baseEnd - G.topY, P.side)
    for (let y = G.topY, r = 0; y < G.baseEnd; y += 52, r++) {
      R(x0 + 3, y + 3, w - 6, 46, P.side2, r % 2 ? 0.55 : 0.25); R(x0 + 3, y + 3, w - 6, 2, '#fff', 0.07); R(x0 + 3, y + 47, w - 6, 2, '#000', 0.2)
      R(x0, y, w, 2, '#000', 0.4); R(x0 + (r % 2 ? w * 0.6 : w * 0.35), y, 2, 52, '#000', 0.3)
    }
  }
  R(G.fl - 6, G.ft, 6, G.fb - G.ft, '#000', 0.3); R(G.fr, G.ft, 6, G.fb - G.ft, '#000', 0.3)
  R(G.wl, G.fb, G.wr - G.wl, G.baseEnd - G.fb, P.base)
  for (let x = G.wl; x < G.wr; x += 96) R(x, G.fb, 2, G.baseEnd - G.fb, P.baseLine)
  R(G.wl, G.fb, G.wr - G.wl, 4, P.beamShadow)
}

function baseRoom(P) {
  R(0, 0, W, H, '#0b0605')
  R(G.wl, G.topY, G.wr - G.wl, G.brickEnd - G.topY, P.top)
  wallStrip(P)
  // cornija fina no topo, no lugar das tábuas e da viga de cima
  R(G.wl, G.topY, G.wr - G.wl, 12, P.beam); R(G.wl, G.topY + 12, G.wr - G.wl, 3, P.beamLight); R(G.wl, G.topY + 15, G.wr - G.wl, 5, '#000', 0.35)
  R(G.wl, G.brickEnd, G.wr - G.wl, G.lowEnd - G.brickEnd, P.beamBase); R(G.wl, G.brickEnd + 14, G.wr - G.wl, 6, P.beamShadow)
  floorFill(P)
  sidesAndBase(P)
}

// ---------- enfeites da parede de cima (no lugar das tábuas), um conjunto por andar ----------
// Evitam a faixa da porta de cima (x 630..810, abaixo de y 140) e o minimapa (canto superior direito).
for (const k of ['cantina', 'cucina', 'piazza', 'pastificio', 'porto']) { PAL[k].deco = k; PAL[k].nome = k.toUpperCase() }

const prateleira = (x, y, w) => { R(x, y, w, 7, '#3a2414'); R(x, y, w, 2, '#6a4a2a'); R(x + 10, y + 7, 6, 10, '#2a1a10'); R(x + w - 16, y + 7, 6, 10, '#2a1a10') }
const garrafa = (x, y, col) => { R(x - 5, y + 9, 10, 24, col); R(x - 2.5, y, 5, 10, col); R(x - 3, y - 3, 6, 4, '#c09060'); R(x - 3.5, y + 13, 2, 14, '#fff', 0.28) }
const pote = (x, y, col) => { R(x - 11, y - 26, 22, 26, col); R(x - 12, y - 30, 24, 5, '#e8e0d0'); R(x - 8, y - 22, 3, 16, '#fff', 0.3); R(x - 6, y - 14, 12, 6, '#f4ecd8', 0.7) }
function curva(x0, x1, y0, d, t) { return [x0 + (x1 - x0) * t, y0 + 4 * d * t * (1 - t)] }
function fio(x0, x1, y0, d, col) { c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, y0 + 2 * d, x1, y0); c.stroke() }
function boia(P, x, y, r) {
  E(x, y, r + 3, r + 3, '#8a7a50'); E(x, y, r, r, '#e8e4d8')
  c.lineWidth = r * 0.5; c.strokeStyle = '#c03030'
  for (let k = 0; k < 4; k += 2) { c.beginPath(); c.arc(x, y, r * 0.75, k * Math.PI / 2 + 0.2, (k + 1) * Math.PI / 2 - 0.2); c.stroke() }
  E(x, y, r * 0.48, r * 0.48, P.wallCols[1]); EL(x, y, r + 3, r + 3, '#140806', 2)
}
function escotilha(x, y, r) {
  E(x, y, r + 7, r + 7, '#8a6a30'); EL(x, y, r + 7, r + 7, '#140806', 3); E(x, y, r, r, '#0c2a40'); E(x - r * 0.3, y - r * 0.3, r * 0.3, r * 0.2, '#8ac0e0', 0.5)
  for (let k = 0; k < 8; k++) E(x + Math.cos(k * Math.PI / 4) * (r + 3.5), y + Math.sin(k * Math.PI / 4) * (r + 3.5), 2, 2, '#d8b860')
}
function perigo(x, y, w, h) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip()
  R(x, y, w, h, '#c8a020')
  for (let k = -h; k < w; k += 28) POLY([[x + k, y + h], [x + k + 14, y + h], [x + k + 14 + h, y], [x + k + h, y]], '#1a1a1a')
  c.restore(); SR(x, y, w, h, '#1a1a1a', 3)
}
const cano = (x, y, w, h = 14) => { R(x, y, w, h, '#5a5e64'); R(x, y, w, 3, '#9aa0a8'); R(x, y + h - 3, w, 3, '#3a3e44') }
const flange = (x, y, h = 14) => { R(x - 3, y - 4, 8, h + 8, '#44484e'); R(x - 3, y - 4, 2, h + 8, '#8a9098', 0.6) }

const DECOR = {
  cantina: () => {
    for (const x0 of [170, 880]) for (const sy of [150, 212]) {
      for (let k = 0; k < 8; k++) garrafa(x0 + 16 + k * 32, sy - 33, pick(['#2a4a2a', '#4a2a1a', '#3a5a3a', '#5a1a2a'], k + sy + x0))
      prateleira(x0, sy, 262)
    }
    R(450, 50, 160, 3, '#6a5028'); R(1150, 50, 90, 3, '#6a5028')
    for (const x of [470, 520, 570, 1170, 1210]) { R(x, 52, 2, 22, '#c0a070'); E(x + 1, 98, 10, 26, '#8a2a2a'); E(x - 3, 90, 3, 12, '#c04a4a', 0.6); R(x - 4, 121, 10, 3, '#c0a070') }
    return ['#4a2e18', '#e8c880']
  },
  cucina: () => {
    R(170, 64, 300, 4, '#8a8a8a'); R(170, 64, 300, 1.5, '#cfcfcf')
    ;[20, 16, 22, 15, 19].forEach((r, k) => {
      const x = 196 + k * 60
      R(x - 1, 68, 2, 16, '#6a6a6a'); RR(x - r, 84, 2 * r, r * 1.4, 4, '#b8662e'); R(x - r - 2, 84, 2 * r + 4, 4, '#d88a4a'); R(x - r + 3, 90, 3, r, '#f0b070', 0.5); R(x + r, 88, 10, 4, '#5a3a20')
    })
    prateleira(170, 215, 262)
    for (let k = 0; k < 9; k++) { E(184 + k * 28, 198, 8, 18, '#e8e4d8'); EL(184 + k * 28, 198, 8, 18, '#a8a498', 1.5) }
    for (const x0 of [880]) for (const sy of [150, 212]) {
      for (let k = 0; k < 6; k++) pote(x0 + 24 + k * 40, sy, pick(['#c03a2a', '#6a8a30', '#d8a030', '#8a3a6a'], k + sy))
      prateleira(x0, sy, 262)
    }
    R(1189, 52, 2, 70, '#8a7a50')
    for (let k = 0; k < 5; k++) { E(1190 + (k % 2 ? 6 : -6), 72 + k * 14, 9, 8, '#efe8d8'); R(1189 + (k % 2 ? 4 : -8), 62 + k * 14, 4, 6, '#c8b890') }
    return ['#e8e4d8', '#a03020']
  },
  piazza: () => {
    fio(90, 610, 70, 26, '#d8d0b8')
    ;['#c03a3a', '#3a6ab0', '#e8e4d8', '#d8a030', '#3a8a4a', '#c03a3a', '#e8e4d8'].forEach((col, k) => {
      const [x, y] = curva(90, 610, 70, 26, (k + 0.7) / 7.6)
      if (k % 2) { R(x - 8, y, 7, 30, col); R(x + 1, y, 7, 30, col) } else { R(x - 9, y, 18, 26, col); R(x - 15, y, 6, 12, col); R(x + 9, y, 6, 12, col) }
      R(x - 1, y - 3, 2, 5, '#6a5a3a')
    })
    fio(830, 1230, 66, 14, '#d8d0b8')
    for (let k = 0; k < 14; k++) { const [x, y] = curva(830, 1230, 66, 14, (k + 0.5) / 14); POLY([[x - 10, y], [x + 10, y], [x, y + 20]], ['#c03a3a', '#e8e4d8', '#2f7a4a'][k % 3]) }
    return ['#1a2a4a', '#e8d8a0']
  },
  pastificio: () => {
    cano(90, 80, 520); for (const x of [150, 290, 430, 570]) flange(x, 80)
    R(358, 62, 4, 18, '#44484e'); EL(360, 56, 16, 16, '#c03a2a', 4); R(344, 54, 32, 3, '#c03a2a'); R(358, 40, 3, 32, '#c03a2a')
    cano(830, 110, 400); for (const x of [900, 1040, 1180]) flange(x, 110)
    R(1190, 124, 14, 143, '#5a5e64'); R(1190, 124, 3, 143, '#9aa0a8'); R(1201, 124, 3, 143, '#3a3e44')
    E(470, 175, 22, 22, '#d8d4c8'); EL(470, 175, 22, 22, '#3a3e44', 4); c.strokeStyle = '#c03a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(470, 175); c.lineTo(485, 162); c.stroke(); E(470, 175, 3, 3, '#3a3e44')
    R(120, 124, 14, 143, '#5a5e64'); R(120, 124, 3, 143, '#9aa0a8')
    perigo(190, 205, 150, 44); perigo(1000, 205, 150, 44)
    return ['#c8a020', '#1a1a1a']
  },
  porto: (P) => {
    boia(P, 230, 150, 34); boia(P, 1130, 155, 34)
    for (let r = 0; r < 4; r++) EL(420, 195, 38 - r * 8, 20 - r * 4, '#c8b070', 4)
    R(900, 62, 182, 4, '#8a7a50')
    for (let i = 0; i <= 6; i++) { R(900 + i * 30, 64, 2, 82, '#a89a68', 0.8); E(900 + i * 30, 64, 4, 4, '#e06020') }
    for (let j = 1; j < 5; j++) R(900, 64 + j * 16, 182, 2, '#a89a68', 0.8)
    escotilha(540, 125, 26); escotilha(1180, 215, 22)
    return ['#1c3a5a', '#e8e4d8']
  },
}
// Rodada 5 (2026-11-08): a placa com o nome do andar saiu (o Victor achou feia). O tema fica nos enfeites e obstáculos;
// a parede de baixo da placa já era desenhada inteira, então não sobra buraco.
function wallDecor(P) {
  DECOR[P.deco](P)
}

function lighting(P) {
  c.save(); c.beginPath(); c.rect(G.fl, G.ft, G.fr - G.fl, G.fb - G.ft); c.clip()
  glow(720, 430, 620, P.glow, 0.3)
  // rodada 4: luz de cima/esquerda (como nos sprites): o canto de cima à esquerda clareia e o de baixo à direita escurece
  const lz = c.createLinearGradient(G.fl, G.ft, G.fr, G.fb)
  lz.addColorStop(0, 'rgba(255,236,200,0.07)'); lz.addColorStop(0.55, 'rgba(0,0,0,0)'); lz.addColorStop(1, 'rgba(0,0,0,0.2)')
  c.fillStyle = lz; c.fillRect(G.fl, G.ft, G.fr - G.fl, G.fb - G.ft)
  const sh = c.createRadialGradient(720, 569, 260, 720, 569, 820)
  sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.4)')
  c.fillStyle = sh; c.fillRect(G.fl, G.ft, G.fr - G.fl, G.fb - G.ft)
  c.restore()
}
function vignette() {
  const v = c.createRadialGradient(720, 512, 380, 720, 512, 960)
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.7)')
  c.fillStyle = v; c.fillRect(0, 0, W, H)
}

// Tung Tung de frente, com os pés em (cx, fy). TUNG é a imagem carregada de sprite.js.
function tung(cx, fy) {
  E(cx, fy, 30, 8, '#000', 0.35)
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'
  c.drawImage(TUNG, 0, 0, 296, 259, cx - 74, fy - 120.5, 148, 129.5)
}

// ---------- portas ----------
const DOORG = { top: { c: 720, ex: 150, D: 145 }, bottom: { c: 720, ex: 929, D: 86 }, left: { c: 569, ex: 45, D: 95 }, right: { c: 569, ex: 1395, D: 95 } }
const DK = {
  comum: { gate: 'espaguete' },
  chefe: { fc: '#6a1c18', trim: '#2a0c0a', leaf: '#3b3033', ic: 'boss', gate: 'grade' },
  tesouro: { fc: '#b88a50', trim: '#e8c860', leaf: '#8a6238', ic: 'cloche', gate: 'espaguete' },
  loja: { fc: '#4a3020', trim: '#2a1a10', leaf: '#7a5a38', awning: true, gate: null },
  pacto: { fc: '#14202a', trim: '#2a6a8a', leaf: '#1a2a3a', ic: 'tubarao', gate: 'dentes', noBands: true },
  mamae: { fc: '#d8c890', trim: '#f0e0a0', leaf: '#c8b078', ic: 'bem', gate: 'cortina', curt: '#f0e8d0', curt2: '#d8c8a0', noBands: true },
  fliperama: { fc: '#6a4a28', trim: '#d8a030', leaf: '#8a6a40', ic: 'bola', gate: 'funil' },
  palco: { fc: '#4a1a2a', trim: '#e0b040', leaf: '#3a1420', ic: 'mascara', gate: 'cortina', curt: '#8a1a3a', curt2: '#6a1430', noBands: true },
  adega: { gate: 'rachadura' },
  descanso: { fc: '#6a5a48', trim: '#3a2e24', leaf: '#8a7458', ic: 'zz', gate: 'espaguete' },
}

// Rodada 4: enfeite acima da verga, que dá a cada tipo de porta uma silhueta própria, ligada ao ícone do minimapa.
// Fica no mesmo sistema girado da porta: v < 0 é a parede acima dela. A porta comum e a adega (secreta) não têm enfeite.
function enfeite(kind, q, qe, qp, X, Wd, Hh, T) {
  const m = Wd / 2, ol = '#140806'
  const acima = (fn) => { c.save(); c.beginPath(); c.rect(X(-30), -90, Wd + 60, 90); c.clip(); fn(); c.restore() }
  if (kind === 'chefe') { // ameias de castelo e duas pontas de ferro (coroa)
    for (const u of [0, 34, 98, 132]) { q(u - 2, -20, 22, 22, ol); q(u, -18, 18, 20, '#8a1c18'); q(u, -18, 18, 3, '#c04a32'); q(u + 15, -18, 3, 20, '#000', 0.3) }
    for (const u of [62, 88]) { qp([[u - 7, 0], [u + 7, 0], [u, -30]], ol); qp([[u - 4.5, -1], [u + 4.5, -1], [u, -25]], '#8a8a92'); qp([[u - 4.5, -1], [u, -1], [u, -25]], '#b0b0b8') }
  } else if (kind === 'tesouro') { // cúpula de cloche dourada
    acima(() => { qe(m, 2, 46, 34, ol); qe(m, 2, 42, 30, '#d8a830'); qe(m - 12, -12, 14, 8, '#ffe890', 0.6) })
    q(m - 50, -3, 100, 5, ol); q(m - 48, -2, 96, 3, '#c8c8c8')
    qe(m, -33, 7, 6, ol); qe(m, -33, 5, 4, '#f0d060')
  } else if (kind === 'loja') { // placa redonda com o grão de café
    q(m - 1, -44, 2, 8, '#1a1410'); qe(m, -22, 19, 17, ol); qe(m, -22, 16, 14, '#e8dcc0'); qe(m, -22, 9, 6.5, '#8a5a30'); q(m - 1, -27, 2, 10, '#3a2210')
  } else if (kind === 'pacto') { // barbatana do tubarão em cima e dentes na boca da porta
    qp([[m - 30, 0], [m + 26, 0], [m + 8, -42]], ol); qp([[m - 25, -1], [m + 21, -1], [m + 7, -37]], '#2a5a7a'); qp([[m - 25, -1], [m + 1, -1], [m + 7, -37]], '#3a7a9a')
    for (let u = T + 2; u + 10 <= Wd - T; u += 12) { qp([[u - 1, Hh], [u + 11, Hh], [u + 5, Hh + 13]], ol); qp([[u, Hh], [u + 10, Hh], [u + 5, Hh + 11]], '#f0f0f0') }
  } else if (kind === 'mamae') { // coração e renda
    qe(m - 9, -26, 11.5, 11.5, ol); qe(m + 9, -26, 11.5, 11.5, ol); qp([[m - 21, -22], [m + 21, -22], [m, 1]], ol)
    qe(m - 9, -26, 9, 9, '#ff7090'); qe(m + 9, -26, 9, 9, '#ff7090'); qp([[m - 18, -23], [m + 18, -23], [m, -3]], '#ff7090'); qe(m - 11, -29, 3, 2, '#fff', 0.6)
    for (let u = 6; u < Wd; u += 12) qe(u, 1, 6, 4, '#f4ecd8')
  } else if (kind === 'fliperama') { // letreiro de arcade com lâmpadas
    acima(() => { qe(m, 0, 68, 32, ol); qe(m, 0, 64, 28, '#6a3a20'); qe(m, 0, 46, 15, '#3a1e10') })
    for (let k = 0; k <= 8; k++) { const a = Math.PI + k * Math.PI / 8, x = m + Math.cos(a) * 55, y = Math.sin(a) * 21; qe(x, y, 4.6, 4.6, ol); qe(x, y, 3.3, 3.3, k % 2 ? '#ffd860' : '#ff6080') }
  } else if (kind === 'palco') { // frontão dourado e cortinas presas nos cantos
    qp([[-4, 0], [Wd + 4, 0], [m, -32]], ol); qp([[2, -2], [Wd - 2, -2], [m, -27]], '#e0b040'); qp([[18, -4], [Wd - 18, -4], [m, -20]], '#8a1a2a')
    qe(T + 8, Hh + 2, 20, 12, ol); qe(Wd - T - 8, Hh + 2, 20, 12, ol); qe(T + 8, Hh + 2, 17, 10, '#8a1a2a'); qe(Wd - T - 8, Hh + 2, 17, 10, '#8a1a2a')
  } else if (kind === 'descanso') { // lua crescente cheia (a 1ª versão, um arco, parecia a letra C)
    const lua = (r, rCorte, col) => {
      c.save(); c.beginPath(); c.rect(X(-40), -80, Wd + 80, 80); c.arc(X(m + 33), -26, rCorte, 0, 2 * Math.PI); c.clip('evenodd')
      c.fillStyle = col; c.beginPath(); c.arc(X(m + 26), -20, r, 0, 2 * Math.PI); c.fill(); c.restore()
    }
    lua(16, 10.5, ol); lua(13.5, 13, '#aac0f0')
    qe(m + 21, -14, 2.2, 2.2, '#dce8ff')
  }
}

// sd: top|bottom|left|right. state: open (aberta) | closed (fechada no combate) | locked (condição para abrir).
// Cada porta é desenhada uma vez, de cima, e girada (translate + rotate) para os outros lados. Só o ícone fica fora da rotação, sempre em pé.
function door(sd, kind, state, P, geo) {
  const g = geo || DOORG[sd], D = g.D, Wd = 150, T = 14, Hh = 26, K = DK[kind]
  const [ox, oy] = sd === 'left' || sd === 'right' ? [g.ex, g.c] : [g.c, g.ex]
  const X = (u) => u - Wd / 2 // u (0..Wd, ao longo da porta) vira x local, centrado na porta
  const q = (u, v, w, h, col, a = 1) => R(X(u), v, w, h, col, a)
  const qe = (u, v, rx, ry, col, a = 1) => E(X(u), v, rx, ry, col, a)
  const qp = (pts, col, a = 1) => POLY(pts.map(([u, v]) => [X(u), v]), col, a)
  c.save(); c.translate(ox, oy); c.rotate({ top: 0, bottom: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 }[sd])
  const oh = D - Hh, hw = (Wd - 2 * T) / 2, dark = '#050302'
  if (kind === 'adega' && state === 'hidden') { // só a marca, sem remendo: 3 risquinhos de giz (3 golpes), tijolo solto, poeira e um fio de rachadura
    const v = D * 0.42
    for (const u of [-10, 0, 10]) { q(Wd / 2 + u - 1.5, v - 30, 3, 22, '#f4ecd4', 0.9); q(Wd / 2 + u - 1.5, v - 30, 1, 22, '#fff', 0.5) }
    q(Wd / 2 - 26, v, 52, 26, '#fff', 0.2)
    q(Wd / 2 - 26, v, 52, 3, '#000', 0.6); q(Wd / 2 - 26, v + 23, 52, 3, '#000', 0.6); q(Wd / 2 - 28, v, 3, 26, '#000', 0.6); q(Wd / 2 + 25, v, 3, 26, '#000', 0.6)
    q(Wd / 2 + 31, v - 26, 2, 24, '#000', 0.4); q(Wd / 2 + 33, v - 6, 2, 14, '#000', 0.4)
    for (const [du, dv, w] of [[-20, 31, 6], [6, 34, 7], [-5, 29, 4], [20, 33, 6]]) q(Wd / 2 + du, v + dv, w, 4, '#b0aaa0')
    c.restore(); return
  }
  q(-3, -3, Wd + 6, D + 3, '#0a0604')

  if (kind === 'adega') {
    // a parede da porta acompanha o lado: tijolo em cima, pedra nas laterais, rodapé embaixo
    const bloco = sd === 'top' ? P.wallCols[0] : sd === 'bottom' ? P.base : P.side2, junta = sd === 'top' ? P.mortar : P.baseLine
    // tijolos de cores variadas (como a parede de verdade), para o remendo não parecer um bloco chapado
    const cores = sd === 'top' ? P.wallCols : sd === 'bottom' ? [P.base, P.side] : [P.side, P.side2], [bw, bh] = sd === 'top' ? [91, 26] : [76, 22]
    q(0, 0, Wd, D, junta)
    for (let r = 0; r * bh < D; r++) for (let u = -(r % 2) * bw / 2; u < Wd; u += bw) {
      const u0 = Math.max(0, u + 1), u1 = Math.min(Wd, u + bw - 1)
      if (u1 > u0) q(u0, r * bh + 1, u1 - u0, bh - 2, pick(cores, r * 7 + Math.floor(u / bw) + sd.length))
    }
    q(0, 0, Wd, 3, '#fff', 0.1); q(0, 0, 3, D, '#fff', 0.06)
    if (state === 'open') {
      q(26, 16, Wd - 52, D - 16, dark); q(26, 16, 8, 8, bloco); q(Wd - 34, 16, 8, 8, bloco)
      q(20, D - 14, 16, 10, '#4a4640'); q(Wd - 42, D - 12, 18, 8, '#3a3630'); q(52, D - 8, 12, 6, '#5a564e'); q(Wd / 2, D - 10, 14, 7, '#4a4640')
    } else {
      const n = 8
      for (let k = 0; k < n; k++) q(Wd / 2 + (k % 2 ? 7 : -7) + (k > 4 ? 6 : 0), k * (D / n), 4, D / n + 3, '#0a0604')
      q(Wd / 2 - 5, D * 0.35, 3, 12, '#0a0604'); q(Wd / 2 + 9, D * 0.6, 3, 10, '#0a0604')
      q(Wd / 2 - 3, D * 0.1, 1, D * 0.8, '#fff', 0.1) // borda clara da rachadura
    }
    c.restore(); return
  }

  const fc = K.fc || P.doorFrame, leaf = K.leaf || P.doorLeaf, trim = K.trim || P.doorTrim
  q(0, 0, Wd, D, fc)
  for (let v = 8; v < D; v += 16) { q(0, v, T, 1, '#000', 0.35); q(Wd - T, v + 8, T, 1, '#000', 0.35) } // juntas das pedras
  q(0, 0, Wd, 4, '#fff', 0.16); q(0, 0, 4, D, '#fff', 0.1); q(Wd - 4, 0, 4, D, '#000', 0.25) // chanfro: luz em cima e à esquerda
  q(T, Hh, Wd - 2 * T, oh, state === 'open' && kind === 'mamae' ? '#3a2a14' : state === 'open' && kind === 'pacto' ? '#04101a' : dark)

  if (state === 'open') {
    q(T, Hh, 9, oh - 6, leaf); q(Wd - T - 9, Hh, 9, oh - 6, leaf); q(T + 9, Hh, 2, oh - 6, '#000', 0.4); q(Wd - T - 11, Hh, 2, oh - 6, '#000', 0.4)
    q(T + 14, Hh, Wd - 2 * T - 28, 3, '#000', 0.5)
    if (kind === 'mamae') { // rodada 4: luz quente lá dentro e a cortina de renda presa dos dois lados (antes parecia um quadro bege)
      qe(Wd / 2, Hh + oh * 0.6, 34, 26, '#f0c870', 0.25); qe(Wd / 2, Hh + oh * 0.6, 18, 14, '#fff0c0', 0.25)
      for (const [u0, s] of [[T, 1], [Wd - T, -1]]) {
        qp([[u0, Hh], [u0 + s * 30, Hh], [u0 + s * 12, Hh + oh * 0.55], [u0 + s * 16, Hh + oh], [u0, Hh + oh]], '#f0e8d0')
        for (let j = 0; j < oh - 8; j += 9) q(u0 + s * 4 - (s < 0 ? 3 : 0), Hh + 6 + j, 3, 3, '#fff', 0.7)
        qe(u0 + s * 12, Hh + oh * 0.55, 4, 3, '#c8a040')
      }
    }
    if (kind === 'pacto') { q(T + 24, Hh + 14, 5, 5, '#5a9ac0', 0.7); q(Wd / 2 + 10, Hh + 30, 4, 4, '#5a9ac0', 0.7); q(Wd - T - 36, Hh + 12, 6, 6, '#5a9ac0', 0.7) }
  } else {
    if (K.gate === 'grade' && kind === 'chefe') {
      for (let k = 0; T + 8 + k * 14 < Wd - T - 6; k++) {
        const u = T + 8 + k * 14
        q(u, Hh, 6, oh, '#3a3a3e'); q(u, Hh, 1, oh, '#7a7a82')
        qp([[u, Hh + oh], [u + 6, Hh + oh], [u + 3, Hh + oh + 5]], '#7a7a82') // ponta da lança
      }
      q(T, Hh + oh * 0.5, Wd - 2 * T, 6, '#3a3a3e'); q(T, Hh + oh * 0.5, Wd - 2 * T, 1, '#7a7a82')
    } else {
      q(T, Hh, hw - 1, oh, leaf); q(T + hw + 1, Hh, hw - 1, oh, leaf); q(T + hw - 1, Hh, 2, oh, dark)
      q(T, Hh, 2, oh, '#fff', 0.12); q(T + hw + 1, Hh, 2, oh, '#fff', 0.12)
      for (let k = 11; k < hw - 1; k += 11) { q(T + k, Hh, 1, oh, '#000', 0.25); q(T + hw + 1 + k, Hh, 1, oh, '#000', 0.25) }
      if (!K.noBands) {
        for (const f of [0.28, 0.7]) { const vb = Hh + f * oh; q(T, vb, Wd - 2 * T, 5, '#1c1a1c'); q(T, vb, Wd - 2 * T, 1, '#fff', 0.15); for (let x = T + 6; x < Wd - T - 4; x += 24) qe(x + 1.5, vb + 2.5, 2.2, 2.2, '#8a8a92') }
        q(Wd / 2 - 9, Hh + oh * 0.45, 18, 14, '#1c1a1c'); qe(Wd / 2, Hh + oh * 0.45 + 7, 5.5, 5.5, '#c0a060'); qe(Wd / 2, Hh + oh * 0.45 + 7, 2.4, 2.4, '#1c1a1c')
      }
      if (state === 'locked') {
        if (K.gate === 'espaguete') {
          // nó de espaguete enrolado na argola: o garfo é que tira
          const cy = Hh + oh * 0.5
          const fio = (v0, v1, cv) => {
            c.lineCap = 'round'
            for (const [lw, col] of [[6, '#6a4a14'], [3.5, '#f0d878']]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(X(T + 3), v0); c.quadraticCurveTo(X(Wd / 2), cv, X(Wd - T - 3), v1); c.stroke() }
            c.lineCap = 'butt'
          }
          fio(Hh + oh * 0.2, Hh + oh * 0.6, Hh + oh * 0.8)
          fio(Hh + oh * 0.8, Hh + oh * 0.3, Hh + oh * 0.2)
          fio(Hh + oh * 0.45, Hh + oh * 0.55, Hh + oh * 1.0)
          qe(Wd / 2, cy, 13, 9, '#6a4a14'); qe(Wd / 2, cy, 11, 7, '#f0d878'); qe(Wd / 2, cy, 6, 3.5, '#d8b858'); qe(Wd / 2 - 3, cy - 1.5, 3, 1.4, '#fff4c0', 0.8)
          qe(Wd / 2 - 17, cy + 12, 3, 4, '#c03020'); qe(Wd / 2 + 14, cy - 12, 2.5, 3.5, '#c03020') // pingos de molho
        } else if (K.gate === 'funil') {
          const cx = Wd / 2; let v = Hh + 4
          for (const [w, h] of [[96, 11], [72, 11], [48, 11], [22, 14]]) { q(cx - w / 2 - 2, v - 1, w + 4, h + 2, '#140806'); q(cx - w / 2, v, w, h, '#9a6a30'); q(cx - w / 2, v, 3, h, '#c89050'); v += h }   // rodada 4: funil maior
          q(cx - 4, v + 2, 8, 10, '#4a2810'); qe(cx, Hh + 8, 7, 4.5, '#4a2810'); q(cx - 0.5, Hh + 4, 1, 8, '#d09050')                                                 // o grao entrando no funil
        } else if (K.gate === 'cortina') {
          q(T, Hh, hw, oh, K.curt); q(T + hw, Hh, hw, oh, K.curt)
          for (let k = 0; k < hw; k += 10) { q(T + k + 3, Hh, 3, oh, K.curt2, 0.8); q(T + hw + k + 3, Hh, 3, oh, K.curt2, 0.8) }
          if (kind === 'mamae') for (let j = 0; j < oh - 14; j += 10) for (let u = T + 5 + (j / 10 % 2) * 5; u < Wd - T - 4; u += 10) q(u, Hh + 14 + j, 3, 3, '#fff', 0.6) // renda
          q(T, Hh, Wd - 2 * T, 9, K.curt2)
          for (let u = T + 8; u < Wd - T; u += 16) qe(u, Hh + 9, 8, 5, K.curt2) // babado
          q(Wd / 2 - 3, Hh + oh * 0.45, 6, 12, '#e0b040'); q(Wd / 2 - 1, Hh + oh * 0.45 - 6, 2, 6, '#e0b040')
        } else if (K.gate === 'dentes') {
          q(T + hw - 9, Hh, 2, oh, '#b04050'); q(T + hw + 7, Hh, 2, oh, '#b04050')
          for (let k = 0; k * 12 + 16 <= oh; k++) {
            const v = Hh + k * 12
            qp([[T + hw - 7, v], [T + hw - 7, v + 10], [T + hw + 3, v + 5]], '#f0f0f0')
            qp([[T + hw + 7, v + 6], [T + hw + 7, v + 16], [T + hw - 3, v + 11]], '#f0f0f0')
          }
        }
      }
    }
  }
  // cantos do vão chanfrados (arco quadradinho) e sombra da verga
  for (const [w, v] of [[10, 0], [6, 3], [3, 6]]) { q(T, Hh + v, w, 3, fc); q(Wd - T - w, Hh + v, w, 3, fc) }
  q(T, Hh, Wd - 2 * T, 6, '#000', 0.35)
  q(T, D - 4, Wd - 2 * T, 4, '#fff', 0.1) // soleira
  if (K.awning) for (let k = 0; k < 10; k++) { const col = ['#2f7a4a', '#e8e4d8', '#b03030'][k % 3]; q(k * 15, 0, 15, Hh, col); qe(k * 15 + 7.5, Hh, 7.5, 7, col); q(k * 15, 0, 15, 3, '#fff', 0.15) } // toldo recortado
  if (K.ic) { q(Wd / 2 - 16, 0, 32, Hh, '#fff', 0.14); q(Wd / 2 - 16, 0, 1, Hh, '#000', 0.35); q(Wd / 2 + 15, 0, 1, Hh, '#000', 0.35) } // pedra-chave (rodada 4: mais larga, para o ícone maior)
  q(0, 0, Wd, 3, trim); q(0, 0, 3, D, trim); q(Wd - 3, 0, 3, D, trim)
  enfeite(kind, q, qe, qp, X, Wd, Hh, T)
  c.restore()
  if (K.ic) { // ícone fora da rotação, sempre em pé
    const [ix, iy] = { top: [g.c, g.ex + Hh / 2], bottom: [g.c, g.ex - Hh / 2], left: [g.ex + Hh / 2, g.c], right: [g.ex - Hh / 2, g.c] }[sd]
    BM(ICON[K.ic], 2.6, ix - 10.4, iy - 10.4, R, true)
  }
}
const doorsAll = (P, kind = 'comum', state = 'open') => ['top', 'right', 'bottom', 'left'].forEach((sd) => door(sd, kind, state, P))

// ---------- obstáculos (grade 20x20; peça = [x, y, w, h, cor, alfa] ou ['e', cx, cy, rx, ry, cor, alfa] para elipse) ----------
const SH = ['e', 10, 18.3, 8.5, 1.8, '#000', 0.3]
const REDE = [[2, 5, 16, 12, '#8a7a50', 0.18]]
for (let k = 0; k < 5; k++) REDE.push([2, 5 + k * 3, 16, 1, '#8a7a50'], [2 + k * 4, 5, 1, 13, '#8a7a50'])
const SETAS = [4.5, 9.5, 14.5].flatMap((x) => [[x, 10, 0.9, 3, '#e0b040'], [x + 0.9, 10.7, 0.9, 1.6, '#e0b040'], [x + 1.8, 11.3, 0.7, 0.5, '#e0b040']])
const OB = {
  barril: { nome: 'Barril', mec: 'Sólido', ops: [SH, ['e', 10, 16.4, 7, 2.3, '#4a2a14'], [3, 5, 14, 11.4, '#6b4226'], [3, 8.2, 14, 1.3, '#2a1a10'], [3, 13, 14, 1.3, '#2a1a10'],
    [6, 5, 0.8, 11, '#8f5f33'], [10, 5, 0.8, 11, '#55341c'], [13.5, 5, 0.8, 11, '#8f5f33'], [4.5, 7, 1.2, 8, '#fff', 0.12],
    ['e', 10, 5, 7, 2.6, '#a87444'], ['e', 10, 5, 5, 1.7, '#8a5a30'], ['e', 10, 5, 1.2, 0.6, '#2a1a10']] },
  garrafao: { nome: 'Garrafão', mec: 'Quebrável', ops: [SH, ['e', 10, 16.3, 6.8, 2.5, '#a88a50'], ['e', 10, 12.5, 6.2, 5.6, '#3d6b3a'], [8.4, 4.5, 3.2, 5, '#3d6b3a'], [8, 3.2, 4, 1.6, '#4d7b48'], [8.6, 1.4, 2.8, 2, '#c09060'],
    ['e', 10, 14.6, 5.2, 3.3, '#5a1a2a'], [4.6, 16, 10.8, 0.6, '#6a5028'], [6.2, 9.5, 1.3, 4.5, '#9ac898', 0.6], [9.3, 5.5, 0.8, 3, '#9ac898', 0.5]] },
  barril_deitado: { nome: 'Barril deitado', mec: 'Rolante', ops: [SH, [3, 17, 3, 1.4, '#3a2410'], [14, 17, 3, 1.4, '#3a2410'], [4, 7, 12, 10, '#6b4226'],
    ['e', 4, 12, 2, 5, '#8a5a30'], ['e', 16, 12, 2, 5, '#4a2a14'], [7, 7, 1, 10, '#2a1a10'], [12, 7, 1, 10, '#2a1a10'], [4, 8.2, 12, 0.9, '#8f5f33'],
    ['e', 4, 12, 0.9, 0.9, '#2a1a10'], [18.2, 10, 1.8, 0.6, '#fff', 0.35], [18.2, 13, 1.8, 0.6, '#fff', 0.35]] },
  vinho: { nome: 'Vinho derramado', mec: 'Escorregadio', flat: true, ops: [['e', 10, 12.5, 8.2, 3.6, '#6a1530'], ['e', 6, 11, 3.5, 1.9, '#6a1530'], ['e', 14.5, 14.2, 3.6, 1.6, '#6a1530'],
    ['e', 7.5, 11.6, 2.4, 0.8, '#c04060'], ['e', 13, 13.4, 1.5, 0.5, '#a02848'], ['e', 11, 10.5, 1.2, 0.5, '#8a2040'], ['e', 3, 16, 0.9, 0.9, '#6a1530']] },
  balcao: { nome: 'Balcão de mármore', mec: 'Sólido', ops: [SH, [1, 9, 18, 9, '#6a5a4a'], [3, 11, 6, 5, '#7a6a5a'], [11, 11, 6, 5, '#7a6a5a'], [9.5, 11, 1, 5, '#3a2a1a'], [1, 16.5, 18, 1.5, '#3a2a1a'],
    [12, 2.5, 5, 1.6, '#a87848'], ['e', 5, 3.4, 2, 1, '#e8e0d0'], [1, 4, 18, 5.2, '#d8d0c4'], [1, 8.4, 18, 0.9, '#a8a098'], [3, 5.6, 4, 0.5, '#a8a098'], [8, 6.8, 5, 0.5, '#b8b0a4'], [14, 5.5, 3, 0.5, '#a8a098']] },
  saco: { nome: 'Saco de farinha', mec: 'Quebrável', ops: [SH, ['e', 10, 14.8, 5.8, 3.4, '#d8ccb0'], [4.2, 6.5, 11.6, 8.3, '#d8ccb0'], ['e', 10, 6.4, 5.8, 1.7, '#e4d8bc'], [8, 3.6, 4, 3, '#c0b090'], [7.4, 5.2, 5.2, 1, '#8a2a20'],
    [6.5, 9, 7, 4.2, '#a03020'], [7.4, 10.2, 5.2, 0.7, '#f4e8d0'], [7.9, 11.6, 4.2, 0.7, '#f4e8d0'], [5.4, 7.5, 1.2, 6.5, '#efe4c8', 0.7], ['e', 15.5, 16.8, 2.1, 0.8, '#efe4c8', 0.8]] },
  chapa: { nome: 'Chapa quente', mec: 'Quente', ops: [SH, [2, 5, 16, 12.5, '#2a2a2e'], [2, 5, 16, 8, '#3c3c42'], ['e', 6.5, 9, 3.2, 2.3, '#e05020'], ['e', 13.5, 9, 3.2, 2.3, '#e05020'],
    ['e', 6.5, 9, 1.9, 1.3, '#ffb040'], ['e', 13.5, 9, 1.9, 1.3, '#ffb040'], [2, 13.2, 16, 4.3, '#1c1c20'], ['e', 5, 15.3, 1.1, 1.1, '#9a9aa0'], ['e', 10, 15.3, 1.1, 1.1, '#9a9aa0'], ['e', 15, 15.3, 1.1, 1.1, '#9a9aa0'],
    ['e', 6.5, 4.2, 1.2, 1.6, '#fff', 0.28], ['e', 13.5, 3.2, 1.2, 1.8, '#fff', 0.25]] },
  azeite: { nome: 'Azeite derramado', mec: 'Escorregadio', flat: true, ops: [['e', 10, 12.5, 8.2, 3.6, '#b89a20'], ['e', 6, 11, 3.5, 1.9, '#b89a20'], ['e', 14.5, 14.2, 3.6, 1.6, '#b89a20'],
    ['e', 7.5, 11.6, 2.4, 0.8, '#f0e070'], ['e', 13, 13.4, 1.5, 0.5, '#d8b830'], ['e', 11, 10.5, 1.2, 0.5, '#e0c840'], ['e', 3, 16, 0.9, 0.9, '#b89a20']] },
  vespa: { nome: 'Vespa estacionada', mec: 'Sólido', ops: [SH, ['e', 5, 15, 2.8, 2.8, '#111'], ['e', 14.5, 15, 2.8, 2.8, '#111'], [13.2, 5, 3, 9, '#4a7a8a'], [12, 3, 5.5, 1.5, '#2a2a2a'],
    ['e', 8.5, 11, 6, 3.6, '#4a7a8a'], [3.5, 7.2, 7, 2, '#2a1a1a'], [5, 11.2, 8, 0.8, '#e8e4d8'], ['e', 5, 15, 1.1, 1.1, '#888'], ['e', 14.5, 15, 1.1, 1.1, '#888'], [16.4, 6.2, 1.3, 2, '#f0e0a0'], [17.5, 3.2, 1.2, 1, '#c0c0c8']] },
  mesa: { nome: 'Mesa de café', mec: 'Sólido', ops: [SH, ['e', 10, 16.6, 4.4, 1.4, '#4a3a28'], [9, 9, 2, 7.6, '#4a3a28'], ['e', 10, 7.2, 7.8, 3.1, '#6a4a28'], ['e', 10, 6.5, 7.2, 2.6, '#8a6a40'], ['e', 9, 6, 5, 1.6, '#a88458', 0.5],
    ['e', 8.2, 6.2, 2.6, 0.8, '#d8d0c0'], [6.6, 3.9, 3.2, 2.4, '#e8e0d0'], ['e', 8.2, 3.9, 1.6, 0.6, '#3a2010'], [9.8, 4.4, 1, 1.4, '#e8e0d0'], [8, 1.3, 0.6, 1.8, '#fff', 0.45], [9.2, 0.8, 0.6, 1.8, '#fff', 0.35]] },
  caixote_tomate: { nome: 'Caixote de tomate', mec: 'Quebrável', ops: [SH, ['e', 6.5, 7.2, 2.4, 2.3, '#c03020'], ['e', 10.5, 6.2, 2.7, 2.5, '#d83a28'], ['e', 14, 7.2, 2.3, 2.2, '#b02818'], ['e', 8.5, 8.4, 2.2, 1.6, '#d04030'],
    ['e', 5.8, 6.4, 0.8, 0.5, '#ff9080', 0.7], ['e', 9.8, 5.3, 0.9, 0.5, '#ff9080', 0.7], [5.8, 4.4, 1.8, 0.9, '#3a7a30'], [10, 3.5, 1.8, 0.9, '#3a7a30'],
    [3, 8.6, 14, 9.6, '#8a6a40'], [3, 11.8, 14, 0.7, '#5a4220'], [3, 14.8, 14, 0.7, '#5a4220'], [3, 8.6, 1.5, 9.6, '#a88458'], [15.5, 8.6, 1.5, 9.6, '#6a4a28'], [3, 8.6, 14, 0.9, '#b89462']] },
  sorvete: { nome: 'Sorvete derretido', mec: 'Escorregadio', flat: true, ops: [['e', 10, 12.8, 8, 3.4, '#e8a0b8'], ['e', 5.5, 11, 3.2, 1.8, '#e8a0b8'], ['e', 15, 14.4, 3.2, 1.5, '#e8a0b8'],
    ['e', 7.5, 12, 2.3, 0.8, '#fff0f4', 0.9], ['e', 12.5, 13.6, 1.4, 0.5, '#fbd0dc'], ['e', 13.2, 8.3, 3.2, 2.6, '#f0c0d0'], ['e', 12.3, 7.6, 1.2, 0.8, '#fff0f4', 0.8], ['e', 13.2, 5.4, 1.3, 1.3, '#c03050'], [13, 3.3, 0.6, 2, '#6a3a20']] },
  maquina: { nome: 'Máquina de massa', mec: 'Sólido', ops: [SH, [3, 17, 3, 1.6, '#3a3e44'], [14, 17, 3, 1.6, '#3a3e44'], [2, 6, 16, 11.2, '#5a6068'], [5, 2.4, 10, 3.8, '#7a8088'], [6.5, 3.4, 7, 1, '#4a5058'], [5.5, 9, 9, 4.6, '#2a2e32'],
    [6.8, 12.8, 0.6, 3, '#e8d8a0'], [8.4, 12.8, 0.6, 3.6, '#e8d8a0'], [10, 12.8, 0.6, 3, '#e8d8a0'], [11.6, 12.8, 0.6, 3.5, '#e8d8a0'], [13, 12.8, 0.6, 2.8, '#e8d8a0'],
    ['e', 15.8, 7.8, 0.9, 0.9, '#e0b040'], ['e', 15.8, 10.2, 0.9, 0.9, '#60c060'], [2, 6.4, 16, 0.8, '#8a9098']] },
  esteira: { nome: 'Esteira', mec: 'Esteira', ops: [SH, [1, 14.6, 18, 2.4, '#4a4e54'], [3, 16.4, 2, 1.8, '#3a3e44'], [15, 16.4, 2, 1.8, '#3a3e44'], [1, 7.8, 18, 7.4, '#2a2a2e'], [1, 7.8, 18, 1.2, '#7a8088'], [1, 13.8, 18, 1.2, '#7a8088'],
    ['e', 2, 11.4, 1.5, 3.7, '#9aa0a8'], ['e', 18, 11.4, 1.5, 3.7, '#9aa0a8'], ...SETAS] },
  massa: { nome: 'Massa crua', mec: 'Grudento', flat: true, ops: [['e', 10, 15, 7, 1, '#c8b880', 0.7], ['e', 10, 12, 7.5, 3.8, '#e8d8a0'], ['e', 5.5, 11.5, 3, 2, '#e8d8a0'], ['e', 14.8, 12.6, 3, 2.2, '#e8d8a0'],
    ['e', 8, 10.4, 3, 0.9, '#fff8d8', 0.85], ['e', 14, 11.4, 1.2, 0.5, '#fff8d8', 0.8], ['e', 4, 15.6, 0.7, 0.5, '#efe4c8'], ['e', 16, 15.4, 0.8, 0.5, '#efe4c8']] },
  parmesao: { nome: 'Roda de parmesão', mec: 'Rolante', ops: [SH, ['e', 10, 14.6, 7.2, 3.2, '#c8a040'], [2.8, 8.8, 14.4, 5.8, '#c8a040'], [2.8, 11.9, 14.4, 0.6, '#a08030'], [6, 12.6, 0.8, 0.8, '#8a6a20'], [11, 13.2, 0.8, 0.8, '#8a6a20'],
    ['e', 10, 8.8, 7.2, 3.2, '#f0d070'], ['e', 8, 8, 2.5, 0.8, '#fff0a0', 0.7], ['e', 12.5, 9.6, 0.9, 0.5, '#c8a040']] },
  caixote_peixe: { nome: 'Caixote de peixe', mec: 'Sólido', ops: [SH, ['e', 8, 6.4, 4.3, 2.1, '#a8b8c0'], [12, 4.8, 2.6, 3.2, '#a8b8c0'], ['e', 13, 7.4, 3, 1.5, '#8a9aa8'], [5.6, 5.5, 0.9, 0.9, '#111'], ['e', 4.5, 8.2, 1.6, 0.8, '#fff', 0.7],
    [3, 8.6, 14, 9.6, '#6a7a82'], [3, 12, 14, 0.7, '#4a5a62'], [3, 15, 14, 0.7, '#4a5a62'], [3, 8.6, 1.5, 9.6, '#8a9aa2'], [15.5, 8.6, 1.5, 9.6, '#4a5a62'], [3, 8.6, 14, 0.9, '#9aaab2']] },
  rede: { nome: 'Rede de pesca', mec: 'Grudento', flat: true, ops: [...REDE, ['e', 3, 4.2, 1.5, 1.5, '#e06020'], ['e', 9.5, 4.2, 1.5, 1.5, '#e06020'], ['e', 16, 4.2, 1.5, 1.5, '#e06020'], [2, 4.8, 16, 0.8, '#6a5a38']] },
  lagosta: { nome: 'Armadilha de lagosta', mec: 'Quebrável', ops: [SH, [3, 8, 14, 9.6, '#7a5a30'], ['e', 10, 8, 7, 2.6, '#8a6a3a'], [4.8, 10, 10.4, 5.6, '#1a0e08'], [4.8, 12.8, 10.4, 0.6, '#7a5a30'], [8.3, 10, 0.6, 5.6, '#7a5a30'], [11.8, 10, 0.6, 5.6, '#7a5a30'],
    ['e', 10, 13.2, 2.8, 1.3, '#d04030'], ['e', 7, 12.2, 1.1, 0.8, '#d04030'], ['e', 13, 12.2, 1.1, 0.8, '#d04030'], [3, 15.4, 14, 0.7, '#a08050'],
    [9.7, 3.6, 0.7, 3.5, '#c8b070'], ['e', 10, 3, 1.7, 1.9, '#e8e4d8'], [8.4, 3.2, 3.2, 0.9, '#c03030']] },
  poca: { nome: "Poça d'água", mec: 'Escorregadio', flat: true, ops: [['e', 10, 12.5, 8.2, 3.6, '#3a6a8a'], ['e', 6, 11, 3.5, 1.9, '#3a6a8a'], ['e', 14.5, 14.2, 3.6, 1.6, '#3a6a8a'],
    ['e', 7.5, 11.6, 2.4, 0.8, '#8ac0e0'], ['e', 13, 13.4, 1.5, 0.5, '#5a8aaa'], ['e', 11, 10.5, 1.2, 0.5, '#6aa0c8'], ['e', 3, 16, 0.9, 0.9, '#3a6a8a']] },
}
// contorno escuro e chanfro de luz/sombra saem sozinhos; peças finas (menos de 2 de largura ou altura) ficam sem contorno
function ob(name, x, y, size) {
  const o = OB[name], k = size / 20
  const elip = (p) => p[0] === 'e', colOf = (p) => (elip(p) ? p[5] : p[4]), alOf = (p) => (elip(p) ? p[6] : p[5])
  const shape = (p, g, col, a) => (elip(p) ? E(p[1], p[2], p[3] + g, p[4] + g, col, a) : R(p[0] - g, p[1] - g, p[2] + 2 * g, p[3] + 2 * g, col, a))
  const grande = (p) => (elip(p) ? p[3] >= 1.5 || p[4] >= 1.5 : p[2] >= 2 && p[3] >= 2)
  c.save(); c.translate(x, y); c.scale(k, k)
  if (!o.flat) E(12, 18.9, 9.4, 2.3, '#000', 0.2)                                    // rodada 4: sombra projetada para baixo e à direita (luz de cima/esquerda)
  for (const p of o.ops) if (colOf(p) === '#000') shape(p, 0, '#000', alOf(p))
  if (!o.flat) for (const p of o.ops) if (alOf(p) === undefined && colOf(p) !== '#000' && grande(p)) shape(p, 0.6, '#140806')
  for (const p of o.ops) {
    if (colOf(p) === '#000') continue
    shape(p, 0, colOf(p), alOf(p) === undefined ? 1 : alOf(p))
    if (!o.flat && !elip(p) && alOf(p) === undefined && p[2] >= 5 && p[3] >= 4) { R(p[0], p[1], p[2], 0.8, '#fff', 0.16); R(p[0], p[1] + p[3] - 0.8, p[2], 0.8, '#000', 0.2) }
  }
  c.restore()
}
// Coloca obstáculos pela célula da grade 13x7: [nome, coluna, linha]. Ordem por linha para sobrepor certo.
function place(list, size = 84) {
  [...list].sort((a, b) => a[2] - b[2]).forEach(([n, col, row]) => ob(n, CELL.x0 + CELL.w * (col + 0.5) - size / 2, CELL.y0 + CELL.h * (row + 0.5) - size * 0.55, size))
}

// ---------- minimapa (como no Isaac): atual = branco, visitada = cinza, vista = só contorno ----------
// Rodada 3: salas com relevo, moldura dupla, ligações entre salas vizinhas e, na ligação com uma porta trancada
// (q.porta === 'trancada'), o garfo com o nó de espaguete. A porta secreta não aparece: sem pista no minimapa.
function minimap(cells, o = {}) {
  const s = o.s || 1, cw = 30 * s, ch = 24 * s, gap = 10 * s, pad = 10 * s
  const xs = cells.map((q) => q.x), ys = cells.map((q) => q.y)
  const mnx = Math.min(...xs), mny = Math.min(...ys)
  const bw = (Math.max(...xs) - mnx + 1) * (cw + gap) - gap + pad * 2
  const bh = (Math.max(...ys) - mny + 1) * (ch + gap) - gap + pad * 2
  const bx = o.x !== undefined ? o.x : W - 34 - bw, by = o.y !== undefined ? o.y : 26
  RR(bx - 2, by - 2, bw + 4, bh + 4, 9 * s, '#140806', 0.9)
  RR(bx, by, bw, bh, 8 * s, '#0c0806', 0.78)
  c.strokeStyle = '#5a4636'; c.lineWidth = 2; c.beginPath(); c.roundRect(bx + 1, by + 1, bw - 2, bh - 2, 8 * s); c.stroke()
  const pos = (q) => [bx + pad + (q.x - mnx) * (cw + gap), by + pad + (q.y - mny) * (ch + gap)]
  const mapa = new Map(cells.map((q) => [q.x + ',' + q.y, q]))
  // ligações: entre salas vizinhas, quando pelo menos uma já foi visitada.
  // Sala especial (com ícone) é beco sem saída: liga só a UMA vizinha comum (de preferência já visitada; ordem: baixo, esquerda, direita, cima).
  const garfos = []
  const vizinhas = (q) => [[0, 1], [-1, 0], [1, 0], [0, -1]].map(([dx, dy]) => mapa.get(q.x + dx + ',' + (q.y + dy))).filter((r) => r && !r.ic)
  const porta = new Map()
  for (const q of cells) if (q.ic) { const vs = vizinhas(q); porta.set(q, vs.find((r) => r.st !== 'vista') || vs[0]) }
  for (const q of cells) for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const r = mapa.get(q.x + dx + ',' + (q.y + dy)); if (!r) continue
    if ((q.ic && porta.get(q) !== r) || (r.ic && porta.get(r) !== q)) continue
    const conhecida = q.st !== 'vista' || r.st !== 'vista'; if (!conhecida) continue
    const visitada = q.st !== 'vista' && r.st !== 'vista'
    const [px, py] = pos(q), cor = visitada ? '#8f8a84' : '#4a443e'
    const [lx, ly, lw, lh] = dx ? [px + cw, py + ch / 2 - 3 * s, gap, 6 * s] : [px + cw / 2 - 3 * s, py + ch, 6 * s, gap]
    R(lx, ly, lw, lh, '#140806'); R(lx + (dx ? 0 : s), ly + (dx ? s : 0), lw - (dx ? 0 : 2 * s), lh - (dx ? 2 * s : 0), cor)
    if ([q, r].some((z) => z.porta === 'trancada')) garfos.push([lx + lw / 2 - 6 * s, ly + lh / 2 - 6 * s])
  }
  for (const q of cells) {
    const [px, py] = pos(q)
    R(px - s, py - s, cw + 2 * s, ch + 2 * s, '#140806')
    if (q.st === 'atual') { R(px, py, cw, ch, '#f2eee4'); R(px, py, cw, s, '#fff'); R(px, py + ch - 2 * s, cw, 2 * s, '#c8c2b6') }
    else if (q.st === 'visitada') { R(px, py, cw, ch, '#8f8a84'); R(px, py, cw, s, '#aaa59e'); R(px, py + ch - 2 * s, cw, 2 * s, '#6e6a64') }
    else { R(px, py, cw, ch, '#1a1614', 0.6); SR(px + 1, py + 1, cw - 2, ch - 2, '#8a847c', 2 * s) }
    if (q.ic) BM(ICON[q.ic], 2 * s, px + (cw - 16 * s) / 2, py + (ch - 16 * s) / 2, R, true)
  }
  for (const [gx, gy] of garfos) BM(ICON.garfo, 1.5 * s, gx, gy, R, true)                      // porta trancada: garfo sobre a ligação
  return { bx, by, bw, bh }
}
