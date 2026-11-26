// Registro das faixas da trilha: id → nome, envio para a reverb e se a faixa já foi composta.
// Só metadados (a thread principal importa este arquivo sem carregar as músicas); as músicas em
// si ficam em musicas.js, que só o worker, o script de render e os testes importam.
//
// reverb: quanto da faixa vai para a sala (0 a 1); mais nas faixas calmas, menos nas de rock.
// nivel: ajuste de volume da faixa na mesa do jogo, em dB (o worker normaliza cada faixa pelo pico;
//   o nível iguala o volume percebido dos andares, medido em LUFS no npm run trilha:render).
// composta: false = a faixa está no plano, mas ainda não existe; a seleção usa a do andar no lugar.
//
// Faixas das salas do chefe e do palco (chefe.js e palco.js), além dos campos acima:
// doComeco: toda entrada começa do começo (com a introdução) e a faixa não guarda posição, ao contrário das
//   faixas dos andares, que voltam de onde pararam.
// unica: a faixa toca uma vez só (finais de vitória) e depois a música volta à faixa que ela indicar.
// andamento e temposPorCompasso: a mesa troca de fase no fim do tempo ou do compasso (o corpo e a
//   introdução têm sempre compassos inteiros).

export const FAIXAS = Object.freeze({
  'a-vila-espera': Object.freeze({ titulo: 'A Vila Espera', reverb: 0.16, composta: true }),
  'andar-cantina': Object.freeze({ titulo: 'A Ronda: Cantina', reverb: 0.18, nivel: -0.7, composta: true }),
  'andar-cucina': Object.freeze({ titulo: 'A Ronda: Cucina', reverb: 0.14, nivel: 0, composta: true }),
  'andar-piazza': Object.freeze({ titulo: 'A Ronda: Piazza', reverb: 0.16, nivel: -0.9, composta: true }),
  'andar-pastificio': Object.freeze({ titulo: 'A Ronda: Pastificio', reverb: 0.11, nivel: 0, composta: true }),
  'andar-porto': Object.freeze({ titulo: 'A Ronda: Porto', reverb: 0.13, nivel: -1.9, composta: true }),
  // O chefe dos andares 1 a 4 (duas fases) e o chefe final, o Tralalero (três fases). Cada vitória é um final.
  chefe: Object.freeze({ titulo: 'A Ronda: Chefe', reverb: 0.1, nivel: -2.5, composta: true, doComeco: true, andamento: 140, temposPorCompasso: 4 }),
  'chefe-fase2': Object.freeze({ titulo: 'A Ronda: Chefe (fase 2)', reverb: 0.1, nivel: -1.45, composta: true, doComeco: true, andamento: 152, temposPorCompasso: 4 }),
  'chefe-vitoria': Object.freeze({ titulo: 'A Ronda: Chefe (vitória)', reverb: 0.14, nivel: 0.5, composta: true, doComeco: true, unica: true, andamento: 140, temposPorCompasso: 4 }),
  'chefe-final': Object.freeze({ titulo: 'A Ronda: Tralalero', reverb: 0.11, nivel: -1.95, composta: true, doComeco: true, andamento: 144, temposPorCompasso: 4 }),
  'chefe-final-fase2': Object.freeze({ titulo: 'A Ronda: Tralalero (fase 2)', reverb: 0.11, nivel: -1.9, composta: true, doComeco: true, andamento: 156, temposPorCompasso: 4 }),
  'chefe-final-fase3': Object.freeze({ titulo: 'A Ronda: Tralalero (fase 3)', reverb: 0.11, nivel: -2.45, composta: true, doComeco: true, andamento: 168, temposPorCompasso: 4 }),
  'chefe-final-vitoria': Object.freeze({ titulo: 'A Ronda: Tralalero (vitória)', reverb: 0.16, nivel: 0.5, composta: true, doComeco: true, unica: true, andamento: 144, temposPorCompasso: 4 }),
  // O palco: os bastidores (sala aberta), o show (as ondas) e o final do espetáculo
  palco: Object.freeze({ titulo: 'A Ronda: Palco (bastidores)', reverb: 0.2, nivel: -1.95, composta: true, doComeco: true, andamento: 96, temposPorCompasso: 4 }),
  'palco-show': Object.freeze({ titulo: 'A Ronda: Palco', reverb: 0.16, nivel: -2.2, composta: true, doComeco: true, andamento: 152, temposPorCompasso: 4 }),
  'palco-fim': Object.freeze({ titulo: 'A Ronda: Palco (final)', reverb: 0.2, nivel: 0.5, composta: true, doComeco: true, unica: true, andamento: 152, temposPorCompasso: 4 }),
  loja: Object.freeze({ titulo: 'Loja', reverb: 0.15, composta: false }),
  descanso: Object.freeze({ titulo: 'Descanso', reverb: 0.2, composta: false }),
  god: Object.freeze({ titulo: 'Sala do God', reverb: 0.22, composta: false }),
  fliperama: Object.freeze({ titulo: 'Fliperama', reverb: 0.08, composta: false }),
  pacto: Object.freeze({ titulo: 'Sala do Pacto', reverb: 0.18, composta: false }),
})

// Ganho linear do nível da faixa (1 quando a faixa não tem nivel)
export const ganhoDoNivel = (id) => 10 ** ((FAIXAS[id]?.nivel ?? 0) / 20)

export const FAIXAS_COMPOSTAS = Object.freeze(
  Object.entries(FAIXAS).filter(([, faixa]) => faixa.composta).map(([id]) => id)
)
