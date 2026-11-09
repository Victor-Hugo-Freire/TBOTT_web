'use strict'
// Salas (5 comuns + 9 especiais) e pranchas do protótipo da issue #18. Depende de sprite.js e lib.js.

const cell = (col, row) => ({ x: CELL.x0 + CELL.w * (col + 0.5), y: CELL.y0 + CELL.h * (row + 0.5) })
const mm = (...l) => l.map(([x, y, st, ic, porta]) => ({ x, y, st, ic, porta }))   // porta: 'trancada' desenha o garfo na ligação
// Sala especial: ela no centro do mapa, ligada a uma sala comum visitada logo abaixo
const mmEsp = (ic) => mm([0, 0, 'atual', ic], [0, 1, 'visitada'], [-1, 1, 'visitada'], [1, 1, 'vista'], [0, 2, 'visitada'])

// Monta uma sala comum: 4 portas abertas, obstáculos pela grade, Tung Tung no centro e minimapa no canto
function comum(P, obstaculos, mapa) {
  baseRoom(P); wallDecor(P); doorsAll(P); place(obstaculos); lighting(P); vignette(); tung(CENTER.x, 605); minimap(mapa)
}
// Sala especial: só a porta temática (embaixo). O resto é parede, porque essas salas são becos sem saída.
function especial(P, kind, props, depois, mapa) {
  baseRoom(P); door('bottom', kind, 'open', P); props(); lighting(P); vignette(); if (depois) depois(); tung(CENTER.x, 605); minimap(mapa)
}

const brazier = (x, y) => { R(x - 22, y, 44, 12, '#2a2a2e'); R(x - 16, y + 12, 32, 12, '#3a3a40'); R(x - 4, y + 24, 8, 22, '#2a2a2e'); R(x - 20, y + 44, 40, 6, '#2a2a2e') }
const flame = (x, y) => { glow(x, y - 10, 90, '255,150,50', 0.35); R(x - 12, y - 24, 24, 24, '#e05a20'); R(x - 7, y - 34, 14, 22, '#f0a030'); R(x - 3, y - 28, 6, 14, '#ffe080') }
const candle = (x, y) => { R(x - 5, y, 10, 34, '#f4ecd0'); R(x - 5, y, 10, 4, '#d8cca8') }
const candleFlame = (x, y) => { glow(x, y - 8, 110, '255,200,100', 0.35); E(x, y - 6, 4, 8, '#ffd060'); E(x, y - 4, 2, 4, '#fff4c0') }
const pedestal = (x, y) => { R(x - 30, y, 60, 46, '#8a8478'); R(x - 38, y - 8, 76, 12, '#a8a296'); R(x - 30, y + 44, 60, 6, '#6a665c') }

