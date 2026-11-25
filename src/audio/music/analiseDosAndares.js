// Medidas de identidade e de equilíbrio das faixas dos andares, tiradas da partitura (sem render):
// harmonia (vocabulário de acordes, movimento das fundamentais, ritmo harmônico e cadências), levada
// (onde cada peça da bateria bate dentro do tempo), baixo (região e movimento), uníssonos entre
// instrumentos e o modo da melodia. Servem aos testes e ao npm run trilha:render; o jogo não usa.
//
// Distâncias: 0 = o mesmo perfil, 1 = nada em comum (média das distâncias de variação total entre
// histogramas, como em analiseMelodica.js).

import { INSTRUMENTOS, alturaDaNota, midiParaFrequencia } from './instrumentos.js'
import { notasDasVozes } from './analiseMelodica.js'

const CLASSE = Object.freeze({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 })

const somar = (mapa, chave, quanto = 1) => { mapa[chave] = (mapa[chave] || 0) + quanto }
const fracao = (valor, total) => (total > 0 ? valor / total : 0)

export function distanciaEntreHistogramas(a, b) {
  const totalA = Object.values(a).reduce((x, y) => x + y, 0)
  const totalB = Object.values(b).reduce((x, y) => x + y, 0)
  let soma = 0
  for (const chave of new Set([...Object.keys(a), ...Object.keys(b)])) {
    soma += Math.abs(fracao(a[chave] || 0, totalA) - fracao(b[chave] || 0, totalB))
  }
  return soma / 2
}

// Passos por tempo e tempos por compasso de uma faixa (da META; sem ela, 4 tempos por compasso)
export function metricaDe(song, meta) {
  const passosPorCompasso = song[1][0][0].length - 2
  const temposPorCompasso = meta?.temposPorCompasso ?? 4
  const passosPorTempo = meta?.passosPorTempo ?? passosPorCompasso / temposPorCompasso
  return Object.freeze({ passosPorTempo, temposPorCompasso, passosPorCompasso })
}

// Duração de um passo e da faixa inteira, em segundos (a mesma conta do ZzFXM)
export function duracaoDaFaixa([, padroes, sequencia, bpm], sampleRate = 44100) {
  const passo = ((sampleRate / bpm * 60) >> 2) / sampleRate
  const passos = sequencia.reduce((total, indice) => total + padroes[indice][0].length - 2, 0)
  return { passo, total: passos * passo }
}

// --------------------------------------------------
// HARMONIA
// --------------------------------------------------

