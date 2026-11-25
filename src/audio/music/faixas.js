// Registro das faixas da trilha: id → nome, envio para a reverb e se a faixa já foi composta.
// Só metadados (a thread principal importa este arquivo sem carregar as músicas); as músicas em
// si ficam em musicas.js, que só o worker, o script de render e os testes importam.
//
// reverb: quanto da faixa vai para a sala (0 a 1); mais nas faixas calmas, menos nas de rock.
// composta: false = a faixa está no plano, mas ainda não existe; a seleção usa a do andar no lugar.

export const FAIXAS = Object.freeze({
  'a-vila-espera': Object.freeze({ titulo: 'A Vila Espera', reverb: 0.16, composta: true }),
  'andar-cantina': Object.freeze({ titulo: 'A Ronda: Cantina', reverb: 0.18, composta: true }),
  'andar-cucina': Object.freeze({ titulo: 'A Ronda: Cucina', reverb: 0.14, composta: true }),
  'andar-piazza': Object.freeze({ titulo: 'A Ronda: Piazza', reverb: 0.16, composta: true }),
  'andar-pastificio': Object.freeze({ titulo: 'A Ronda: Pastificio', reverb: 0.11, composta: false }),
  'andar-porto': Object.freeze({ titulo: 'A Ronda: Porto', reverb: 0.13, composta: false }),
  loja: Object.freeze({ titulo: 'Loja', reverb: 0.15, composta: false }),
  descanso: Object.freeze({ titulo: 'Descanso', reverb: 0.2, composta: false }),
  god: Object.freeze({ titulo: 'Sala do God', reverb: 0.22, composta: false }),
  fliperama: Object.freeze({ titulo: 'Fliperama', reverb: 0.08, composta: false }),
  pacto: Object.freeze({ titulo: 'Sala do Pacto', reverb: 0.18, composta: false }),
})

export const FAIXAS_COMPOSTAS = Object.freeze(
  Object.entries(FAIXAS).filter(([, faixa]) => faixa.composta).map(([id]) => id)
)
