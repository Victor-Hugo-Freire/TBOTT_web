// Renderiza em WAV as faixas das salas do chefe e do palco (chefe.js e palco.js) e imprime as medições.
//
//   npm run trilha:salas                       todas as faixas das salas
//   npm run trilha:salas -- --so chefe-final   só uma (pode repetir --so)
//
// Saída em tmp/trilha/salas/ (fora do Git), como o jogador ouve (nível da faixa e cadeia do master):
//   <id>.wav          faixa com introdução: a introdução e, no fim dela, o corpo duas vezes (para ouvir a entrada e o loop);
//                     faixa sem introdução: o corpo uma vez; final (unica): o final inteiro, com a cauda
//   <id>-seco.wav     só a preparação do worker (sem filtros, reverb nem compressor)
//
// O nível (faixas.js) iguala o volume percebido ao dos andares: este script mostra o volume de cada faixa e o dos andares,
// e o nível ideal para igualar. Mude o `nivel` no registro, não a música.

import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateZzfxMusicSamples } from '../src/audio/zzfxmExperimental.js'
import { ZZFX_EXPERIMENTAL_SAMPLE_RATE } from '../src/audio/zzfxExperimental.js'
import { CADEIA_DO_MASTER, prepararFaixa } from '../src/audio/masterizacao.js'
import { FAIXAS, ganhoDoNivel } from '../src/audio/music/faixas.js'
import { INSTRUMENTOS_DAS_MUSICAS, METAS_DAS_MUSICAS, METAS_DAS_SALAS, MUSICAS, obterFaixa } from '../src/audio/music/musicas.js'
import { BAIXOS } from '../src/audio/music/analiseDosAndares.js'
import { ENTRADA_DO_CORPO } from '../src/audio/fonteComIntro.js'
import { aplicarCadeiaDoMaster, bandasDeEnergia, energiaAcimaDe, mono, salvarWav, volumePercebido } from './trilha/analise.mjs'

const SAMPLE_RATE = ZZFX_EXPERIMENTAL_SAMPLE_RATE
const PASTA = join(fileURLToPath(new URL('..', import.meta.url)), 'tmp', 'trilha', 'salas')