const SALAS = [
  // ===== 5 salas comuns, uma por andar =====
  { id: 'sala-01-cantina', titulo: 'Andar 1 · Cantina', nota: 'Adega de tijolo e madeira (é a sala inicial atual). Obstáculos: barril (sólido), garrafão (quebrável), barril deitado (rolante) e vinho (escorregadio).',
    desenhar: () => comum(PAL.cantina, [['barril', 1, 1], ['barril', 2, 1], ['barril', 1, 2], ['barril', 11, 1], ['barril', 10, 1], ['barril', 11, 2], ['barril', 1, 5], ['barril', 11, 5], ['garrafao', 3, 5], ['garrafao', 9, 1], ['vinho', 4, 5], ['vinho', 9, 2], ['barril_deitado', 8, 5], ['barril_deitado', 5, 1]],
      mm([0, 0, 'atual'], [0, -1, 'visitada'], [-1, 0, 'visitada'], [1, 0, 'vista'], [0, 1, 'vista'], [-1, -1, 'vista', 'cloche'])) },
  { id: 'sala-02-cucina', titulo: 'Andar 2 · Cucina', nota: 'Cozinha de trattoria, azulejo e piso xadrez. Obstáculos: balcão (sólido), saco de farinha (quebrável), chapa quente (quente) e azeite (escorregadio).',
    desenhar: () => comum(PAL.cucina, [['balcao', 3, 1], ['balcao', 4, 1], ['balcao', 8, 1], ['balcao', 9, 1], ['chapa', 2, 2], ['chapa', 10, 2], ['saco', 2, 5], ['saco', 10, 5], ['azeite', 4, 5], ['azeite', 8, 5]],
      mm([0, 0, 'atual'], [0, 1, 'visitada'], [1, 0, 'visitada'], [-1, 0, 'vista', 'grao'], [0, -1, 'vista'], [1, 1, 'vista', 'bola'])) },
  { id: 'sala-03-piazza', titulo: 'Andar 3 · Piazza', nota: 'Praça à noite, paralelepípedo e fachadas. Obstáculos: Vespa e mesa (sólidos), caixote de tomate (quebrável) e sorvete derretido (escorregadio).',
    desenhar: () => comum(PAL.piazza, [['vespa', 2, 1], ['vespa', 10, 5], ['mesa', 4, 2], ['mesa', 8, 4], ['mesa', 10, 1], ['caixote_tomate', 2, 5], ['caixote_tomate', 11, 1], ['sorvete', 4, 5], ['sorvete', 8, 1]],
      mm([0, 0, 'atual'], [-1, 0, 'visitada'], [0, 1, 'visitada'], [1, 0, 'visitada'], [1, -1, 'vista', 'boss'], [0, -1, 'vista'], [-2, 0, 'vista'])) },
  { id: 'sala-04-pastificio', titulo: 'Andar 4 · Pastificio', nota: 'Fábrica de massa, concreto com faixa de alerta. Obstáculos: máquina (sólido), esteira (empurra), massa crua (grudento) e roda de parmesão (rolante).',
    desenhar: () => comum(PAL.pastificio, [['maquina', 2, 1], ['maquina', 10, 1], ['maquina', 2, 5], ['maquina', 10, 5], ['esteira', 3, 3], ['esteira', 4, 3], ['esteira', 8, 3], ['esteira', 9, 3], ['massa', 3, 1], ['massa', 9, 5], ['parmesao', 5, 5], ['parmesao', 7, 1]],
      mm([0, 0, 'atual'], [0, 1, 'visitada'], [0, -1, 'visitada'], [1, 0, 'vista', 'tubarao'], [-1, 0, 'vista', 'zz'], [1, -1, 'vista'])) },
  { id: 'sala-05-porto', titulo: 'Andar 5 · Porto', nota: 'Cais à beira-mar, tábuas de doca. Obstáculos: caixote de peixe (sólido), rede (grudento), armadilha de lagosta (quebrável) e poça d\'água (escorregadio).',
    desenhar: () => comum(PAL.porto, [['caixote_peixe', 1, 1], ['caixote_peixe', 2, 1], ['caixote_peixe', 11, 5], ['caixote_peixe', 10, 5], ['rede', 4, 2], ['rede', 8, 4], ['lagosta', 2, 5], ['lagosta', 10, 1], ['poca', 5, 5], ['poca', 7, 1]],
      mm([0, 0, 'atual'], [0, 1, 'visitada'], [1, 0, 'visitada'], [-1, 0, 'visitada'], [0, -1, 'vista', 'boss'], [2, 0, 'vista'])) },

  // ===== salas especiais =====
  { id: 'sala-especial-chefe', titulo: 'Sala do Chefe', nota: 'Luta com o chefe do andar. Aro vermelho no piso, estandartes e braseiros. Ao vencer, abre a escada para o próximo andar.',
    desenhar: () => {
      const P = PAL.chefe
      especial(P, 'chefe', () => {
        EL(720, 590, 430, 210, '#8a2a20', 8, 0.55); EL(720, 590, 330, 160, '#8a2a20', 3, 0.4)
        POLY([[640, 500], [640, 400], [680, 450], [720, 385], [760, 450], [800, 400], [800, 500]], '#8a2a20', 0.35); R(640, 480, 160, 20, '#a8501e', 0.35)
        for (const x of [380, 540, 900, 1060]) { R(x - 28, 36, 56, 92, '#8a1a18'); R(x - 28, 36, 56, 5, '#2a0c0a'); POLY([[x - 28, 128], [x, 150], [x + 28, 128]], '#8a1a18'); BM({ pal: ICON.boss.pal, rows: ICON.boss.rows }, 3, x - 12, 62, R, true) }
        for (const [x, y] of [[200, 330], [1240, 330], [200, 770], [1240, 770]]) brazier(x, y)
      }, () => { for (const [x, y] of [[200, 330], [1240, 330], [200, 770], [1240, 770]]) flame(x, y + 4) }, mmEsp('boss'))
    } },
  { id: 'sala-especial-tesouro', titulo: 'Sala do Tesouro', nota: 'Um item grátis no pedestal comum (aqui, o Café Duplo). Madeira clara, tapete vermelho e prateleiras com potes. A tampa de prato (cloche) é só o ícone do minimapa.',
    desenhar: () => {
      especial(PAL.tesouro, 'tesouro', () => {
        R(645, 520, 150, 323, '#7a1a1a'); R(645, 520, 6, 323, '#e0b040'); R(789, 520, 6, 323, '#e0b040'); R(645, 520, 150, 6, '#e0b040')
        for (const x of [250, 990]) {
          for (const y of [236, 188]) { R(x, y, 200, 10, '#4a3018'); for (let k = 0; k < 6; k++) { R(x + 8 + k * 32, y - 24, 22, 24, pick(['#c04030', '#d8a030', '#4a8a40', '#8a3a6a'], k + x + y)); R(x + 8 + k * 32, y - 27, 22, 3, '#e8e0d0') } }
        }
        pedestalComItem('base', 'cafe-duplo', 720, 450)                                  // pedestal comum (itens/_comum) e o item real
      }, null, mmEsp('cloche'))
    } },
  { id: 'sala-especial-loja', titulo: 'Loja', nota: 'Itens pagos com grão de café. Toldo listrado, balcão e sacas de grãos. A porta é sempre aberta.',
    desenhar: () => {
      especial(PAL.loja, 'loja', () => {
        for (let k = 0, x = 300; x < 1140; k++, x += 30) { if (x + 30 > 640 && x < 800) continue; const col = ['#2f7a4a', '#e8e4d8', '#b03030'][k % 3]; R(x, 150, 30, 46, col); E(x + 15, 196, 15, 10, col) }
        R(440, 350, 560, 62, '#6a4220'); R(440, 350, 560, 14, '#8a5a30'); R(440, 408, 560, 4, '#3a2210')
        const itens = [(x) => { R(x - 10, 322, 20, 26, '#4a8ad0'); R(x - 4, 312, 8, 10, '#4a8ad0'); R(x - 6, 308, 12, 4, '#c09060') }, (x) => { R(x - 16, 322, 32, 26, '#c03a4a'); R(x - 16, 322, 6, 26, '#8a1a28'); R(x - 8, 328, 20, 3, '#f0e0c0') }, (x) => { BM({ pal: ICON.cloche.pal, rows: ICON.cloche.rows }, 4, x - 16, 316, R, true) }]
        itens.forEach((fn, i) => { if (i === 1) return; const x = 540 + i * 180; fn(x); RR(x - 30, 420, 60, 24, 4, '#e8dcc0'); pixelImg(IMG.cons.graoHud, x - 27, 422, 0.34); pxTexto(String(2 + i), x + 6, 425, 2.4, '#3a2210', 'left', null) })   // rodada 4: grão refinado na etiqueta
        pedestalComItem('loja', 'tiramisu', 720, 462)                                       // pedestal com etiqueta de preço (4 grãos) e o Tiramisu
        for (const x of [190, 1210]) { RR(x - 40, 730, 80, 80, 14, '#a8946a'); R(x - 30, 722, 60, 14, '#8a7650'); pixelImg(IMG.cons.grupos, x - 33, 736, 0.5, 264, 0, 132, 132) }   // sacas com 5 grãos
      }, null, mmEsp('grao'))
    } },
  { id: 'sala-especial-pacto', titulo: 'Sala do Pacto', nota: 'Troca vida máxima por um item forte. Piscina escura, aleta do Tralalero e os tênis dele de oferenda. Proposta: no lugar do Padrino.',
    desenhar: () => {
      especial(PAL.pacto, 'pacto', () => {
        E(720, 440, 290, 100, '#0c2a40'); EL(720, 440, 290, 100, '#2a6a8a', 5); EL(720, 442, 210, 64, '#4a8aa8', 2, 0.5); EL(720, 442, 120, 36, '#4a8aa8', 2, 0.4)
        POLY([[686, 440], [724, 352], [760, 440]], '#3a6a8a'); POLY([[724, 352], [760, 440], [738, 440]], '#2a5a7a'); R(710, 396, 3, 22, '#8ab8d8', 0.5)
        for (const [i, x] of [[0, 500], [1, 548], [2, 596]].map(([i, x]) => [i, x])) { R(x, 540 + i * 2, 38, 12, '#f0f0f0'); R(x + 4, 530 + i * 2, 24, 12, '#2a6ac0'); R(x + 26, 536 + i * 2, 12, 8, '#2a6ac0'); R(x + 6, 536 + i * 2, 18, 2, '#fff') }
        for (const x of [430, 1010]) { pedestal(x, 420); R(x - 14, 380, 28, 28, '#e8c040'); R(x - 14, 380, 28, 4, '#fff0a0', 0.7); BM({ pal: { 1: '#2a2a2a' }, rows: ICON.vida.rows }, 4, x - 16, 480, R, true) }
        for (const [x, y, r] of [[560, 300, 5], [880, 330, 7], [640, 700, 6], [820, 640, 4]]) EL(x, y, r, r, '#5a9ac0', 2, 0.6)
      }, () => glow(720, 440, 340, '60,140,180', 0.18), mmEsp('tubarao'))
    } },
  { id: 'sala-especial-mamae', titulo: 'Sala da Mamãe', nota: 'O par "do bem" do pacto: um item grátis e um prato quente. Aparece no lugar do pacto se o jogador venceu o chefe sem levar dano.',
    desenhar: () => {
      especial(PAL.mamae, 'mamae', () => {
        R(540, 376, 360, 84, '#e8e0d0')
        for (let j = 0; j < 4; j++) for (let i = 0; i < 15; i++) if ((i + j) % 2) R(540 + i * 24, 376 + j * 21, 24, 21, '#c03a2a')
        R(540, 456, 360, 8, '#6a4220'); R(556, 464, 14, 42, '#6a4220'); R(870, 464, 14, 42, '#6a4220')
        R(500, 412, 28, 34, '#7a4a24'); R(912, 412, 28, 34, '#7a4a24')
        E(720, 414, 58, 20, '#f4f0e8'); E(720, 412, 40, 13, '#c03020')
        for (let k = 0; k < 9; k++) R(694 + k * 6, 404 + (k % 2) * 6, 5, 3, '#e8c860')
        R(716, 404, 8, 4, '#3a8a3a'); candle(590, 340); candle(850, 340)
        for (const x of [250, 1190]) { R(x, 164, 3, 76, '#6a4a2a'); for (let k = 0; k < 4; k++) E(x + (k % 2 ? 7 : -7), 186 + k * 18, 8, 11, k % 2 ? '#f0e8d0' : '#c03020') }
        R(380, 186, 70, 56, '#c8a040'); R(386, 192, 58, 44, '#3a2a4a'); E(415, 206, 11, 11, '#f0d060'); R(406, 214, 18, 20, '#c8a8d0')
        R(300, 700, 70, 70, '#8a5a30'); R(310, 690, 50, 14, '#e8dcc0'); R(1070, 700, 70, 70, '#8a5a30'); R(1080, 690, 50, 14, '#e8dcc0')
        pedestal(1100, 400); R(1086, 360, 28, 28, '#e8c040'); R(1086, 360, 28, 4, '#fff0a0', 0.7)
      }, () => { candleFlame(590, 340); candleFlame(850, 340); glow(720, 410, 420, '255,220,150', 0.18) }, mmEsp('bem'))
    } },
  { id: 'sala-especial-fliperama', titulo: 'Fliperama', nota: 'Paga grão de café e sorteia uma bolinha. Tambor de bingo, funil de café e lâmpadas de festa.',
    desenhar: () => {
      especial(PAL.fliperama, 'fliperama', () => {
        R(G.wl, 68, G.wr - G.wl, 2, '#1a0e1e')
        R(650, 498, 12, 74, '#6a4a28'); R(778, 498, 12, 74, '#6a4a28'); R(640, 566, 160, 12, '#6a4a28')
        E(720, 420, 80, 80, '#1a1220', 0.92); EL(720, 420, 80, 80, '#e8c040', 6)
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; R(720 + Math.cos(a) * 40 - 1.5, 420 + Math.sin(a) * 40 - 1.5, 3, 3, '#e8c040'); c.strokeStyle = '#e8c04088'; c.lineWidth = 2; c.beginPath(); c.moveTo(720, 420); c.lineTo(720 + Math.cos(a) * 76, 420 + Math.sin(a) * 76); c.stroke() }
        for (let k = 0; k < 11; k++) { const a = nz(k) * 6.28, r = nz(k + 20) * 52; E(720 + Math.cos(a) * r, 420 + Math.sin(a) * r, 11, 11, pick(['#e04848', '#f0c040', '#4a8ad0', '#4aa860'], k)); E(720 + Math.cos(a) * r, 420 + Math.sin(a) * r, 4, 4, '#f4f0e8') }
        R(800, 415, 56, 8, '#e8c040'); E(860, 419, 11, 11, '#e8c040')
        POLY([[690, 524], [750, 524], [732, 566], [708, 566]], '#9a6a30'); POLY([[690, 524], [698, 524], [712, 566], [708, 566]], '#c89050')
        for (const x of [300, 1130]) { RR(x - 30, 700, 60, 70, 10, '#8a2a3a'); BM({ pal: ICON.bola.pal, rows: ICON.bola.rows }, 5, x - 20, 718, R) }
        for (let x = 100; x < 1340; x += 56) E(x, 70, 8, 8, (x / 56) % 2 ? '#ffd860' : '#ff6080')
      }, () => { for (let x = 100; x < 1340; x += 56) glow(x, 70, 30, (x / 56) % 2 ? '255,216,96' : '255,96,128', 0.3) }, mmEsp('bola'))
    } },
  { id: 'sala-especial-palco', titulo: 'Palco (desafio)', nota: 'Pega o item, a cortina fecha e vêm 2 ondas de inimigos. Palco, cortinas de veludo e refletor. Só entra com a vida cheia.',
    desenhar: () => {
      especial(PAL.palco, 'palco', () => {
        R(620, 400, 200, 443, '#6a1424'); R(620, 400, 6, 443, '#e0b040'); R(814, 400, 6, 443, '#e0b040')
        for (const [x0, x1] of [[300, 630], [810, 1140]]) {
          R(x0, 300, x1 - x0, 70, '#8a5a30'); R(x0, 370, x1 - x0, 22, '#4a2e18')
          for (let k = x0 + 12; k < x1 - 20; k += 40) R(k, 376, 14, 8, '#ffe070')
          for (let k = x0; k < x1; k += 55) R(k, 300, 2, 70, '#000', 0.25)
        }
        for (const x of [300, 1010]) { R(x, 50, 130, 322, '#8a1a2a'); for (let k = 0; k < 130; k += 16) R(x + k, 50, 8, 322, '#b02a3a', 0.6) }
        for (const [x0, x1] of [[300, 630], [810, 1140]]) { R(x0, 50, x1 - x0, 28, '#6a1424'); for (let k = x0; k + 52 <= x1; k += 52) E(k + 26, 78, 26, 14, '#6a1424'); R(x0, 76, x1 - x0, 4, '#e0b040') }
        BM({ pal: ICON.mascara.pal, rows: ICON.mascara.rows }, 9, 684, 408, R, true)
      }, () => POLY([[720, 150], [580, 570], [860, 570]], '#ffe8a0', 0.1), mmEsp('mascara'))
    } },
  { id: 'sala-especial-adega-secreta', titulo: 'Adega Secreta', nota: 'Escondida: a porta é uma rachadura na parede (abre com 3 golpes do bastão). Garrafas, barris e um baú.',
    desenhar: () => {
      especial(PAL.adega, 'adega', () => {
        for (const x0 of [180, 860]) {
          R(x0, 172, 400, 96, '#3a2414'); R(x0, 172, 400, 4, '#5a3a1e')
          for (let j = 0; j < 3; j++) for (let i = 0; i < 10; i++) { const cx = x0 + 22 + i * 39, cy = 192 + j * 29; E(cx, cy, 11, 11, pick(['#2a4a2a', '#4a2a1a', '#3a5a3a'], i + j * 10 + x0)); E(cx, cy, 5, 5, '#0a0604') }
        }
        place([['barril', 1, 1], ['barril', 11, 1], ['barril', 1, 5], ['vinho', 3, 5], ['garrafao', 9, 5]], 100)
        R(1060, 690, 110, 56, '#6a3a1a'); R(1060, 664, 110, 30, '#8a4a22'); R(1060, 664, 110, 4, '#a8662e'); R(1070, 664, 8, 82, '#2a1a10'); R(1152, 664, 8, 82, '#2a1a10'); R(1108, 684, 14, 16, '#e0b040')
        R(200, 410, 6, 36, '#2a2a2a'); R(190, 446, 26, 30, '#3a3a3a'); R(194, 450, 18, 22, '#f0c870')
        pedestalComItem('adega', 'elixir-eletrico', 720, 466)                                 // o item raro, com aro dourado no chão
      }, () => glow(203, 462, 150, '255,190,100', 0.3), mmEsp('garrafa'))
    } },
  { id: 'sala-especial-descanso', titulo: 'Sala de Descanso', nota: 'Rede de dormir: usar uma vez recupera toda a vida. Tapete, abajur e a placa "Non disturbare". A porta tem nó de espaguete (1 garfo).',
    desenhar: () => {
      especial(PAL.descanso, 'descanso', () => {
        E(720, 660, 340, 120, '#5a3a50'); EL(720, 660, 270, 90, '#c8a060', 5); EL(720, 660, 190, 60, '#c8a060', 2, 0.6)
        R(250, 330, 14, 140, '#4a2e18'); R(600, 330, 14, 140, '#4a2e18'); R(250, 330, 14, 4, '#fff', 0.15); R(600, 330, 14, 4, '#fff', 0.15)
        // rede de dormir: tecido em forma de barco preso aos postes por cordas, com listras e travesseiro
        const tecido = () => { c.beginPath(); c.moveTo(272, 372); c.quadraticCurveTo(432, 430, 592, 372); c.quadraticCurveTo(432, 540, 272, 372); c.closePath() }
        E(432, 505, 175, 22, '#000', 0.25)
        c.strokeStyle = '#e8d8b0'; c.lineWidth = 2
        for (const [px, ex] of [[257, 273], [607, 591]]) for (const ey of [364, 372, 380]) { c.beginPath(); c.moveTo(px, 345); c.lineTo(ex, ey); c.stroke() }
        c.lineJoin = 'round'; tecido(); c.strokeStyle = '#140806'; c.lineWidth = 8; c.stroke(); c.fillStyle = '#c85a4a'; c.fill()
        c.save(); tecido(); c.clip()
        for (let x = 272; x < 592; x += 26) R(x, 372, 13, 170, '#e8907a', 0.55)
        R(272, 372, 320, 6, '#fff', 0.2); R(272, 440, 320, 110, '#000', 0.16)
        c.restore(); c.lineJoin = 'miter'
        c.save(); c.translate(342, 410); c.rotate(-0.12); RR(-26, -11, 52, 22, 11, '#f0e8d8'); RR(-26, -11, 52, 6, 3, '#fff', 0.6); c.strokeStyle = '#a89878'; c.lineWidth = 2; c.beginPath(); c.roundRect(-26, -11, 52, 22, 11); c.stroke(); c.restore()
        R(1040, 424, 80, 52, '#6a4a2a'); R(1040, 424, 80, 6, '#8a6a40'); R(1074, 384, 12, 40, '#3a2a1a'); R(1058, 350, 44, 36, '#f0d890'); R(1058, 350, 44, 5, '#fff4c8')
        R(640, 740, 22, 10, '#c03a4a'); R(668, 744, 22, 10, '#c03a4a')
      }, () => { glow(1080, 370, 190, '255,220,140', 0.32); TXT('Z', 420, 330, 34, '#9ab0e0', 800); TXT('z', 450, 304, 26, '#7e98d0', 800); TXT('z', 474, 284, 18, '#7e98d0', 800) }, mmEsp('zz'))
    } },
]

