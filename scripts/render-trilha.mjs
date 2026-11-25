// Renderiza as faixas da trilha em WAV e imprime as medições de cada uma.
//
//   npm run trilha:render                      todas as faixas compostas (faixas.js)
//   npm run trilha:render -- --so andar-cantina  só uma faixa (pode repetir --so)
//   npm run trilha:render -- --canais           também mede cada canal sozinho
//   npm run trilha:render -- --instrumentos     mede os timbres da biblioteca
//
// Saída em tmp/trilha/ (fora do Git):
//   <id>.wav       a faixa como o jogador ouve: preparação do worker + cadeia do master
//                  (com introdução: a introdução e depois o corpo duas vezes, para ouvir a entrada e o loop)
//   <id>-seco.wav  só a preparação do worker (sem filtros, reverb nem compressor)
//   vila-espera-antiga.wav  a versão anterior à Fase 1, exatamente como tocava

import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateZzfxMusicSamples } from '../src/audio/zzfxmExperimental.js'
import { generateZzfxSamples, ZZFX_EXPERIMENTAL_SAMPLE_RATE } from '../src/audio/zzfxExperimental.js'
import { CADEIA_DO_MASTER, prepararFaixa } from '../src/audio/masterizacao.js'
import { INSTRUMENTOS, midiParaFrequencia } from '../src/audio/music/instrumentos.js'
import { FAIXAS as REGISTRO, FAIXAS_COMPOSTAS } from '../src/audio/music/faixas.js'
import { INSTRUMENTOS_DAS_MUSICAS, MELODIAS_DAS_MUSICAS, MOTIVOS_DAS_MUSICAS, obterFaixa, obterMusica, SECOES_DAS_MUSICAS } from '../src/audio/music/musicas.js'
import { chavesDaCelula, distanciaMelodica, impressaoMelodica } from '../src/audio/music/analiseMelodica.js'
import { VILA_ESPERA_SONG as VILA_ESPERA_ANTIGA_SONG, VILA_ESPERA_INSTRUMENTS as INSTRUMENTOS_ANTIGOS } from './referencia/vila-espera-antiga.js'
import { ENTRADA_DO_CORPO } from '../src/audio/fonteComIntro.js'
import { aplicarCadeiaDoMaster, distribuicaoEspectral, inarmonicidade, maiorSaltoPerto, medirFaixa, mono, niveisPorTrecho, salvarWav } from './trilha/analise.mjs'

const SAMPLE_RATE = ZZFX_EXPERIMENTAL_SAMPLE_RATE
const PASTA = join(fileURLToPath(new URL('..', import.meta.url)), 'tmp', 'trilha')

