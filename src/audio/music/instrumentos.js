// Biblioteca de instrumentos da trilha do TBOTT. Todas as faixas tiram seus timbres daqui:
// um ajuste num instrumento vale para o jogo inteiro.
//
// COMO O ZZFX LOCAL FUNCIONA (conferido em src/audio/zzfxExperimental.js)
//   - Parâmetros, nesta ordem: volume, randomness, frequency, attack, sustain, release,
//     shape, shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise,
//     modulation, bitCrush, delay, sustainVolume, decay, tremolo, filter.
//   - Envelope: attack (sobe) → decay (desce até sustainVolume) → sustain (fica) → release
//     (desce até zero). Todos os trechos são retas; um decaimento "exponencial" sai de um
//     decay curto até um nível baixo seguido de um release longo.
//   - filter: positivo = passa-alta, negativo = passa-baixa. O corte real é 2 × |filter|
//     (o código usa w = 2π·|filter|·2/sr) e o Q é 2, então há um pico de ~6 dB no corte.
//     Por isso os timbres usam passaBaixa(hz) e passaAlta(hz), que já fazem a conta.
//   - noise não soma ruído ao som: ele embaralha a fase. O resultado é uma faixa de ruído
//     em volta da frequência da nota; para ruído largo (chimbal, esteira) a nota é aguda
//     e o noise é alto.
//   - repeatTime também reinicia a frequência a cada período, então tremolo + slide no
//     mesmo timbre faz a altura "serrar". Nenhum timbre daqui junta os dois.
//
// POR QUE ESTES TIMBRES (o diagnóstico do som metálico)
//   - Serra (2), tan (3) e quadrada (5) não têm anti-aliasing: numa nota C6, ~3% da energia
//     cai fora da série harmônica (som de lata). Triângulo e seno ficam em 0%. Aqui a serra
//     só aparece em notas graves e médias e sempre com passa-baixa; tan e quadrada só no
//     fliperama.
//   - modulation, bitCrush e delay ficam em zero (FM, redução de bits e filtro pente).
//   - Ataque de pelo menos 0,003 s (sem clique) e release de pelo menos 0,05 s.
//   - Os instrumentos que decaem (baixo, piano, guitarra, vibrafone) têm decay com
//     sustainVolume < 1.
//
// CONVENÇÃO DE ALTURA
//   A nota 12 de cada instrumento é a frequência de baseMidi (um Dó nos instrumentos de
//   altura; na bateria é a altura do som principal). As linhas são
//   escritas em altura real ('D4') e convertidas com notaDoInstrumento(). `registro` é a
//   faixa de alturas escritas (MIDI, antes da `transposicao`) em que o timbre soa bem; os testes
//   conferem as músicas contra ela.

export const midiParaFrequencia = (midi) => 440 * 2 ** ((midi - 69) / 12)

export const passaBaixa = (hz) => -hz / 2
export const passaAlta = (hz) => hz / 2

// Monta o array de 21 parâmetros a partir de nomes legíveis
function zzfx({
  volume = 1,
  aleatoriedade = 0,
  frequencia,
  ataque = 0.004,
  sustentacao = 0,
  soltura = 0.1,
  forma = 0,
  curva = 1,
  slide = 0,
  saltoDeAltura = 0,
  tempoDoSalto = 0,
  repeticao = 0,
  ruido = 0,
  nivelSustentacao = 1,
  decaimento = 0,
  tremolo = 0,
  filtro = 0,
}) {
  return Object.freeze([
    volume, aleatoriedade, frequencia, ataque, sustentacao, soltura,
    forma, curva, slide, 0, saltoDeAltura, tempoDoSalto, repeticao, ruido,
    0, 0, 0, nivelSustentacao, decaimento, tremolo, filtro,
  ])
}

// baseMidi: altura da nota 12. transposicao: o timbre soa N semitons acima do escrito
// (a camada de brilho do Rhodes, por exemplo, soa uma oitava acima).
function instrumento({ baseMidi = 48, transposicao = 0, registro, percussao = false, ...timbre }) {
  return Object.freeze({
    baseMidi,
    transposicao,
    registro: Object.freeze(registro || [baseMidi, baseMidi]),
    percussao,
    parametros: zzfx({ frequencia: midiParaFrequencia(baseMidi + transposicao), ...timbre }),
  })
}