// ---------- pranchas ----------
const PROPS_BOARD = { fundo: '#14100e', texto: '#e8dccb', suave: '#9a8a78' }
const MEC = { Sólido: '#8a8a8a', Quebrável: '#d09040', Rolante: '#5aa0d0', Escorregadio: '#40b0a0', Quente: '#e05a30', Grudento: '#a060c0', Esteira: '#e0c040' }
const KINDS = [
  ['comum', 'Porta comum', 'Fecha com os inimigos e abre ao limpar a sala. Trancada: nó de espaguete, sai com um garfo.'],
  ['chefe', 'Sala do Chefe', 'Grade de ferro enquanto o chefe vive. Ícone: coroa vermelha.'],
  ['tesouro', 'Sala do Tesouro', 'Madeira clara e dourado. A partir do andar 2 vem com nó de espaguete (1 garfo).'],
  ['loja', 'Loja', 'Toldo listrado. Sempre aberta; compra com grão de café.'],
  ['pacto', 'Sala do Pacto', 'Azul-escuro, boca de tubarão. Fecha com dentes.'],
  ['mamae', 'Sala da Mamãe', 'Madeira clara e cortina de renda. Aparece no lugar do pacto.'],
  ['fliperama', 'Fliperama', 'Funil de café. Gasta 1 grão para abrir.'],
  ['palco', 'Palco (desafio)', 'Cortina de teatro. Só entra com a vida cheia.'],
  ['adega', 'Adega Secreta', 'Escondida (marca de giz), trincada e aberta. Abre com 3 golpes do bastão em ritmo.'],
  ['descanso', 'Sala de Descanso', 'Nó de espaguete, gasta 1 garfo.'],
]