// O `randomness` do ZzFX usa Math.random: com semente, dois renders saem iguais
function fixarAleatorio(semente = 20261125) {
  let estado = semente >>> 0
  Math.random = () => {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = Math.imul(estado ^ (estado >>> 15), estado | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Índices de instrumento que são bateria (ficam de fora da medição "só instrumentos de altura")
const percussaoDe = (nomes) => nomes.flatMap((nome, indice) => (INSTRUMENTOS[nome].percussao ? [indice] : []))

const FAIXAS = FAIXAS_COMPOSTAS.map((id) => ({
  id,
  song: obterMusica(id),
  reverb: REGISTRO[id].reverb ?? CADEIA_DO_MASTER.reverbPadrao,
  instrumentos: INSTRUMENTOS_DAS_MUSICAS[id],
  percussao: percussaoDe(INSTRUMENTOS_DAS_MUSICAS[id]),
}))

// Densidade de notas na região dos efeitos sonoros (fundamental entre 100 e 650 Hz), só dos
// instrumentos de altura: ataques por segundo na média e no compasso mais cheio
const REGIAO_DOS_EFEITOS = [100, 650]
function densidadeNaRegiaoDosEfeitos(song, nomes) {
  const [instrumentos, padroes, sequencia, bpm] = song
  const passoEmSegundos = ((SAMPLE_RATE / bpm * 60) >> 2) / SAMPLE_RATE
  let total = 0
  let maximo = 0
  let duracao = 0
  for (const indice of sequencia) {
    const padrao = padroes[indice]
    const passos = padrao[0].length - 2
    duracao += passos * passoEmSegundos
    let noCompasso = 0
    for (const canal of padrao) {
      const nome = nomes[canal[0]]
      if (INSTRUMENTOS[nome].percussao) continue
      const base = instrumentos[canal[0]][2]
      for (const nota of canal.slice(2)) {
        if (!nota || nota <= 0) continue
        const frequencia = base * 2 ** (((nota | 0) - 12) / 12)
        if (frequencia >= REGIAO_DOS_EFEITOS[0] && frequencia <= REGIAO_DOS_EFEITOS[1]) noCompasso++
      }
    }
    total += noCompasso
    maximo = Math.max(maximo, noCompasso / (passos * passoEmSegundos))
  }
  return { mediaPorSegundo: total / duracao, maximoPorSegundo: maximo }
}

// Energia de cada seção (dB RMS depois do master), na ordem em que o áudio toca: as subidas e descidas
function imprimirEnergiaPorSecao(faixa, canais) {
  const secoes = SECOES_DAS_MUSICAS[faixa.id]
  if (!secoes) return
  const [, padroes, sequencia, bpm] = faixa.song
  const passo = (SAMPLE_RATE / bpm * 60) >> 2
  const inicioDoCompasso = []
  let posicao = 0
  for (const indice of sequencia) {
    inicioDoCompasso[indice] = posicao
    posicao += (padroes[indice][0].length - 2) * passo
  }
  const partes = secoes.map((secao) => {
    const de = inicioDoCompasso[secao.inicio]
    const ate = de + secao.compassos * (padroes[secao.inicio][0].length - 2) * passo
    let soma = 0
    for (const canal of canais) for (let i = de; i < ate; i++) soma += canal[i] * canal[i]
    return `${secao.nome} (${secao.compassos}) ${numero(10 * Math.log10(soma / (2 * (ate - de))))}`
  })
  console.log(`  energia por seção (dB RMS): ${partes.join(' → ')}`)

  // Atividade: ataques por segundo de todos os canais (notas e batidas), por seção
  const segundosPorCompasso = (padroes[0][0].length - 2) * passo / SAMPLE_RATE
  const atividade = secoes.map((secao) => {
    let ataques = 0
    for (let compasso = secao.inicio; compasso < secao.inicio + secao.compassos; compasso++) {
      for (const canal of padroes[compasso]) ataques += canal.slice(2).filter((nota) => nota > 0).length
    }
    return `${secao.nome} ${numero(ataques / (secao.compassos * segundosPorCompasso))}`
  })
  console.log(`  atividade por seção (ataques/s, todos os instrumentos): ${atividade.join(' → ')}`)
}

function imprimirDensidade(densidade) {
  console.log(`  ataques de notas entre ${REGIAO_DOS_EFEITOS[0]} e ${REGIAO_DOS_EFEITOS[1]} Hz (região dos efeitos): ${numero(densidade.mediaPorSegundo, 2)}/s na média, ${numero(densidade.maximoPorSegundo, 2)}/s no compasso mais cheio`)
}

// Na versão antiga: madeira, kick, caixa, ride e chimbal
const PERCUSSAO_ANTIGA = [4, 5, 6, 7, 8]

// Espectro só dos instrumentos de altura: é onde o aliasing das ondas cruas aparece
function espectroSemBateria(song, percussao) {
  const [instrumentos, padroes, sequencia, bpm] = song
  const semBateria = padroes.map((padrao) => padrao.map((linha) => (
    percussao.includes(linha[0]) ? linha.map((valor, i) => (i < 2 ? valor : 0)) : linha
  )))
  const canais = generateZzfxMusicSamples([instrumentos, semBateria, sequencia, bpm], SAMPLE_RATE, { loop: true })
  return distribuicaoEspectral(mono(canais), SAMPLE_RATE)
}

function imprimirSemBateria(espectro) {
  console.log(`  só instrumentos de altura (sem bateria): acima de 5 kHz ${numero(espectro.acimaPct, 3)}% · entre 2 e 5 kHz ${numero(espectro.faixa2a5kPct, 2)}%`)
}

const argumentos = process.argv.slice(2)
const filtro = argumentos.flatMap((valor, indice) => (argumentos[indice - 1] === '--so' ? [valor] : []))
const medirCanais = argumentos.includes('--canais')
const medirInstrumentos = argumentos.includes('--instrumentos')

const numero = (valor, casas = 1) => (Number.isFinite(valor) ? valor.toFixed(casas) : '-∞')

function imprimirMedicoes(titulo, m) {
  console.log(`\n${titulo}`)
  console.log(`  duração ${numero(m.duracao, 2)} s · pico ${numero(m.picoDb)} dBFS · RMS ${numero(m.rmsDb)} dBFS · clipadas ${m.clipadas}`)
  console.log(`  energia acima de 5 kHz ${numero(m.acima5kPct, 2)}% · entre 2 e 5 kHz ${numero(m.faixa2a5kPct, 2)}% · centroide ${numero(m.centroideHz, 0)} Hz`)
  const emenda = Math.max(m.emendaEsquerda, m.emendaDireita)
  const ok = emenda <= m.saltoP95 ? 'ok' : 'ACIMA DO TÍPICO'
  console.log(`  emenda do loop E ${m.emendaEsquerda.toFixed(4)} D ${m.emendaDireita.toFixed(4)} · salto típico mediana ${m.saltoMediano.toFixed(4)} p95 ${m.saltoP95.toFixed(4)} → ${ok}`)
}

// Mede cada canal da música sozinho (mesmo ganho da mistura) e a faixa de alturas que ele toca
function imprimirCanais(song, ganho) {
  const [instrumentos, padroes, sequencia, bpm] = song
  const total = padroes[0].length
  console.log('  canal  instr  pan    RMS rel.   pico rel.  >5kHz   alturas (MIDI que soam)')
  const misturaRms = []
  for (let canal = 0; canal < total; canal++) {
    // Os outros canais ficam mudos (mesmo tamanho, sem notas): o ZzFXM mede o padrão pelo canal 0
    const soPadroes = padroes.map((padrao) => padrao.map((linha, indice) => (indice === canal ? linha : linha.map((valor, i) => (i < 2 ? valor : 0)))))
    const canais = generateZzfxMusicSamples([instrumentos, soPadroes, sequencia, bpm], SAMPLE_RATE, { loop: true, normalize: false })
    let soma = 0
    let pico = 0
    for (const c of canais) {
      for (let i = 0; i < c.length; i++) {
        soma += (c[i] * ganho) ** 2
        pico = Math.max(pico, Math.abs(c[i] * ganho))
      }
    }
    const rms = Math.sqrt(soma / (canais[0].length * 2))
    misturaRms.push(rms)
    const { acimaPct } = distribuicaoEspectral(canais[0], SAMPLE_RATE)

    let menor = Infinity
    let maior = -Infinity
    const [indiceInstrumento, pan] = padroes[0][canal]
    const base = instrumentos[indiceInstrumento][2]
    for (const padrao of padroes) {
      for (const nota of padrao[canal].slice(2)) {
        if (!nota || nota <= 0) continue
        const midi = 69 + 12 * Math.log2(base * 2 ** (((nota | 0) - 12) / 12) / 440)
        menor = Math.min(menor, midi)
        maior = Math.max(maior, midi)
      }
    }
    const rmsDb = 20 * Math.log10(rms || 1e-9)
    console.log(`  ${String(canal).padStart(5)}  ${String(indiceInstrumento).padStart(5)}  ${numero(pan, 2).padStart(5)}  ${numero(rmsDb).padStart(7)} dB  ${numero(20 * Math.log10(pico || 1e-9)).padStart(7)} dB  ${numero(acimaPct, 2).padStart(5)}%  ${Number.isFinite(menor) ? `${Math.round(menor)}–${Math.round(maior)}` : '(mudo)'}`)
  }
}

function imprimirInstrumentos() {
  console.log('\nTimbres da biblioteca (uma nota em cada ponta do registro e no meio)')
  console.log('  instrumento            nota  >5kHz  centroide  fora da série harmônica')
  for (const [nome, instrumento] of Object.entries(INSTRUMENTOS)) {
    const [minimo, maximo] = instrumento.registro
    const alturas = instrumento.percussao ? [instrumento.baseMidi] : [minimo, Math.round((minimo + maximo) / 2), maximo]
    for (const midi of alturas) {
      const parametros = [...instrumento.parametros]
      parametros[1] = 0
      parametros[2] = midiParaFrequencia(midi) * (instrumento.parametros[2] / midiParaFrequencia(instrumento.baseMidi))
      const amostras = generateZzfxSamples(parametros)
      const { acimaPct, centroideHz } = distribuicaoEspectral(amostras, SAMPLE_RATE, 5000, 2048)
      const fora = instrumento.percussao ? '-' : `${numero(inarmonicidade(amostras, SAMPLE_RATE, parametros[2]), 2)}%`
      console.log(`  ${nome.padEnd(22)} ${String(midi).padStart(4)}  ${numero(acimaPct, 2).padStart(5)}%  ${numero(centroideHz, 0).padStart(6)} Hz  ${fora}`)
    }
  }

  console.log('\nTimbres da versão antiga (a mesma medição, um Lá acima da frequência-base)')
  for (const [nome, original] of Object.entries(INSTRUMENTOS_ANTIGOS)) {
    const parametros = [...original]
    parametros[1] = 0
    parametros[2] = original[2] * 2 ** (9 / 12)
    const amostras = generateZzfxSamples(parametros)
    const { acimaPct, centroideHz } = distribuicaoEspectral(amostras, SAMPLE_RATE, 5000, 2048)
    const midi = Math.round(69 + 12 * Math.log2(parametros[2] / 440))
    console.log(`  ${nome.padEnd(22)} ${String(midi).padStart(4)}  ${numero(acimaPct, 2).padStart(5)}%  ${numero(centroideHz, 0).padStart(6)} Hz  ${numero(inarmonicidade(amostras, SAMPLE_RATE, parametros[2]), 2)}%`)
  }
}

mkdirSync(PASTA, { recursive: true })
fixarAleatorio()

if (medirInstrumentos) imprimirInstrumentos()

if (filtro.length === 0 || filtro.includes('vila-espera-antiga')) {
  const antiga = generateZzfxMusicSamples(VILA_ESPERA_ANTIGA_SONG, SAMPLE_RATE)
  salvarWav(join(PASTA, 'vila-espera-antiga.wav'), antiga, SAMPLE_RATE)
  imprimirMedicoes('vila-espera-antiga (versão anterior, como tocava: sem loop contínuo nem master)', medirFaixa(antiga, SAMPLE_RATE))
  imprimirSemBateria(espectroSemBateria(VILA_ESPERA_ANTIGA_SONG, PERCUSSAO_ANTIGA))
  if (medirCanais) imprimirCanais(VILA_ESPERA_ANTIGA_SONG, 1)
}

for (const faixa of FAIXAS) {
  if (filtro.length && !filtro.includes(faixa.id)) continue

  const brutos = generateZzfxMusicSamples(faixa.song, SAMPLE_RATE, { loop: true, normalize: false })
  let picoBruto = 0
  for (const c of brutos) for (let i = 0; i < c.length; i++) picoBruto = Math.max(picoBruto, Math.abs(c[i]))

  const preparada = prepararFaixa(obterFaixa(faixa.id), SAMPLE_RATE)
  const seco = preparada.canais

  imprimirMedicoes(`${faixa.id} (corpo em loop, saída do worker; soma bruta dos canais com pico ${picoBruto.toFixed(2)})`, medirFaixa(seco, SAMPLE_RATE))
  imprimirSemBateria(espectroSemBateria(faixa.song, faixa.percussao))
  imprimirDensidade(densidadeNaRegiaoDosEfeitos(faixa.song, faixa.instrumentos))
  const final = aplicarCadeiaDoMaster(seco, SAMPLE_RATE, faixa.reverb)
  imprimirMedicoes(`${faixa.id} (corpo em loop, depois da cadeia do master, reverb ${Math.round(faixa.reverb * 100)}%)`, medirFaixa(final, SAMPLE_RATE))
  imprimirEnergiaPorSecao(faixa, final)

  if (!preparada.intro) {
    salvarWav(join(PASTA, `${faixa.id}-seco.wav`), seco, SAMPLE_RATE)
    salvarWav(join(PASTA, `${faixa.id}.wav`), final, SAMPLE_RATE)
  } else {
    // Como o jogador ouve: a introdução (com a cauda) e, no fim dela, o corpo duas vezes seguidas
    const inicioDoCorpo = preparada.introAmostras
    const corpo = seco[0].length
    const total = inicioDoCorpo + corpo * 2
    const ouvido = [new Float32Array(total), new Float32Array(total)]
    for (let c = 0; c < 2; c++) {
      const intro = preparada.intro[c]
      for (let i = 0; i < intro.length && i < total; i++) ouvido[c][i] += intro[i]
      // Na primeira entrada o corpo sobe de 0 a 1 em ENTRADA_DO_CORPO (como em fonteComIntro.js)
      const rampa = Math.round(ENTRADA_DO_CORPO * SAMPLE_RATE)
      for (let volta = 0; volta < 2; volta++) {
        for (let i = 0; i < corpo; i++) {
          const ganho = volta === 0 && i < rampa ? i / rampa : 1
          ouvido[c][inicioDoCorpo + volta * corpo + i] += seco[c][i] * ganho
        }
      }
    }
    const ouvidoFinal = aplicarCadeiaDoMaster(ouvido, SAMPLE_RATE, faixa.reverb, { loop: false })
    salvarWav(join(PASTA, `${faixa.id}-seco.wav`), ouvido, SAMPLE_RATE)
    salvarWav(join(PASTA, `${faixa.id}.wav`), ouvidoFinal, SAMPLE_RATE)

    const [, padroesDaIntro, , bpm] = obterFaixa(faixa.id).intro
    const compasso = (padroesDaIntro[0][0].length - 2) * ((SAMPLE_RATE / bpm * 60) >> 2)
    const compassosDaIntro = Math.round(inicioDoCorpo / compasso)
    const niveis = niveisPorTrecho(ouvidoFinal, 0, compasso, compassosDaIntro + 4).map((db) => numero(db))
    const medida = medirFaixa(ouvidoFinal, SAMPLE_RATE)
    // Estalo aparece como salto na amostra exata da passagem; o ataque do tempo forte, nos ±50 ms
    // em volta, se compara com os outros tempos fortes do corpo
    const naPassagem = maiorSaltoPerto(ouvido, inicioDoCorpo, 2)
    const salto = maiorSaltoPerto(ouvidoFinal, inicioDoCorpo, Math.round(SAMPLE_RATE * 0.05))
    const outrosTemposFortes = [4, 8, 16].map((n) => maiorSaltoPerto(ouvidoFinal, inicioDoCorpo + n * compasso, Math.round(SAMPLE_RATE * 0.05)))
    console.log(`\n${faixa.id}: introdução de ${compassosDaIntro} compassos = ${numero(inicioDoCorpo / SAMPLE_RATE, 2)} s; o corpo entra na amostra ${inicioDoCorpo} (início de compasso)`)
    console.log(`  nível por compasso (dB RMS, como o jogador ouve): introdução ${niveis.slice(0, compassosDaIntro).join(' → ')} | corpo ${niveis.slice(compassosDaIntro).join(' · ')}`)
    console.log(`  passagem introdução → corpo: salto na amostra da passagem ${naPassagem.toFixed(4)} (mediana da faixa ${medida.saltoMediano.toFixed(4)}) · ataque do tempo forte ±50 ms ${salto.toFixed(4)} (outros tempos fortes: ${outrosTemposFortes.map((v) => v.toFixed(4)).join(', ')})`)
    console.log(`  pico ${numero(medida.picoDb)} dBFS · clipadas ${medida.clipadas}`)
  }
  if (medirCanais) imprimirCanais(faixa.song, 0.89 / picoBruto)
}

// Impressão digital das melodias dos andares e a distância entre elas (0 = iguais, 1 = nada em comum)
const ANDARES = Object.keys(MELODIAS_DAS_MUSICAS).filter((id) => filtro.length === 0 || filtro.includes(id))
if (ANDARES.length) {
  const pct = (valor) => `${Math.round(valor * 100)}%`
  const impressoes = Object.fromEntries(ANDARES.map((id) => [id, impressaoMelodica(obterMusica(id), INSTRUMENTOS_DAS_MUSICAS[id], MELODIAS_DAS_MUSICAS[id], chavesDaCelula(MOTIVOS_DAS_MUSICAS[id]))]))
  console.log('\nMelodias dos andares (impressão digital)')
  for (const id of ANDARES) {
    const m = impressoes[id].medidas
    console.log(`  ${id.padEnd(17)} ${String(impressoes[id].total).padStart(3)} notas · célula ${pct(m.celula)} · tercina do meio ${pct(m.tercinaDoMeio)} · fora do tempo ${pct(m.foraDoTempo)} · antecipações ${pct(m.antecipacoes)}`)
    console.log(`  ${''.padEnd(17)} repetidas ${pct(m.repetidas)} · semitons ${pct(m.semitons)} · quarta a sexta ${pct(m.quartaSexta)} · saltos ≥ 6ª ${pct(m.saltos)} · tempo e meio ${pct(m.hemiola)} · longas ${pct(m.longas)}`)
  }
  if (ANDARES.length > 1) {
    console.log('  distância entre as melodias:')
    for (const id of ANDARES) {
      const linha = ANDARES.map((outro) => (outro === id ? '   · ' : distanciaMelodica(impressoes[id], impressoes[outro]).toFixed(2).padStart(5)))
      console.log(`    ${id.replace('andar-', '').padEnd(11)} ${linha.join(' ')}`)
    }
  }
}

console.log(`\nArquivos em ${PASTA}`)