const lerClasse = (texto) => {
  const encontrada = /^([A-G])([#b]?)/.exec(texto)
  if (!encontrada) throw new Error(`Nota inválida no acorde: ${texto}`)
  return (CLASSE[encontrada[1]] + (encontrada[2] === '#' ? 1 : encontrada[2] === 'b' ? -1 : 0) + 12) % 12
}

// Família do acorde pela qualidade escrita (o sufixo depois da fundamental)
function familiaDe(qualidade) {
  if (qualidade === '5') return 'quinta'
  if (/^dim/.test(qualidade)) return 'diminuto'
  if (/^m7b5/.test(qualidade)) return 'meio-diminuto'
  if (/^m(?!aj)/.test(qualidade)) return 'menor'
  if (/sus/.test(qualidade)) return 'suspenso'
  if (/^(7|9|11|13)/.test(qualidade)) return 'dominante'
  return 'maior'
}

// 'Am9' → { raiz: 9, qualidade: 'm9', familia: 'menor', baixo: 9 }; 'D9/F#' → baixo 6
export function lerAcorde(simbolo) {
  const [principal, baixo] = String(simbolo).split('/')
  const encontrada = /^([A-G][#b]?)(.*)$/.exec(principal)
  if (!encontrada) throw new Error(`Acorde inválido: ${simbolo}`)
  const raiz = lerClasse(encontrada[1])
  const qualidade = encontrada[2] || 'maior'
  return Object.freeze({ simbolo, raiz, qualidade, familia: familiaDe(encontrada[2] || ''), baixo: baixo ? lerClasse(baixo) : raiz })
}

// A harmonia de uma faixa (um item por compasso; um compasso pode ter dois acordes separados por
// espaço) → a lista de acordes em ordem, com quantos compassos cada um ocupa
function acordesEmOrdem(harmonia) {
  const lista = []
  for (const compasso of harmonia) {
    const simbolos = String(compasso).trim().split(/\s+/)
    for (const simbolo of simbolos) lista.push({ acorde: lerAcorde(simbolo), peso: 1 / simbolos.length })
  }
  return lista
}

// Impressão harmônica: qualidades (por tempo ocupado), movimento das fundamentais entre acordes
// diferentes e ritmo harmônico (o compasso repete o acorde, troca ou tem dois)
export function impressaoHarmonica(harmonia) {
  const qualidades = {}
  const movimentos = {}
  const ritmo = {}
  const lista = acordesEmOrdem(harmonia)
  for (const { acorde, peso } of lista) somar(qualidades, acorde.qualidade, peso)
  lista.forEach(({ acorde }, indice) => {
    const proximo = lista[(indice + 1) % lista.length].acorde
    if (proximo.simbolo === acorde.simbolo) return
    somar(movimentos, String((proximo.raiz - acorde.raiz + 12) % 12))
  })
  harmonia.forEach((compasso, indice) => {
    const anterior = harmonia[(indice - 1 + harmonia.length) % harmonia.length]
    if (String(compasso).trim().includes(' ')) somar(ritmo, 'dois')
    else somar(ritmo, compasso === anterior ? 'repete' : 'troca')
  })
  return { qualidades, movimentos, ritmo, cadencias: contarCadencias(lista.map(({ acorde }) => acorde)) }
}

export function distanciaHarmonica(a, b) {
  return (distanciaEntreHistogramas(a.qualidades, b.qualidades) + distanciaEntreHistogramas(a.movimentos, b.movimentos) + distanciaEntreHistogramas(a.ritmo, b.ritmo)) / 3
}

const ehDominante = (acorde) => acorde.familia === 'dominante'
const ehMenor = (acorde) => acorde.familia === 'menor' || acorde.familia === 'quinta'

// Cadências que identificam (e repetiam) os andares, contadas na sequência de acordes distintos:
//   sextaQuintaPrimeira: ♭VI → V7 → i (a fundamental desce meio tom e depois sobe uma quarta)
//   setimaSustenidoNove: quantos acordes 7#9 aparecem
function contarCadencias(acordes) {
  const distintos = acordes.filter((acorde, indice) => acorde.simbolo !== acordes[(indice - 1 + acordes.length) % acordes.length].simbolo)
  let sextaQuintaPrimeira = 0
  distintos.forEach((acorde, indice) => {
    const quinta = distintos[(indice + 1) % distintos.length]
    const primeira = distintos[(indice + 2) % distintos.length]
    if ((acorde.raiz - 1 + 12) % 12 !== quinta.raiz || !ehDominante(quinta)) return
    if ((quinta.raiz + 5) % 12 === primeira.raiz && ehMenor(primeira)) sextaQuintaPrimeira += 1
  })
  const setimaSustenidoNove = acordes.filter((acorde) => acorde.qualidade.includes('7#9')).length
  return { sextaQuintaPrimeira, setimaSustenidoNove }
}

// --------------------------------------------------
// LEVADA (bateria)
// --------------------------------------------------

// Peça de cada instrumento de bateria (a madeira é o motivo, comum a todos: fica de fora; o corpo
// da caixa sempre toca junto com a caixa)
const PECAS = Object.freeze({
  bumbo: 'bumbo', caixa: 'caixa', caixaAro: 'aro', vassourinha: 'vassourinha', chimbal: 'chimbal',
  chimbalAberto: 'aberto', ride: 'ride', pratoEscuro: 'prato', campana: 'sino', palmas: 'palmas',
})

// Onde cada peça bate: peça, tempo do compasso e posição dentro do tempo (em doze avos, o que serve
// às grades de 3 e de 4 passos por tempo). No bumbo, as notas acima de 15 são os tons.
export function impressaoDaLevada(song, nomes, metrica) {
  const [, padroes] = song
  const { passosPorTempo } = metrica
  const batidas = {}
  for (const padrao of padroes) {
    for (const canal of padrao) {
      const nome = nomes[canal[0]]
      const peca = PECAS[nome]
      if (!peca) continue
      canal.slice(2).forEach((nota, passo) => {
        if (!(nota > 0)) return
        const qual = peca === 'bumbo' && (nota | 0) > 15 ? 'tons' : peca
        const tempo = Math.floor(passo / passosPorTempo)
        const posicao = Math.round(((passo % passosPorTempo) / passosPorTempo) * 12)
        somar(batidas, `${qual}:${tempo}:${posicao}`)
      })
    }
  }
  return batidas
}

export const distanciaDeLevada = distanciaEntreHistogramas

// Quantas seções terminam com um compasso de bateria diferente do padrão mais comum da seção (a
// virada ou a parada que anuncia a próxima)
export function viradasNasPassagens(song, nomes, secoes) {
  const [, padroes] = song
  const bateriaDoCompasso = (compasso) => padroes[compasso]
    .filter((canal) => PECAS[nomes[canal[0]]] || nomes[canal[0]] === 'madeira')
    .map((canal) => canal.slice(2).map((nota) => (nota > 0 ? nota | 0 : 0)).join(','))
    .join('|')
  let comVirada = 0
  for (const secao of secoes) {
    const contagem = {}
    for (let compasso = secao.inicio; compasso < secao.inicio + secao.compassos; compasso++) somar(contagem, bateriaDoCompasso(compasso))
    const maisComum = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0][0]
    if (bateriaDoCompasso(secao.inicio + secao.compassos - 1) !== maisComum) comVirada += 1
  }
  return fracao(comVirada, secoes.length)
}

// --------------------------------------------------
// BAIXO E UNÍSSONOS
// --------------------------------------------------

// Instrumentos que fazem a linha do baixo (o sub é uma camada embaixo dela e fica de fora)
export const BAIXOS = Object.freeze(['contrabaixo', 'contrabaixoCheio', 'baixoEletrico', 'baixoFunk', 'baixoDistorcido', 'orgaoBaixo'])

// Notas tocadas de um conjunto de instrumentos, em ordem: { compasso, passo, midi }
function notasDos(song, nomes, filtro) {
  const [, padroes] = song
  const lista = []
  padroes.forEach((padrao, compasso) => {
    for (const canal of padrao) {
      const nome = nomes[canal[0]]
      if (!filtro(nome)) continue
      canal.slice(2).forEach((nota, passo) => {
        if (nota > 0) lista.push({ compasso, passo, midi: alturaDaNota(nota, nome) })
      })
    }
  })
  return lista.sort((a, b) => a.compasso - b.compasso || a.passo - b.passo)
}

// Mediana (Hz), parte das notas abaixo de 80 Hz e parte das notas que mudam de altura em relação à
// anterior (o baixo que caminha muda quase sempre; o baixo parado repete)
export function estatisticasDoBaixo(song, nomes) {
  const lista = notasDos(song, nomes, (nome) => BAIXOS.includes(nome))
  if (lista.length === 0) return { notas: 0, medianaHz: 0, abaixoDe80: 0, movimento: 0 }
  const frequencias = lista.map(({ midi }) => midiParaFrequencia(midi)).sort((a, b) => a - b)
  const mudam = lista.filter((nota, indice) => indice > 0 && nota.midi !== lista[indice - 1].midi).length
  return {
    notas: lista.length,
    medianaHz: frequencias[Math.floor(frequencias.length / 2)],
    abaixoDe80: fracao(frequencias.filter((hz) => hz < 80).length, frequencias.length),
    movimento: fracao(mudam, lista.length - 1),
  }
}

// Uníssonos por minuto: dois instrumentos de altura diferentes atacando a mesma nota, na mesma
// oitava, no mesmo passo (o sub dobra o baixo de propósito e fica de fora)
export function unissonosPorMinuto(song, nomes) {
  const [, padroes] = song
  let unissonos = 0
  for (const padrao of padroes) {
    const passos = padrao[0].length - 2
    for (let passo = 0; passo < passos; passo++) {
      const porAltura = {}
      for (const canal of padrao) {
        const nome = nomes[canal[0]]
        if (INSTRUMENTOS[nome].percussao || nome === 'sub') continue
        const nota = canal[passo + 2]
        if (!(nota > 0)) continue
        const altura = alturaDaNota(nota, nome)
        porAltura[altura] = porAltura[altura] || new Set()
        porAltura[altura].add(nome)
      }
      for (const instrumentos of Object.values(porAltura)) if (instrumentos.size > 1) unissonos += instrumentos.size - 1
    }
  }
  return unissonos / (duracaoDaFaixa(song).total / 60)
}

// --------------------------------------------------
// MELODIA: modo, registro e a região dos efeitos sonoros
// --------------------------------------------------

// As notas que dão a cor de cada modo (graus em semitons acima da tônica)
export const NOTAS_DO_MODO = Object.freeze({
  eolio: Object.freeze([8, 6]), // a sexta menor e a blue note (quinta diminuta)
  mixolidio: Object.freeze([4]), // a terça maior (a sétima menor os modos menores também têm)
  dorico: Object.freeze([9]), // a sexta maior
  frigio: Object.freeze([1]), // a segunda menor
  menorHarmonico: Object.freeze([11, 1]), // a sétima maior (sensível) e a segunda menor do napolitano
})

const PENTATONICA_MENOR = new Set([0, 3, 5, 7, 10])

// Graus da melodia em relação à tônica: parte na pentatônica menor, parte nas notas do modo,
// registro (notas acima de 660 e de 880 Hz) e ataques por segundo na região dos efeitos sonoros
export function perfilDaMelodia(song, nomes, vozes, metrica, { tonica, modo }) {
  const notas = notasDasVozes(song, nomes, vozes, metrica).flat()
  const classeDaTonica = lerClasse(tonica)
  const graus = notas.map(({ midi }) => ((midi - classeDaTonica) % 12 + 12) % 12)
  const frequencias = notas.map(({ midi }) => midiParaFrequencia(midi))
  const doModo = new Set(NOTAS_DO_MODO[modo] ?? [])
  const { total } = duracaoDaFaixa(song)
  return {
    notas: notas.length,
    pentatonica: fracao(graus.filter((grau) => PENTATONICA_MENOR.has(grau)).length, graus.length),
    notasDoModo: fracao(graus.filter((grau) => doModo.has(grau)).length, graus.length),
    acimaDe660: fracao(frequencias.filter((hz) => hz > 660).length, frequencias.length),
    acimaDe880: frequencias.filter((hz) => hz > 880).length,
    regiaoDosEfeitos: frequencias.filter((hz) => hz >= 100 && hz <= 650).length / total,
  }
}