function pranchaPortas() {
  const P = PAL.cantina
  R(0, 0, W, 2900, PROPS_BOARD.fundo)
  TXT('Portas: tipo × estado', 60, 70, 40, PROPS_BOARD.texto, 700)
  TXT('Cada porta é desenhada uma vez, de cima, e girada para os outros três lados.', 60, 106, 22, PROPS_BOARD.suave, 400)
  // sala miniatura com as 4 portas
  c.save(); c.translate(60, 140); c.scale(0.4, 0.4); baseRoom(P); doorsAll(P); lighting(P); c.restore()
  TXT('Os 4 lados (porta comum aberta)', 60, 140 + 410 + 34, 22, PROPS_BOARD.suave, 400)
  const y1 = 640
  for (const [i, nome] of ['Aberta', 'Fechada (combate)', 'Trancada / condição'].entries()) TXT(nome, 640 + i * 280, y1 - 20, 24, PROPS_BOARD.texto, 700, 'center')
  KINDS.forEach(([kind, nome, desc], r) => {
    const y0 = y1 + r * 225
    TXT(nome, 60, y0 + 40, 28, PROPS_BOARD.texto, 700)
    c.fillStyle = PROPS_BOARD.suave; c.font = '400 19px "Segoe UI", system-ui, sans-serif'; c.textAlign = 'left'
    desc.match(/.{1,34}(\s|$)/g).forEach((ln, k) => c.fillText(ln.trim(), 60, y0 + 74 + k * 26))
    ;['open', 'closed', 'locked'].forEach((st, i) => {
      const xc = 640 + i * 280
      R(xc - 112, y0 - 10, 224, 180, '#241a14'); for (let k = 0; k < 7; k++) R(xc - 112, y0 - 10 + k * 26, 224, 2, '#140c08')
      door('top', kind, st, P, { c: xc, ex: y0, D: 145 })
    })
  })
}