const SENO = 0
const TRIANGULO = 1
const SERRA = 2
const QUADRADA = 5

export const INSTRUMENTOS = Object.freeze({
  // ---------------- Baixos ----------------

  // Triângulo levemente arredondado: um pouco de harmônico para o baixo não sumir em caixinhas
  contrabaixo: instrumento({
    baseMidi: 36, registro: [28, 55],
    volume: 0.62, aleatoriedade: 0.003, forma: TRIANGULO, curva: 1.3,
    ataque: 0.006, decaimento: 0.22, nivelSustentacao: 0.5, sustentacao: 0.1, soltura: 0.16,
    filtro: passaBaixa(1000),
  }),

  baixoEletrico: instrumento({
    baseMidi: 36, registro: [28, 55],
    volume: 0.5, aleatoriedade: 0.002, forma: TRIANGULO, curva: 0.9,
    ataque: 0.004, decaimento: 0.12, nivelSustentacao: 0.72, sustentacao: 0.16, soltura: 0.1,
    filtro: passaBaixa(1500),
  }),

  // ---------------- Teclados ----------------

  // Decaimento em duas retas (decay curto + release longo) imita a curva do piano elétrico
  rhodes: instrumento({
    baseMidi: 48, registro: [43, 79],
    volume: 0.32, aleatoriedade: 0.002, forma: SENO,
    ataque: 0.004, decaimento: 0.28, nivelSustentacao: 0.42, sustentacao: 0.25, soltura: 0.85,
    filtro: passaBaixa(3000),
  }),

  // Camada opcional: o "tine" do ataque, uma oitava acima e bem baixo
  rhodesBrilho: instrumento({
    baseMidi: 48, transposicao: 12, registro: [43, 79],
    volume: 0.06, forma: TRIANGULO,
    ataque: 0.003, decaimento: 0.09, nivelSustentacao: 0.15, sustentacao: 0, soltura: 0.25,
    filtro: passaBaixa(3500),
  }),

  pianoBoogie: instrumento({
    baseMidi: 48, registro: [36, 86],
    volume: 0.3, aleatoriedade: 0.002, forma: TRIANGULO,
    ataque: 0.003, decaimento: 0.12, nivelSustentacao: 0.35, sustentacao: 0.06, soltura: 0.32,
    filtro: passaBaixa(3500),
  }),

  // Órgão: a camada 8' (a nota) e a 16' (uma oitava abaixo, mais baixa) vão em canais separados.
  // O tremolo faz o papel do Leslie; o órgão "liso" é para notas curtas.
  orgao: instrumento({
    baseMidi: 48, registro: [48, 79],
    volume: 0.2, aleatoriedade: 0.002, forma: TRIANGULO,
    ataque: 0.008, decaimento: 0.05, nivelSustentacao: 0.85, sustentacao: 0.32, soltura: 0.09,
    filtro: passaBaixa(3000),
  }),

  orgao16: instrumento({
    baseMidi: 48, transposicao: -12, registro: [48, 79],
    volume: 0.13, aleatoriedade: 0.002, forma: SENO,
    ataque: 0.008, decaimento: 0.05, nivelSustentacao: 0.85, sustentacao: 0.32, soltura: 0.09,
  }),

  // Órgão sustentado: o ataque lento faz o acorde "inchar" (pad), com Leslie lento. Dura mais que um
  // compasso a ♩ = 100, então acordes seguidos se emendam. Introduções e a sala do God.
  orgaoSustentado: instrumento({
    baseMidi: 48, registro: [43, 79],
    volume: 0.17, aleatoriedade: 0.002, forma: TRIANGULO,
    ataque: 0.38, decaimento: 0.1, nivelSustentacao: 0.9, sustentacao: 1.6, soltura: 0.55,
    repeticao: 0.4, tremolo: 0.1,
    filtro: passaBaixa(2600),
  }),

  // Baixo de órgão (o pedal do trio de órgão): seno arredondado, curto e redondo
  orgaoBaixo: instrumento({
    baseMidi: 36, registro: [28, 52],
    volume: 0.45, aleatoriedade: 0.001, forma: SENO,
    ataque: 0.006, decaimento: 0.08, nivelSustentacao: 0.7, sustentacao: 0.16, soltura: 0.08,
    filtro: passaBaixa(900),
  }),

  // Leslie lento (~2,5 Hz): baladas e trechos calmos
  orgaoLeslieLento: instrumento({
    baseMidi: 48, registro: [48, 79],
    volume: 0.2, aleatoriedade: 0.002, forma: TRIANGULO,
    ataque: 0.01, decaimento: 0.05, nivelSustentacao: 0.85, sustentacao: 0.6, soltura: 0.15,
    repeticao: 0.4, tremolo: 0.12,
    filtro: passaBaixa(2800),
  }),

  // Leslie rápido (~6,5 Hz): clímax
  orgaoLeslieRapido: instrumento({
    baseMidi: 48, registro: [48, 79],
    volume: 0.2, aleatoriedade: 0.002, forma: TRIANGULO,
    ataque: 0.008, decaimento: 0.05, nivelSustentacao: 0.85, sustentacao: 0.45, soltura: 0.12,
    repeticao: 0.154, tremolo: 0.2,
    filtro: passaBaixa(3200),
  }),

  // ---------------- Guitarras ----------------

  guitarraJazz: instrumento({
    baseMidi: 48, registro: [40, 81],
    volume: 0.3, aleatoriedade: 0.003, forma: TRIANGULO,
    ataque: 0.004, decaimento: 0.18, nivelSustentacao: 0.4, sustentacao: 0.1, soltura: 0.24,
    filtro: passaBaixa(2500),
  }),

  // Guitarra com o tremolo do amplificador (~6 Hz): o balanço da água no Porto. Notas longas.
  guitarraTremolo: instrumento({
    baseMidi: 48, registro: [40, 76],
    volume: 0.3, aleatoriedade: 0.003, forma: TRIANGULO,
    ataque: 0.005, decaimento: 0.25, nivelSustentacao: 0.6, sustentacao: 0.6, soltura: 0.35,
    repeticao: 0.16, tremolo: 0.55,
    filtro: passaBaixa(2500),
  }),

  // Serra "achatada" (curva < 1) e passa-baixa forte: é o papel da caixa do amplificador.
  // Power chord = tônica e quinta em canais separados (o aleatoriedade desafina um pouco cada um).
  guitarraCrunch: instrumento({
    baseMidi: 48, registro: [40, 69],
    volume: 0.16, aleatoriedade: 0.003, forma: SERRA, curva: 0.6,
    ataque: 0.004, decaimento: 0.1, nivelSustentacao: 0.78, sustentacao: 0.28, soltura: 0.1,
    filtro: passaBaixa(2800),
  }),

  guitarraPalmMute: instrumento({
    baseMidi: 48, registro: [40, 64],
    volume: 0.26, aleatoriedade: 0.003, forma: SERRA, curva: 0.6,
    ataque: 0.003, decaimento: 0.05, nivelSustentacao: 0.5, sustentacao: 0.02, soltura: 0.06,
    filtro: passaBaixa(1600),
  }),

  // ---------------- Sopros ----------------

  // Serra com passa-baixa (o pico do filtro faz as vezes de formante), ataque de sopro,
  // um pouco de ruído de fase (aspereza) e um tremolo leve no lugar do vibrato.
  saxTenor: instrumento({
    baseMidi: 48, registro: [44, 77],
    volume: 0.28, aleatoriedade: 0.003, forma: SERRA,
    ataque: 0.03, decaimento: 0.08, nivelSustentacao: 0.82, sustentacao: 0.22, soltura: 0.12,
    ruido: 0.03, repeticao: 0.18, tremolo: 0.06,
    filtro: passaBaixa(2000),
  }),

  saxBaritono: instrumento({
    baseMidi: 36, registro: [33, 64],
    volume: 0.16, aleatoriedade: 0.003, forma: SERRA,
    ataque: 0.03, decaimento: 0.08, nivelSustentacao: 0.8, sustentacao: 0.2, soltura: 0.12,
    ruido: 0.02,
    filtro: passaBaixa(1300),
  }),

  trompete: instrumento({
    baseMidi: 60, registro: [52, 79],
    volume: 0.2, aleatoriedade: 0.002, forma: SERRA,
    ataque: 0.022, decaimento: 0.07, nivelSustentacao: 0.78, sustentacao: 0.14, soltura: 0.1,
    filtro: passaBaixa(2500),
  }),

  trompeteSurdina: instrumento({
    baseMidi: 60, registro: [52, 79],
    volume: 0.18, aleatoriedade: 0.002, forma: TRIANGULO, curva: 0.85,
    ataque: 0.02, decaimento: 0.06, nivelSustentacao: 0.75, sustentacao: 0.14, soltura: 0.1,
    filtro: passaBaixa(2500),
  }),

  trombone: instrumento({
    baseMidi: 48, registro: [34, 70],
    volume: 0.17, aleatoriedade: 0.003, forma: SERRA,
    ataque: 0.045, decaimento: 0.08, nivelSustentacao: 0.85, sustentacao: 0.18, soltura: 0.14,
    filtro: passaBaixa(1400),
  }),

  // O triângulo só tem harmônicos ímpares, como o clarinete no registro grave
  clarinete: instrumento({
    baseMidi: 60, registro: [50, 82],
    volume: 0.2, aleatoriedade: 0.002, forma: TRIANGULO,
    ataque: 0.03, decaimento: 0.1, nivelSustentacao: 0.8, sustentacao: 0.24, soltura: 0.12,
    filtro: passaBaixa(2200),
  }),

  // ---------------- Percussão melódica ----------------

  // O motor do vibrafone é o tremolo (~5,5 Hz)
  vibrafone: instrumento({
    baseMidi: 60, registro: [53, 89],
    volume: 0.22, aleatoriedade: 0.001, forma: SENO,
    ataque: 0.003, decaimento: 0.35, nivelSustentacao: 0.32, sustentacao: 0.2, soltura: 1.1,
    repeticao: 0.18, tremolo: 0.22,
  }),

  // ---------------- Bateria (percussao: true; a nota 12 é o som principal) ----------------

  // Seno que cai de altura (slide negativo) e passa-baixa. Notas acima de 12 viram tons.
  bumbo: instrumento({
    baseMidi: 45, registro: [45, 62], percussao: true,
    volume: 0.85, forma: SENO,
    ataque: 0.003, decaimento: 0.07, nivelSustentacao: 0.35, sustentacao: 0.02, soltura: 0.17,
    slide: -0.7,
    filtro: passaBaixa(500),
  }),

  // Corpo em triângulo grave + ruído de fase alto (a esteira). O passa-baixa tira o chiado.
  caixa: instrumento({
    baseMidi: 79, registro: [79, 79], percussao: true,
    volume: 0.48, forma: TRIANGULO,
    ataque: 0.003, decaimento: 0.05, nivelSustentacao: 0.3, sustentacao: 0.01, soltura: 0.13,
    ruido: 6, slide: -1.5,
    filtro: passaBaixa(7000),
  }),

  // Corpo da caixa: o tom de ~185 Hz da pele, tocado junto com `caixa` em outro canal
  // (um timbre do ZzFX não consegue ser ruído largo e tom grave ao mesmo tempo)
  caixaCorpo: instrumento({
    baseMidi: 54, registro: [54, 54], percussao: true,
    volume: 0.42, forma: SENO,
    ataque: 0.003, decaimento: 0.03, nivelSustentacao: 0.3, sustentacao: 0, soltura: 0.07,
    slide: -0.5,
  }),

  // Caixa sem esteira, para o aro e o rimshot de jazz: mais corpo, menos ruído
  caixaAro: instrumento({
    baseMidi: 72, registro: [72, 72], percussao: true,
    volume: 0.22, forma: TRIANGULO,
    ataque: 0.003, decaimento: 0.025, nivelSustentacao: 0.25, sustentacao: 0, soltura: 0.06,
    ruido: 1.2,
    filtro: passaBaixa(4500),
  }),

  // Vassourinha: ruído com ataque longo, o "swish"
  vassourinha: instrumento({
    baseMidi: 91, registro: [91, 91], percussao: true,
    volume: 0.1, forma: SENO,
    ataque: 0.035, decaimento: 0.04, nivelSustentacao: 0.5, sustentacao: 0.03, soltura: 0.12,
    ruido: 9,
    filtro: passaBaixa(6000),
  }),

  chimbal: instrumento({
    baseMidi: 103, registro: [103, 103], percussao: true,
    volume: 0.09, forma: SENO,
    ataque: 0.003, decaimento: 0.015, nivelSustentacao: 0.35, sustentacao: 0, soltura: 0.04,
    ruido: 9,
    filtro: passaAlta(7000),
  }),

  chimbalAberto: instrumento({
    baseMidi: 103, registro: [103, 103], percussao: true,
    volume: 0.07, forma: SENO,
    ataque: 0.004, decaimento: 0.05, nivelSustentacao: 0.5, sustentacao: 0.05, soltura: 0.22,
    ruido: 9,
    filtro: passaAlta(7000),
  }),

  // Ride: o pouco de brilho metálico aqui é desejado. Nota 12 = arco, nota 17 = campana.
  ride: instrumento({
    baseMidi: 96, registro: [96, 101], percussao: true,
    volume: 0.105, forma: SENO,
    ataque: 0.003, decaimento: 0.04, nivelSustentacao: 0.4, sustentacao: 0.04, soltura: 0.4,
    ruido: 3.5,
    filtro: passaAlta(5000),
  }),

  // Madeira: o "tung" do tronco. Seno oco que cai um pouco de altura, com um toque de ruído
  // no ataque. É o timbre do motivo tung-tung-tung (ver motivos.js).
  madeira: instrumento({
    baseMidi: 72, registro: [60, 79], percussao: true,
    volume: 0.5, forma: SENO,
    ataque: 0.003, decaimento: 0.03, nivelSustentacao: 0.25, sustentacao: 0, soltura: 0.08,
    slide: -0.8, ruido: 0.25,
    filtro: passaBaixa(3000),
  }),

  palmas: instrumento({
    baseMidi: 84, registro: [84, 84], percussao: true,
    volume: 0.12, forma: SENO,
    ataque: 0.004, decaimento: 0.02, nivelSustentacao: 0.3, sustentacao: 0.01, soltura: 0.09,
    ruido: 8,
    filtro: passaBaixa(5000),
  }),

  // ---------------- Fliperama (o único lugar do som "de máquina") ----------------

  chipQuadrada: instrumento({
    baseMidi: 60, registro: [48, 84],
    volume: 0.09, forma: QUADRADA, curva: 1,
    ataque: 0.004, decaimento: 0.06, nivelSustentacao: 0.6, sustentacao: 0.08, soltura: 0.06,
    filtro: passaBaixa(6000),
  }),

  chipTriangulo: instrumento({
    baseMidi: 36, registro: [28, 60],
    volume: 0.4, forma: TRIANGULO,
    ataque: 0.004, decaimento: 0.05, nivelSustentacao: 0.8, sustentacao: 0.1, soltura: 0.06,
  }),
})

// Converte altura MIDI em número de nota do instrumento, com a atenuação na parte decimal
// (0 = volume cheio, 0,6 = ghost note). Devolve 0 (pausa) para null.
export function notaDoInstrumento(midi, instrumentoOuNome, atenuacao = 0) {
  if (midi === null || midi === undefined) return 0
  const dados = typeof instrumentoOuNome === 'string' ? INSTRUMENTOS[instrumentoOuNome] : instrumentoOuNome
  let nota = Math.round(midi) - dados.baseMidi + 12
  while (nota < 1) nota += 12
  const fracao = Math.min(0.95, Math.max(0, atenuacao))
  return fracao > 0 ? nota + Math.round(fracao * 100) / 100 : nota
}

// Altura MIDI que uma nota do instrumento realmente soa (o inverso, já com a transposição)
export function alturaDaNota(nota, instrumentoOuNome) {
  const dados = typeof instrumentoOuNome === 'string' ? INSTRUMENTOS[instrumentoOuNome] : instrumentoOuNome
  return (nota | 0) - 12 + dados.baseMidi + dados.transposicao
}
