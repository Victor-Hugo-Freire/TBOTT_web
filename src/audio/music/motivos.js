// O motivo do Tung: a assinatura sonora do protagonista, que volta em todas as faixas.
//
// São duas partes:
// - tung-tung-tung: três batidas de madeira em tercina, como anacruse para o tempo forte
//   (crescendo: a última é a mais forte). Na grade de 12 passos são os passos 9, 10 e 11
//   do compasso anterior ao tempo forte.
// - célula do Tung: cinco notas, 5 – ♭7 – 1' – ♭7 – 5, com ritmo fixo. Ela sobe até a
//   oitava e volta, e cabe em três tempos, deixando o quarto tempo livre para o
//   tung-tung-tung levar ao próximo compasso.
//
// Cada faixa transpõe e rearmoniza a célula para o seu gênero (no órgão gospel ela vira
// acorde, no chiptune vira arpejo, no rock vira o riff), mas mantém os graus e o ritmo.

// Graus da célula em semitons acima da tônica
export const CELULA_DO_TUNG_GRAUS = Object.freeze([7, 10, 12, 10, 7])

// Ritmo da célula em tempos a partir do tempo forte (1, "e" com swing do 1, 2, "e" do 2, 3)
export const CELULA_DO_TUNG_TEMPOS = Object.freeze([0, 2 / 3, 1, 5 / 3, 2])

// Atenuação de cada nota da célula (acento no 1' do segundo tempo, o pico da frase)
export const CELULA_DO_TUNG_ATENUACAO = Object.freeze([0.1, 0.3, 0, 0.3, 0.15])

// tung-tung-tung: posição em tempos dentro do compasso de 4 tempos e atenuação de cada batida
export const TUNG_TUNG_TUNG_TEMPOS = Object.freeze([3, 3 + 1 / 3, 3 + 2 / 3])
export const TUNG_TUNG_TUNG_ATENUACAO = Object.freeze([0.45, 0.25, 0])

// Converte posições em tempos para passos de uma grade. Nas grades sem tercina
// (16 passos), a posição vai para o passo mais próximo: o tung-tung-tung vira 13, 14, 15
// (semicolcheias), que é a aproximação reta da tercina.
export function temposParaPassos(tempos, passosPorTempo) {
  const passos = tempos.map((tempo) => Math.round(tempo * passosPorTempo))
  for (let i = 1; i < passos.length; i++) {
    if (passos[i] <= passos[i - 1]) passos[i] = passos[i - 1] + 1
  }
  return passos
}

// Passos do tung-tung-tung numa grade (12 passos → [9, 10, 11]; 16 → [13, 14, 15]).
// Sempre no último tempo do compasso, levando ao próximo tempo forte.
export function passosDoTungTungTung(passosPorTempo, temposPorCompasso = 4) {
  const fim = passosPorTempo * temposPorCompasso
  if (passosPorTempo % 3 !== 0) return [fim - 3, fim - 2, fim - 1]
  const ultimoTempo = temposPorCompasso - 1
  const tempos = TUNG_TUNG_TUNG_TEMPOS.map((tempo) => tempo - 3 + ultimoTempo)
  return temposParaPassos(tempos, passosPorTempo)
}

// A célula como lista de { passo, midi, atenuacao } a partir de uma tônica (MIDI)
export function celulaDoTung(tonicaMidi, passosPorTempo, { inicio = 0 } = {}) {
  const passos = temposParaPassos(CELULA_DO_TUNG_TEMPOS, passosPorTempo)
  return CELULA_DO_TUNG_GRAUS.map((grau, indice) => ({
    passo: inicio + passos[indice],
    midi: tonicaMidi + grau,
    atenuacao: CELULA_DO_TUNG_ATENUACAO[indice],
  }))
}