function pranchaSecreta() {
  const P = PAL.cantina
  R(0, 0, W, 1640, PROPS_BOARD.fundo)
  TXT('Sala secreta: a porta nos 4 lados, só de perto', 60, 70, 40, PROPS_BOARD.texto, 700)
  TXT('A mesma peça vale na sala de origem (lado do esconderijo) e na adega (lado oposto, a porta de volta).', 60, 106, 22, PROPS_BOARD.suave, 400)
  const centros = { top: [720, 222], bottom: [720, 886], left: [92, 569], right: [1348, 569] }
  const lados = [['top', 'Em cima'], ['bottom', 'Embaixo'], ['left', 'Esquerda'], ['right', 'Direita']]
  const estados = [['hidden', '1 · Escondida', 'de perto: marca de giz e tijolo solto'], ['closed', '2 · Trincada', 'depois do 1º golpe'], ['open', '3 · Aberta', 'depois do 3º golpe']]
  estados.forEach(([, nome, sub], i) => { TXT(nome, 60 + i * 455 + 215, 160, 26, PROPS_BOARD.texto, 700, 'center'); TXT(sub, 60 + i * 455 + 215, 190, 19, PROPS_BOARD.suave, 400, 'center') })
  lados.forEach(([sd, nomeLado], r) => estados.forEach(([st], i) => {
    const x = 60 + i * 455, y = 215 + r * 325
    c.save(); c.beginPath(); c.rect(x, y, 430, 300); c.clip()
    c.translate(x + 215 - centros[sd][0], y + 150 - centros[sd][1])
    baseRoom(P); door(sd, 'adega', st, P); lighting(P)
    c.restore(); SR(x, y, 430, 300, '#3a2e27', 2)
    if (i === 0) { RR(x + 10, y + 10, 104, 30, 15, '#000', 0.65); TXT(nomeLado, x + 62, y + 31, 18, PROPS_BOARD.texto, 700, 'center') }
  }))
  TXT('Regra: de longe, a parede é igual às outras. De perto (até 1 quadrado), aparece a marca.', 60, 1560, 24, PROPS_BOARD.texto, 700)
  TXT('Sem som e sem pista no minimapa. Só a observação e o bastão.', 60, 1598, 20, PROPS_BOARD.suave, 400)
}