// O `randomness` do ZzFX usa Math.random: com semente, dois renders saem iguais (a mesma dos testes)
let estado = 20261125 >>> 0
Math.random = () => {
  estado = (estado + 0x6d2b79f5) >>> 0
  let t = Math.imul(estado ^ (estado >>> 15), estado | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const argumentos = process.argv.slice(2)
const escolhidas = argumentos.flatMap((valor, i) => (valor === '--so' ? [argumentos[i + 1]] : []))
const ids = Object.keys(MUSICAS).filter((id) => FAIXAS[id]?.doComeco && (escolhidas.length === 0 || escolhidas.includes(id)))
if (ids.length === 0) throw new Error(`Nenhuma faixa de sala com esse nome. Faixas: ${Object.keys(MUSICAS).filter((id) => FAIXAS[id]?.doComeco).join(', ')}`)
mkdirSync(PASTA, { recursive: true })

const pct = (valor) => `${Math.round(100 * valor)}%`
const comNivel = (canais, id) => canais.map((canal) => canal.map((valor) => valor * ganhoDoNivel(id)))

function baixoSozinho(id) {
  const [instrumentos, padroes, sequencia, bpm] = MUSICAS[id]
  const nomes = INSTRUMENTOS_DAS_MUSICAS[id]
  const filtrados = padroes.map((padrao) => padrao.map((linha) => (BAIXOS.includes(nomes[linha[0]]) ? linha : linha.map((valor, i) => (i < 2 ? valor : 0)))))
  return mono(generateZzfxMusicSamples([instrumentos, filtrados, sequencia, bpm], SAMPLE_RATE, { loop: true, normalize: false }))
}

// Volume dos andares (depois da cadeia do master), para comparar
const volumesDosAndares = Object.keys(METAS_DAS_MUSICAS).map((id) => {
  const { canais } = prepararFaixa(obterFaixa(id), SAMPLE_RATE)
  return volumePercebido(aplicarCadeiaDoMaster(comNivel(canais, id), SAMPLE_RATE, FAIXAS[id].reverb), SAMPLE_RATE)
})
const mediaDosAndares = volumesDosAndares.reduce((soma, valor) => soma + valor, 0) / volumesDosAndares.length
console.log(`Volume dos andares (depois do master): média ${mediaDosAndares.toFixed(1)} LUFS, de ${Math.min(...volumesDosAndares).toFixed(1)} a ${Math.max(...volumesDosAndares).toFixed(1)}\n`)

for (const id of ids) {
  const inicio = Date.now()
  const preparada = prepararFaixa(obterFaixa(id), SAMPLE_RATE)
  const segundos = (Date.now() - inicio) / 1000
  const seco = preparada.canais
  const reverb = FAIXAS[id].reverb ?? CADEIA_DO_MASTER.reverbPadrao
  const final = aplicarCadeiaDoMaster(comNivel(seco, id), SAMPLE_RATE, reverb)
  const unica = Boolean(FAIXAS[id].unica)
  const duracao = seco[0].length / SAMPLE_RATE
  const volume = volumePercebido(final, SAMPLE_RATE)
  const { energia, peloOuvido } = bandasDeEnergia(mono(comNivel(seco, id)), SAMPLE_RATE)
  const meta = METAS_DAS_SALAS[id]
  const titulo = `${id} · ${FAIXAS[id].titulo}${meta ? ` · ${meta.tonalidade}, ♩ = ${meta.andamento}, ${meta.compassos} compassos` : ''}`
  console.log(titulo)
  console.log(`  ${duracao.toFixed(1)} s${preparada.intro ? ` + introdução de ${(preparada.introAmostras / SAMPLE_RATE).toFixed(1)} s` : ''}${unica ? ' (toca uma vez)' : ' (loop)'} · render ${segundos.toFixed(1)} s · nível ${FAIXAS[id].nivel ?? 0} dB`)
  console.log(`  sub ${pct(energia.sub)} · grave ${pct(energia.grave)} · agudo pelo ouvido (> 2 kHz) ${pct(peloOuvido.presenca + peloOuvido.agudo)} · baixo acima de 150 Hz: ${pct(energiaAcimaDe(baixoSozinho(id), SAMPLE_RATE, 150))}`)
  console.log(`  volume ${volume.toFixed(1)} LUFS${unica ? ' (inclui o silêncio da cauda: o pico é igual ao das outras faixas)' : ` · nível ideal para igualar aos andares: ${((FAIXAS[id].nivel ?? 0) + mediaDosAndares - volume).toFixed(1)} dB`}\n`)

  salvarWav(join(PASTA, `${id}-seco.wav`), seco, SAMPLE_RATE)
  if (!preparada.intro) {
    salvarWav(join(PASTA, `${id}.wav`), final, SAMPLE_RATE)
    continue
  }
  // Como o jogador ouve: a introdução (com a cauda) e, no fim dela, o corpo duas vezes seguidas
  const inicioDoCorpo = preparada.introAmostras
  const corpo = seco[0].length
  const total = inicioDoCorpo + corpo * 2
  const ouvido = [new Float32Array(total), new Float32Array(total)]
  const rampa = Math.round(ENTRADA_DO_CORPO * SAMPLE_RATE)
  for (let c = 0; c < 2; c++) {
    for (let i = 0; i < preparada.intro[c].length && i < total; i++) ouvido[c][i] += preparada.intro[c][i]
    for (let volta = 0; volta < 2; volta++) {
      for (let i = 0; i < corpo; i++) ouvido[c][inicioDoCorpo + volta * corpo + i] += seco[c][i] * (volta === 0 && i < rampa ? i / rampa : 1)
    }
  }
  salvarWav(join(PASTA, `${id}.wav`), aplicarCadeiaDoMaster(comNivel(ouvido, id), SAMPLE_RATE, reverb, { loop: false }), SAMPLE_RATE)
}
console.log(`Arquivos em ${PASTA}`)