function pranchaMinimapa() {
  R(0, 0, W, 1260, PROPS_BOARD.fundo)
  TXT('Minimapa (como no Isaac)', 60, 70, 40, PROPS_BOARD.texto, 700)
  TXT('Fica no canto superior direito da tela. Cada sala é um retângulo; os ícones aparecem quando a sala fica conhecida.', 60, 106, 22, PROPS_BOARD.suave, 400)
  TXT('Estados da sala', 60, 170, 26, PROPS_BOARD.texto, 700)
  minimap(mm([0, 0, 'atual'], [1, 0, 'visitada'], [2, 0, 'vista']), { s: 2, x: 60, y: 190 })
  ;[['Atual (branco)', '#f2eee4'], ['Visitada (cinza)', '#8f8a84'], ['Vista, não visitada (só contorno)', '#1a1614']].forEach(([t, cor], i) => {
    R(60 + 20, 310 + i * 34, 24, 18, cor); SR(60 + 21, 311 + i * 34, 22, 16, '#8a847c', 2, cor === '#1a1614' ? 1 : 0)
    TXT(t, 60 + 56, 325 + i * 34, 20, PROPS_BOARD.suave, 400)
  })
  TXT('Desconhecida: não aparece.', 60 + 20, 430, 20, PROPS_BOARD.suave, 400)
  TXT('Exemplo de andar', 60, 500, 26, PROPS_BOARD.texto, 700)
  minimap(mm([0, 0, 'atual'], [0, 1, 'visitada'], [1, 1, 'visitada'], [-1, 1, 'visitada'], [0, 2, 'visitada'], [1, 2, 'visitada'], [-1, 0, 'vista'], [1, 0, 'vista', 'bola'], [2, 1, 'vista', 'cloche', 'trancada'], [-2, 1, 'vista', 'grao'], [0, 3, 'vista', 'boss']), { s: 2, x: 60, y: 520 })
  TXT('Ligações e portas', 60, 1000, 26, PROPS_BOARD.texto, 700)
  minimap(mm([0, 0, 'visitada'], [1, 0, 'atual'], [2, 0, 'vista', 'cloche', 'trancada'], [3, 0, 'vista', 'boss']), { s: 2, x: 60, y: 1020 })
  ;['Ligação clara: as duas salas já foram visitadas.', 'Ligação escura: só uma das duas foi visitada.', 'Garfo na ligação: porta trancada com nó de espaguete (gasta 1 garfo).', 'Coroa vermelha: Sala do Chefe.', 'Adega Secreta: nenhuma marca, de propósito.'].forEach((t, i) => TXT(t, 470, 1048 + i * 34, 20, PROPS_BOARD.suave, 400))
  TXT('Ícones das salas', 780, 170, 26, PROPS_BOARD.texto, 700)
  const L = [['boss', 'Sala do Chefe'], ['cloche', 'Sala do Tesouro'], ['grao', 'Loja'], ['tubarao', 'Sala do Pacto'], ['bem', 'Sala da Mamãe'], ['bola', 'Fliperama'], ['mascara', 'Palco (desafio)'], ['garrafa', 'Adega Secreta (só depois de achada)'], ['zz', 'Sala de Descanso']]
  L.forEach(([ic, nome], i) => {
    const y = 200 + i * 90
    RR(780, y, 80, 70, 8, '#000', 0.5); BM(ICON[ic], 6, 780 + 16, y + 11, R, true)
    TXT(nome, 884, y + 44, 24, PROPS_BOARD.texto, 600)
  })
}

const FLOORS = [
  ['Andar 1 · Cantina', 'cantina', ['barril', 'garrafao', 'barril_deitado', 'vinho']],
  ['Andar 2 · Cucina', 'cucina', ['balcao', 'saco', 'chapa', 'azeite']],
  ['Andar 3 · Piazza', 'piazza', ['vespa', 'mesa', 'caixote_tomate', 'sorvete']],
  ['Andar 4 · Pastificio', 'pastificio', ['maquina', 'esteira', 'massa', 'parmesao']],
  ['Andar 5 · Porto', 'porto', ['caixote_peixe', 'rede', 'lagosta', 'poca']],
]
function pranchaObstaculos() {
  R(0, 0, W, 1280, PROPS_BOARD.fundo)
  TXT('Obstáculos: 7 mecânicas, desenho próprio em cada andar', 60, 70, 40, PROPS_BOARD.texto, 700)
  TXT('Nada de pedra, buraco, espinho, cocô, fogueira ou TNT. A mecânica é a mesma em todos os andares; só muda o desenho.', 60, 106, 22, PROPS_BOARD.suave, 400)
  const cw = 270, x0 = 45
  FLOORS.forEach(([titulo, key, lista], i) => {
    const P = PAL[key], x = x0 + i * (cw + 10)
    R(x, 140, cw, 1100, P.floorCols[0]); R(x, 140, cw, 64, P.top)
    TXT(titulo, x + cw / 2, 182, 22, PROPS_BOARD.texto, 700, 'center')
    lista.forEach((n, j) => {
      const y = 220 + j * 255
      R(x + 10, y, cw - 20, 235, '#000', 0.22)
      ob(n, x + cw / 2 - 75, y + 14, 150)
      TXT(OB[n].nome, x + cw / 2, y + 195, 21, PROPS_BOARD.texto, 600, 'center')
      const m = OB[n].mec; RR(x + cw / 2 - 62, y + 203, 124, 26, 13, MEC[m]); TXT(m, x + cw / 2, y + 222, 17, '#140806', 700, 'center')
    })
  })
}

// Rodada 4: garfo e grão refinados (sprites de itens/_comum/consumiveis), no lugar dos ícones 8x8
function pranchaColetaveis() {
  R(0, 0, W, 980, PROPS_BOARD.fundo)
  TXT('Coletáveis no lugar de moeda e chave', 60, 70, 40, PROPS_BOARD.texto, 700)
  TXT('Sprites refinados (mesma grade de 3 px dos outros sprites, contorno fino). O ícone 8x8 continua só no minimapa.', 60, 106, 20, PROPS_BOARD.suave, 400)
  const bloco = (x, icone, hud, nome, linhas, qtd) => {
    RR(x, 130, 640, 420, 14, '#000', 0.4)
    const esc = Math.min(3, 190 / icone.height)                                          // o garfo é alto: escala pela altura disponível (até 3x)
    pixelImg(icone, x + 40 + (170 - icone.width * esc) / 2, 160, esc)
    TXT(nome, x + 250, 220, 34, PROPS_BOARD.texto, 700)
    linhas.forEach((t, i) => TXT(t, x + 250, 262 + i * 32, 21, PROPS_BOARD.suave, 400))
    pixelImg(hud, x + 40, 400, 1); pxTexto(qtd, x + 110, 418, 4, '#f4ecdc')
    TXT('(como aparece no HUD)', x + 40, 500, 18, PROPS_BOARD.suave, 400)
  }
  bloco(60, IMG.cons.grao, IMG.cons.graoHud, 'Grão de café', ['Substitui a moeda.', 'Cai dos inimigos e dos obstáculos', 'quebráveis. Paga a Loja e o Fliperama.'], 'X 05')
  bloco(740, IMG.cons.garfo, IMG.cons.garfoHud, 'Garfo', ['Substitui a chave.', 'Enrola e tira o nó de espaguete:', 'Tesouro (do andar 2 em diante)', 'e Sala de Descanso.'], 'X 01')
  TXT('Garfo abrindo a porta trancada (8 quadros)', 60, 610, 26, PROPS_BOARD.texto, 700)
  for (let i = 0; i < 8; i++) pixelImg(IMG.cons.porta, 60 + i * 164, 630, 0.8, i * 192, 0, 192, 192)
  TXT('Grãos em grupo (1, 3 e 5)', 60, 840, 26, PROPS_BOARD.texto, 700)
  for (let i = 0; i < 3; i++) pixelImg(IMG.cons.grupos, 60 + i * 150, 850, 1, i * 132, 0, 132, 132)
}

// ---------- barra de vida do chefe (rodada 3) ----------
function pranchaBarraChefe() {
  R(0, 0, W, 1500, PROPS_BOARD.fundo)
  TXT('Barra de vida do chefe', 60, 70, 40, PROPS_BOARD.texto, 700)
  TXT('Embaixo, no centro da tela, como no Isaac. Nome na fonte do jogo (SMALL_FONT, só maiúsculas, sem acento) e a coroa vermelha.', 60, 106, 22, PROPS_BOARD.suave, 400)
  const CI = 'CINQUECENTO TURBO', CH = 'CHIMPANZINI BANANINI'
  const estados = [
    [0, 0, 'Cheia', 'Começo da luta.', { hp: 1, nome: CI }],
    [1, 0, 'Dano recebido', 'O pedaço perdido fica claro e some em cerca de meio segundo.', { hp: 0.72, ghost: 0.86, nome: CI }],
    [0, 1, 'Metade, com a marca da fase 2', 'Só nos chefes com 2 fases (Chimpanzini, Tralalero). O Cinquecento não tem fase 2.', { hp: 0.5, marcas: [0.5], nome: CH }],
    [1, 1, 'Fase 2', 'Depois de cruzar a marca, a barra fica laranja e o losango acende.', { hp: 0.38, marcas: [0.5], estado: 'fase2', nome: CH }],
    [0, 2, 'Vulnerável (proposta)', 'Capô aberto do Cinquecento (esfriando): a barra fica menta enquanto ele leva dano extra.', { hp: 0.6, estado: 'vulneravel', nome: CI }],
    [1, 2, 'Quase no fim (quadro A)', 'Abaixo de 20%: a moldura e a barra piscam.', { hp: 0.12, nome: CI }],
    [0, 3, 'Quase no fim (quadro B)', 'O outro quadro do pisca (a cada 250 ms).', { hp: 0.12, piscar: 1, nome: CI }],
    [1, 3, 'Vazia', 'Chefe derrotado: a moldura fica cinza e a Sala do Chefe abre a escada.', { hp: 0, estado: 'vazia', nome: CI }],
  ]
  for (const [col, row, t, sub, o] of estados) {
    const x = 60 + col * 700, y = 290 + row * 200
    R(x - 20, y - 70, 664, 198, '#000', 0.25)
    bossBar({ x, y, ...o })
    TXT(t, x, y + 80, 24, PROPS_BOARD.texto, 700)
    sub.match(/.{1,52}(\s|$)/g).forEach((ln, k) => TXT(ln.trim(), x, y + 104 + k * 20, 17, PROPS_BOARD.suave, 400))
  }
  TXT('Como mostrar o chefe da fatia jogável (Cinquecento Turbo)', 60, 1170, 28, PROPS_BOARD.texto, 700)
  ;['A vida é só pela barra. A Pizza Margheritron mostrava a vida em fatias; a regra saiu com ela, e o Cinquecento não tem nenhum contador no corpo.',
    'Sem fase 2: a barra não tem marca. O estado "vulnerável" (menta) é proposta para o capô aberto, que é a janela de contra-ataque dele.',
    'Tamanho: 624 px de largura (150 pixels de arte de 4 px) numa tela de 1440, cerca de 43%. Vale 4 px por pixel de arte para ficar com o pixel grande, como o resto do HUD.',
    'Nada disto existe no jogo ainda: não há chefe, dano nem vida. É só o visual.'].forEach((t, i) => {
    t.match(/.{1,118}(\s|$)/g).forEach((ln, k) => TXT(ln.trim(), 60, 1210 + i * 56 + k * 24, 19, PROPS_BOARD.suave, 400))
  })
}

// ---------- montagem da página ----------
const listaCanvas = []
function cartao(secao, id, titulo, nota, w, h, desenhar) {
  const box = document.createElement('article'); box.className = 'cartao'
  const cab = document.createElement('div'); cab.className = 'cab'
  const t = document.createElement('div'); const h3 = document.createElement('h3'); const p = document.createElement('p')
  h3.textContent = titulo; p.textContent = nota; t.append(h3, p)
  const btn = document.createElement('button'); btn.textContent = 'Baixar PNG'
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h
  btn.onclick = () => baixar(cv, id)
  cab.append(t, btn); box.append(cab, cv); document.getElementById(secao).append(box)
  setCtx(cv.getContext('2d')); desenhar()
  listaCanvas.push([cv, id])
}
function baixar(cv, id) {
  cv.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = id + '.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000) })
}

const TUNG = new Image()
TUNG.onload = async () => {
  await carregarImagens()
  SALAS.slice(0, 5).forEach((s) => cartao('comuns', s.id, s.titulo, s.nota, W, H, s.desenhar))
  SALAS.slice(5).forEach((s) => cartao('especiais', s.id, s.titulo, s.nota, W, H, s.desenhar))
  // Sala do Chefe em luta: a sala da Sala do Chefe de sempre, com o Cinquecento Turbo (refino da rodada 6) e a barra de vida embaixo
  cartao('especiais', 'sala-especial-chefe-em-luta', 'Sala do Chefe em luta, com a barra de vida', 'Cinquecento Turbo no centro e a barra de vida embaixo. O chefe é só um quadro parado; não há luta nem dano no protótipo.', W, H, () => {
    SALAS.find((s) => s.id === 'sala-especial-chefe').desenhar()
    chefeNaSala(720, 476)
    R(0, 908, W, H - 908, '#000', 0.6)                                                   // faixa do HUD: a barra fica por cima do enfeite da porta de baixo
    bossBar({ x: (W - 624) / 2, y: 952, hp: 0.64, ghost: 0.78, nome: 'CINQUECENTO TURBO' })
  })
  cartao('pranchas', 'prancha-barra-chefe', 'Barra de vida do chefe', 'Estados: cheia, dano, fase 2, vulnerável, quase no fim e vazia.', W, 1500, pranchaBarraChefe)
  cartao('pranchas', 'prancha-portas', 'Portas: tipo × estado', 'Aberta, fechada no combate e trancada/condição de cada tipo, mais os 4 lados.', W, 2900, pranchaPortas)
  cartao('pranchas', 'prancha-minimapa', 'Minimapa e ícones das salas', 'Estados da sala, exemplo de andar, ligações com o garfo da porta trancada e os 9 ícones.', W, 1260, pranchaMinimapa)
  cartao('pranchas', 'prancha-obstaculos', 'Obstáculos por andar', '20 obstáculos, 7 mecânicas.', W, 1280, pranchaObstaculos)
  cartao('pranchas', 'prancha-secreta', 'Sala secreta: porta nos 4 lados, só de perto', 'Escondida (de perto), trincada e aberta em cima, embaixo, esquerda e direita. Sem pista sonora.', W, 1640, pranchaSecreta)
  cartao('pranchas', 'prancha-coletaveis', 'Grão de café e garfo', 'Os coletáveis que substituem moeda e chave, refinados: ícone, HUD, cena da porta trancada e grupos.', W, 980, pranchaColetaveis)
  document.getElementById('todos').onclick = () => listaCanvas.forEach(([cv, id], i) => setTimeout(() => baixar(cv, id), i * 450))
  document.body.dataset.pronto = '1'
}
TUNG.src = TUNG_SRC
