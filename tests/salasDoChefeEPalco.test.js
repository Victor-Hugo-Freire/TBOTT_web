import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import { INSTRUMENTOS, alturaDaNota, midiParaFrequencia } from '../src/audio/music/instrumentos.js'
import { FAIXAS, ganhoDoNivel } from '../src/audio/music/faixas.js'
import {
  COMPASSOS_DAS_INTROS,
  HARMONIAS_DAS_SALAS,
  INSTRUMENTOS_DAS_INTROS,
  INSTRUMENTOS_DAS_MUSICAS,
  INTROS,
  METAS_DAS_MUSICAS,
  METAS_DAS_SALAS,
  MOTIVOS_DAS_SALAS,
  MUSICAS,
  SECOES_DAS_SALAS,
  obterFaixa,
} from '../src/audio/music/musicas.js'
import { getBossTrack, getTrackForContext } from '../src/audio/music/trackSelection.js'
import { getGameMusicContext } from '../src/audio/music/contextoDoJogo.js'
import { criarMesaDoJogo, decidirMusica, FADES, faixasParaPreparar } from '../src/audio/music/mesaDoJogo.js'
import { generateZzfxMusicSamples } from '../src/audio/zzfxmExperimental.js'
import { prepararFaixa } from '../src/audio/masterizacao.js'
import { BAIXOS, unissonosPorMinuto } from '../src/audio/music/analiseDosAndares.js'
import { bandasDeEnergia, energiaAcimaDe, mono, volumePercebido } from '../scripts/trilha/analise.mjs'
import { criarCacheFalso, criarContextoFalso, criarNo } from './helpers/audioFalso.js'

const SALAS = Object.keys(METAS_DAS_SALAS) // os corpos em loop do chefe e do palco
const CHEFES = SALAS.filter((id) => id.startsWith('chefe'))
const FINAIS = Object.keys(MUSICAS).filter((id) => FAIXAS[id]?.unica) // vitórias e fim do palco
const PASSOS = 48

const canaisDe = (id) => MUSICAS[id][1].map((padrao) => padrao.map((canal) => ({ nome: INSTRUMENTOS_DAS_MUSICAS[id][canal[0]], passos: canal.slice(2) })))
const notasDe = (canal) => canal.passos.flatMap((nota, passo) => (nota > 0 ? [{ passo, nota }] : []))
const temNota = (canal) => canal.passos.some((nota) => nota > 0)

// --------------------------------------------------
// Estrutura: grade de 12 passos, compassos inteiros, introduções e finais
// --------------------------------------------------

describe('faixas do chefe e do palco: estrutura', () => {
  for (const id of SALAS) {
    test(`${id}: ${PASSOS} passos por compasso, seções somam os compassos e o registro bate`, () => {
      const meta = METAS_DAS_SALAS[id]
      const [, padroes, , bpm] = MUSICAS[id]
      assert.equal(padroes.length, meta.compassos)
      assert.equal(meta.passosPorTempo, 12)
      for (const padrao of padroes) for (const canal of padrao) assert.equal(canal.length - 2, PASSOS)
      assert.equal(SECOES_DAS_SALAS[id].reduce((total, secao) => total + secao.compassos, 0), meta.compassos)
      assert.equal(HARMONIAS_DAS_SALAS[id].length, meta.compassos)
      assert.equal(bpm, meta.andamento * 3, 'o bpm do ZzFXM conta semicolcheias: 12 passos por tempo = andamento × 3')
      assert.equal(FAIXAS[id].andamento, meta.andamento, 'faixas.js e a partitura têm o mesmo andamento')
      assert.equal(FAIXAS[id].temposPorCompasso, meta.temposPorCompasso)
    })
  }

  test('o chefe sobe um degrau do ciclo de terças menores a cada fase, e cada fase é mais rápida', () => {
    const tons = (ids) => ids.map((id) => METAS_DAS_SALAS[id].tonalidade)
    assert.deepEqual(tons(['chefe', 'chefe-fase2']), ['G menor', 'B♭ menor'])
    assert.deepEqual(tons(['chefe-final', 'chefe-final-fase2', 'chefe-final-fase3']), ['G menor', 'B♭ menor', 'D♭ menor'])
    const andamentos = (ids) => ids.map((id) => METAS_DAS_SALAS[id].andamento)
    for (const lista of [andamentos(['chefe', 'chefe-fase2']), andamentos(['chefe-final', 'chefe-final-fase2', 'chefe-final-fase3'])]) {
      assert.deepEqual([...lista].sort((a, b) => a - b), lista)
      assert.equal(new Set(lista).size, lista.length)
    }
  })

  test('o chefe é mais rápido que qualquer andar, e a tônica do chefe e a do palco não repetem a de nenhum andar', () => {
    const maisRapido = Math.max(...Object.values(METAS_DAS_MUSICAS).map((meta) => meta.andamento))
    const tonicasDosAndares = new Set(Object.values(METAS_DAS_MUSICAS).map((meta) => meta.tonica))
    for (const id of CHEFES) assert.ok(METAS_DAS_SALAS[id].andamento > maisRapido, id)
    for (const id of SALAS) assert.equal(tonicasDosAndares.has(METAS_DAS_SALAS[id].tonica), false, id)
  })

  test('o chefe final é maior que o chefe comum: mais camadas, mais fases e a vitória mais longa', () => {
    assert.ok(INSTRUMENTOS_DAS_MUSICAS['chefe-final'].length > INSTRUMENTOS_DAS_MUSICAS.chefe.length - 1)
    assert.ok(INSTRUMENTOS_DAS_MUSICAS['chefe-final'].includes('clarinete'))
    assert.ok(COMPASSOS_DAS_INTROS['chefe-final'] > COMPASSOS_DAS_INTROS.chefe)
    assert.ok(MUSICAS['chefe-final-vitoria'][1].length > MUSICAS['chefe-vitoria'][1].length)
    const notasNoTotal = (id) => canaisDe(id).flat().reduce((total, canal) => total + notasDe(canal).length, 0)
    assert.ok(notasNoTotal('chefe-final') > notasNoTotal('chefe'))
  })

  for (const [id, compassos] of Object.entries(COMPASSOS_DAS_INTROS)) {
    test(`${id}: a introdução tem ${compassos} compassos inteiros, no mesmo bpm do corpo`, () => {
      const [instrumentos, padroes, sequencia, bpm] = INTROS[id]
      assert.equal(padroes.length, compassos)
      assert.equal(sequencia.length, compassos)
      assert.equal(bpm, MUSICAS[id][3])
      for (const padrao of padroes) for (const canal of padrao) assert.equal(canal.length - 2, PASSOS)
      assert.equal(instrumentos.length, INSTRUMENTOS_DAS_INTROS[id].length)
      INSTRUMENTOS_DAS_INTROS[id].forEach((nome, indice) => assert.deepEqual(instrumentos[indice], INSTRUMENTOS[nome].parametros, nome))
      // O corpo entra no tempo forte: nada toca no último tempo do último compasso, só o tung-tung-tung (e o rufo)
      const ultimo = padroes.at(-1)
      const nomes = INSTRUMENTOS_DAS_INTROS[id]
      for (const canal of ultimo) {
        const nome = nomes[canal[0]]
        const depois = canal.slice(2 + 34).filter((nota) => nota > 0)
        if (!['madeira', 'caixa', 'caixaCorpo', 'timpano'].includes(nome)) assert.equal(depois.length, 0, `${id}: ${nome} toca no tung-tung-tung`)
      }
    })
  }

  for (const id of FINAIS) {
    test(`${id}: o final toca uma vez, começa com som e termina em silêncio para a cauda`, () => {
      const padroes = MUSICAS[id][1]
      assert.equal(FAIXAS[id].unica, true)
      assert.equal(MUSICAS[id][3], FAIXAS[id].andamento * 3)
      assert.ok(canaisDe(id)[0].some(temNota), 'o primeiro compasso tem música')
      assert.ok(padroes.length >= 6)
      const calados = canaisDe(id).slice(-2)
      for (const compasso of calados) {
        // Nos dois últimos compassos só as palmas (o aplauso que some) podem tocar
        for (const canal of compasso) if (canal.nome !== 'palmas') assert.equal(temNota(canal), false, `${id}: ${canal.nome} no fim`)
      }
    })
  }
})

// --------------------------------------------------
// Motivo do Tung, ritmo e registro
// --------------------------------------------------

describe('faixas do chefe e do palco: motivo, ritmo e registro', () => {
  for (const id of SALAS) {
    test(`${id}: o tung-tung-tung é uma tercina de verdade (passos 36, 40 e 44) e fecha a frase`, () => {
      const { tung } = MOTIVOS_DAS_SALAS[id]
      const compassos = canaisDe(id)
      for (const compasso of tung.compassos) {
        const madeira = compassos[compasso].find((canal) => canal.nome === 'madeira')
        assert.deepEqual(notasDe(madeira).map(({ passo }) => passo), [36, 40, 44])
        for (const canal of compassos[compasso]) {
          if (canal.nome === 'madeira') continue
          assert.equal(notasDe(canal).filter(({ passo }) => passo >= 34).length, 0, `${id} compasso ${compasso}: ${canal.nome}`)
        }
      }
    })
  }

  test('o chefe tem tung-tung-tung na maioria das seções e a célula do Tung (5 – ♭7 – 1\' – ♭7 – 5)', () => {
    for (const id of [...CHEFES, 'palco-show']) {
      const { tung, celula } = MOTIVOS_DAS_SALAS[id]
      assert.ok(tung.compassos.length >= 5, `${id}: ${tung.compassos.length} tung-tung-tung`)
      assert.ok(celula.compassos.length >= 1, `${id}: sem célula`)
      for (const compasso of celula.compassos) {
        const achou = canaisDe(id)[compasso].some((canal) => {
          const notas = notasDe(canal)
          if (notas.map(({ passo }) => passo).join() !== '0,8,12,20,24') return false
          const alturas = notas.map(({ nota }) => alturaDaNota(nota, canal.nome))
          return alturas.map((altura) => altura - alturas[0]).join() === '0,3,5,3,0'
        })
        assert.ok(achou, `${id} compasso ${compasso}: a célula não está em nenhum canal`)
      }
    }
  })

  test('sem dois instrumentos na mesma nota e oitava ao mesmo tempo (no máximo 1,5 por minuto), nas faixas, nos finais e nas introduções', () => {
    for (const id of [...SALAS, ...FINAIS]) {
      const valor = unissonosPorMinuto(MUSICAS[id], INSTRUMENTOS_DAS_MUSICAS[id])
      assert.ok(valor <= 1.5, `${id}: ${valor.toFixed(1)}/min`)
    }
    for (const id of Object.keys(COMPASSOS_DAS_INTROS)) {
      const valor = unissonosPorMinuto(INTROS[id], INSTRUMENTOS_DAS_INTROS[id])
      assert.ok(valor <= 1.5, `introdução ${id}: ${valor.toFixed(1)}/min`)
    }
  })

  for (const id of [...CHEFES, 'palco-show']) {
    test(`${id}: ritmo variado (tempos, colcheias, semicolcheias, tercinas e pausas) e viradas`, () => {
      const posicoes = new Set()
      let comPausa = 0
      const compassos = canaisDe(id)
      for (const compasso of compassos) {
        for (const canal of compasso) for (const { passo } of notasDe(canal)) posicoes.add(passo % 12)
        // Pausa: um compasso em que nenhum canal toca nos passos 30 a 35 e a melodia ou o ostinato deixam espaço
        if (!compasso.some((canal) => notasDe(canal).some(({ passo }) => passo >= 30 && passo < 36))) comPausa += 1
      }
      assert.ok(posicoes.has(0), 'tempo')
      assert.ok(posicoes.has(6), 'colcheia')
      assert.ok(posicoes.has(3) && posicoes.has(9), 'semicolcheia')
      assert.ok(posicoes.has(4) && posicoes.has(8), 'tercina')
      assert.ok(comPausa >= 1, 'pausa')

      // Cada seção de 8 compassos ou mais termina diferente do compasso anterior na bateria (virada ou breque)
      let inicio = 0
      for (const secao of SECOES_DAS_SALAS[id]) {
        const fim = inicio + secao.compassos - 1
        if (secao.compassos >= 8) {
          const bateria = (compasso) => compassos[compasso].filter((canal) => INSTRUMENTOS[canal.nome].percussao && canal.nome !== 'madeira').map((canal) => canal.passos.join(',')).join('|')
          assert.notEqual(bateria(fim), bateria(fim - 1), `${id}: ${secao.nome} termina sem virada`)
        }
        inicio += secao.compassos
      }
    })

    test(`${id}: baixo com movimento e melodia no médio (nada acima de 880 Hz, no máximo 10% acima de 660 Hz)`, () => {
      const compassos = canaisDe(id)
      const alturasDoBaixo = []
      const freqsDaMelodia = []
      for (const compasso of compassos) {
        for (const canal of compasso) {
          if (BAIXOS.includes(canal.nome)) alturasDoBaixo.push(...notasDe(canal).map(({ nota }) => alturaDaNota(nota, canal.nome)))
          if (['trompete', 'clarinete', 'saxBaritono'].includes(canal.nome)) freqsDaMelodia.push(...notasDe(canal).map(({ nota }) => midiParaFrequencia(alturaDaNota(nota, canal.nome))))
        }
      }
      assert.ok(new Set(alturasDoBaixo.map((altura) => altura % 12)).size >= 5, 'o baixo anda por pelo menos 5 notas')
      const mediana = [...alturasDoBaixo].sort((a, b) => a - b)[Math.floor(alturasDoBaixo.length / 2)]
      assert.ok(midiParaFrequencia(mediana) >= 80, `mediana do baixo ${midiParaFrequencia(mediana).toFixed(0)} Hz`)
      if (freqsDaMelodia.length > 0) {
        assert.ok(Math.max(...freqsDaMelodia) <= 880, `melodia chega a ${Math.max(...freqsDaMelodia).toFixed(0)} Hz`)
        assert.ok(freqsDaMelodia.filter((f) => f > 660).length / freqsDaMelodia.length <= 0.1)
      }
    })
  }
})

// --------------------------------------------------
// Equilíbrio: grave e agudo, volume parecido com o dos andares e loop sem emenda (render)
// --------------------------------------------------

const SAMPLE_RATE = 44100
const aleatorioOriginal = Math.random
const medidas = {}

function fixarAleatorio(semente = 20261125) {
  let estado = semente >>> 0
  Math.random = () => {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = Math.imul(estado ^ (estado >>> 15), estado | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function baixoSozinho(id) {
  const [instrumentos, padroes, sequencia, bpm] = MUSICAS[id]
  const nomes = INSTRUMENTOS_DAS_MUSICAS[id]
  const filtrados = padroes.map((padrao) => padrao.map((linha) => (BAIXOS.includes(nomes[linha[0]]) ? linha : linha.map((valor, i) => (i < 2 ? valor : 0)))))
  return mono(generateZzfxMusicSamples([instrumentos, filtrados, sequencia, bpm], SAMPLE_RATE, { loop: true, normalize: false }))
}

function medir(id) {
  const { canais } = prepararFaixa(obterFaixa(id), SAMPLE_RATE)
  const nivel = ganhoDoNivel(id)
  const comNivel = canais.map((canal) => canal.map((valor) => valor * nivel))
  let pico = 0
  for (const canal of comNivel) for (let i = 0; i < canal.length; i++) pico = Math.max(pico, Math.abs(canal[i]))
  const saltos = []
  for (const canal of canais) for (let i = 1; i < canal.length; i += 17) saltos.push(Math.abs(canal[i] - canal[i - 1]))
  saltos.sort((a, b) => a - b)
  const { energia, peloOuvido } = bandasDeEnergia(mono(comNivel), SAMPLE_RATE)
  return {
    bandas: energia,
    peloOuvido,
    baixoAcimaDe150: energiaAcimaDe(baixoSozinho(id), SAMPLE_RATE, 150),
    volume: volumePercebido(comNivel, SAMPLE_RATE),
    pico,
    emenda: Math.max(...canais.map((canal) => Math.abs(canal[0] - canal[canal.length - 1]))),
    saltoP95: saltos[Math.floor(saltos.length * 0.95)],
  }
}

before(() => {
  fixarAleatorio()
  for (const id of [...Object.keys(METAS_DAS_MUSICAS), ...SALAS]) medidas[id] = medir(id)
})

after(() => {
  Math.random = aleatorioOriginal
})

const pct = (valor) => `${(100 * valor).toFixed(0)}%`

describe('equilíbrio do chefe e do palco (render)', () => {
  test('o agudo pelo ouvido (acima de 2 kHz) fica em até 10% do que se ouve', () => {
    for (const id of SALAS) {
      const { presenca, agudo } = medidas[id].peloOuvido
      assert.ok(presenca + agudo <= 0.1, `${id}: ${pct(presenca + agudo)}`)
    }
  })

  test('o sub (abaixo de 60 Hz) não passa de 25% da energia', () => {
    for (const id of SALAS) assert.ok(medidas[id].bandas.sub <= 0.25, `${id}: ${pct(medidas[id].bandas.sub)}`)
  })

  test('o baixo chega ao alto-falante pequeno: pelo menos 25% da energia dele acima de 150 Hz', () => {
    for (const id of SALAS) assert.ok(medidas[id].baixoAcimaDe150 >= 0.25, `${id}: ${pct(medidas[id].baixoAcimaDe150)}`)
  })

  test('o volume percebido fica a até 1 dB da média dos andares', () => {
    const andares = Object.keys(METAS_DAS_MUSICAS).map((id) => medidas[id].volume)
    const media = andares.reduce((soma, valor) => soma + valor, 0) / andares.length
    for (const id of SALAS) assert.ok(Math.abs(medidas[id].volume - media) <= 1, `${id}: ${medidas[id].volume.toFixed(2)} LUFS contra ${media.toFixed(2)} dos andares`)
  })

  test('o loop não tem emenda e nada passa do pico', () => {
    for (const id of SALAS) {
      const { emenda, saltoP95, pico } = medidas[id]
      assert.ok(emenda <= saltoP95, `${id}: emenda ${emenda.toFixed(4)} (p95 ${saltoP95.toFixed(4)})`)
      assert.ok(pico < 1, `${id}: pico ${pico.toFixed(3)}`)
    }
  })
})

// --------------------------------------------------
// Seleção da faixa e decisão da mesa
// --------------------------------------------------

const contexto = (mudancas = {}) => ({
  seed: 42, floorNumber: 2, roomType: 'comum', floorChange: false, bossPhase: 1, bossState: 'luta', palco: null, paused: false, dead: false, finished: false, ...mudancas,
})

describe('faixa do chefe e do palco por contexto', () => {
  test('andares 1 a 4 compartilham o chefe; o andar 5 é o Tralalero; cada fase tem a sua faixa', () => {
    for (const floorNumber of [1, 2, 3, 4]) {
      assert.equal(getBossTrack(floorNumber), 'chefe')
      assert.equal(getBossTrack(floorNumber, { bossPhase: 2 }), 'chefe-fase2')
      assert.equal(getBossTrack(floorNumber, { bossPhase: 3 }), 'chefe-fase2', 'o chefe comum só tem duas fases')
      assert.equal(getBossTrack(floorNumber, { bossState: 'vitoria' }), 'chefe-vitoria')
    }
    assert.deepEqual([1, 2, 3].map((bossPhase) => getBossTrack(5, { bossPhase })), ['chefe-final', 'chefe-final-fase2', 'chefe-final-fase3'])
    assert.equal(getBossTrack(5, { bossState: 'vitoria' }), 'chefe-final-vitoria')
  })

  test('palco: os bastidores com a Batuta no pedestal e depois da luta; o show durante as ondas', () => {
    assert.equal(getTrackForContext({ floorNumber: 3, roomType: 'palco', palco: 'espera' }), 'palco')
    assert.equal(getTrackForContext({ floorNumber: 3, roomType: 'palco', palco: 'show' }), 'palco-show')
    assert.equal(getTrackForContext({ floorNumber: 3, roomType: 'palco', palco: 'depois' }), 'palco')
  })

  test('sem as faixas compostas, a sala usa a faixa do andar', () => {
    assert.equal(getTrackForContext({ floorNumber: 2, roomType: 'chefe' }, ['andar-cantina', 'andar-cucina']), 'andar-cucina')
    assert.equal(getTrackForContext({ floorNumber: 2, roomType: 'palco', palco: 'show' }, ['andar-cantina', 'andar-cucina']), 'andar-cucina')
  })

  test('o contexto lê a luta do chefe de run.boss (sem ele, fase 1 lutando) e o palco de run.stage', () => {
    const sala = (type, extra = {}) => ({ id: 'a', type, emptied: [], ...extra })
    const run = (room, extra = {}) => ({ seed: 1, floor: { number: 5, rooms: [room] }, roomId: 'a', transition: null, death: null, finished: false, ...extra })
    assert.deepEqual([getGameMusicContext(run(sala('chefe'))).bossPhase, getGameMusicContext(run(sala('chefe'))).bossState], [1, 'luta'])
    const fase3 = getGameMusicContext(run(sala('chefe'), { boss: { phase: 3 } }))
    assert.deepEqual([fase3.bossPhase, fase3.bossState], [3, 'luta'])
    assert.equal(getGameMusicContext(run(sala('chefe'), { boss: { phase: 3, defeated: true } })).bossState, 'vitoria')
    assert.equal(getGameMusicContext(run(sala('comum'))).palco, null)
    assert.equal(getGameMusicContext(run(sala('palco'))).palco, 'espera')
    assert.equal(getGameMusicContext(run(sala('palco', { emptied: ['6-2'] }), { stage: { wave: 0, won: false } })).palco, 'show')
    assert.equal(getGameMusicContext(run(sala('palco', { emptied: ['6-2'] }), { stage: { wave: 3, won: true } })).palco, 'depois')
    assert.equal(getGameMusicContext(run(sala('palco', { emptied: ['6-2'] }))).palco, 'depois')
  })
})

describe('decisão da mesa nas salas do chefe e do palco', () => {
  test('entrar na sala do chefe: crossfade de 1,5 s; a faixa do chefe vem do começo', () => {
    const decisao = decidirMusica(contexto(), contexto({ roomType: 'chefe' }))
    assert.equal(decisao.faixa, 'chefe')
    assert.equal(decisao.entradaMs, FADES.sala)
    assert.equal(decisao.saidaMs, FADES.sala)
    assert.equal(decisao.quantizar, null)
  })

  test('a fase nova espera o fim do compasso e entra quase sem fade', () => {
    const decisao = decidirMusica(contexto({ roomType: 'chefe' }), contexto({ roomType: 'chefe', bossPhase: 2 }))
    assert.equal(decisao.faixa, 'chefe-fase2')
    assert.equal(decisao.quantizar, 'compasso')
    assert.equal(decisao.entradaMs, FADES.faseEntrada)
    assert.equal(decisao.saidaMs, FADES.faseSaida)
  })

  test('a vitória toca na hora em que o chefe cai e depois volta a faixa do andar', () => {
    const decisao = decidirMusica(contexto({ floorNumber: 5, roomType: 'chefe' }), contexto({ floorNumber: 5, roomType: 'chefe', bossState: 'vitoria' }))
    assert.equal(decisao.faixa, 'chefe-final-vitoria')
    assert.equal(decisao.depois, 'andar-porto')
    assert.equal(decisao.quantizar, 'tempo')
  })

  test('quem entra numa sala de chefe já vencido ouve a faixa do andar, não o final', () => {
    const entrando = decidirMusica(contexto(), contexto({ roomType: 'chefe', bossState: 'vitoria' }))
    assert.equal(entrando.faixa, 'andar-cucina')
    const primeira = decidirMusica(null, contexto({ roomType: 'chefe', bossState: 'vitoria' }))
    assert.equal(primeira.faixa, 'andar-cucina')
  })

  test('troca de andar depois do tambor: vale a faixa do andar novo, não a do chefe', () => {
    const decisao = decidirMusica(contexto({ roomType: 'chefe' }), contexto({ floorNumber: 3, roomType: 'chefe', floorChange: true }))
    assert.equal(decisao.faixa, 'andar-piazza')
    assert.equal(decisao.saidaMs, FADES.saidaDoAndar)
  })

  test('palco: pegar a Batuta troca para o show no tempo; vencer a última onda toca o final e volta aos bastidores', () => {
    const entrou = decidirMusica(contexto({ roomType: 'palco', palco: 'espera' }), contexto({ roomType: 'palco', palco: 'show' }))
    assert.equal(entrou.faixa, 'palco-show')
    assert.equal(entrou.quantizar, 'tempo')
    const venceu = decidirMusica(contexto({ roomType: 'palco', palco: 'show' }), contexto({ roomType: 'palco', palco: 'depois' }))
    assert.equal(venceu.faixa, 'palco-fim')
    assert.equal(venceu.depois, 'palco')
    assert.equal(venceu.quantizar, 'tempo')
    // Voltar para a sala depois: bastidores, sem o final
    assert.equal(decidirMusica(contexto(), contexto({ roomType: 'palco', palco: 'depois' })).faixa, 'palco')
  })

  test('as faixas do chefe, as fases seguintes e a vitória ficam prontas na sala do chefe; nos andares, o chefe do andar', () => {
    assert.deepEqual(faixasParaPreparar(contexto({ floorNumber: 3, roomType: 'chefe' }), 'chefe'), ['chefe', 'andar-piazza', 'andar-pastificio', 'chefe-fase2', 'chefe-vitoria'])
    assert.deepEqual(faixasParaPreparar(contexto({ floorNumber: 5, roomType: 'palco', palco: 'espera' }), 'palco'), ['palco', 'andar-porto', 'palco-show', 'palco-fim'])
    assert.ok(faixasParaPreparar(contexto({ floorNumber: 5 }), 'andar-porto').includes('chefe-final'))
  })
})

// --------------------------------------------------
// A mesa com o áudio de mentira
// --------------------------------------------------

function montarMesa({ prontas, duracoes = {}, intros = { chefe: 6.857 } } = {}) {
  const todas = prontas ?? ['andar-cucina', 'andar-piazza', 'chefe', 'chefe-fase2', 'chefe-vitoria', 'palco', 'palco-show', 'palco-fim', 'chefe-final-vitoria']
  const cache = criarCacheFalso(new Set(todas), { duracoes: { 'chefe-vitoria': 10.3, 'palco-fim': 9.5, ...duracoes }, intros: { 'palco-show': 6.3, 'chefe-fase2': 3.158, ...intros } })
  const mesa = criarMesaDoJogo({ cache })
  const audio = criarContextoFalso()
  const fonte = mesa.criarFonte(audio)
  fonte.connect(criarNo())
  fonte.start()
  return { mesa, audio }
}
const ativas = (mesa) => mesa.estado().vozes.filter((voz) => !voz.saindo).map((voz) => voz.id)
const COMPASSO_DO_CHEFE = (4 * 60) / 140

describe('mesa: sala do chefe e palco', () => {
  test('entrar no chefe: a introdução toca uma vez e o corpo entra em loop no fim dela, sempre do começo', () => {
    const { mesa, audio } = montarMesa()
    mesa.definirContexto(contexto())
    audio.currentTime = 10
    mesa.definirContexto(contexto({ roomType: 'chefe' }))
    assert.deepEqual(ativas(mesa), ['chefe'])
    const [corpo, intro] = audio.fontes.slice(-2) // a mesa cria o corpo e depois a introdução
    assert.equal(intro.loop, false)
    assert.equal(corpo.loop, true)
    assert.ok(Math.abs(intro.inicio.quando - 10.05) < 1e-9)
    assert.ok(Math.abs(corpo.inicio.quando - (10.05 + 6.857)) < 1e-9)
    assert.equal(corpo.inicio.offset, 0)
  })

  test('sair do chefe e voltar: a faixa do chefe recomeça pela introdução; a do andar volta de onde parou', () => {
    const { mesa, audio } = montarMesa()
    mesa.definirContexto(contexto())
    audio.currentTime = 20
    mesa.definirContexto(contexto({ roomType: 'chefe' }))
    audio.currentTime = 40
    mesa.definirContexto(contexto())
    assert.deepEqual(ativas(mesa), ['andar-cucina'])
    assert.ok(mesa.estado().posicoes['andar-cucina'] > 0)
    assert.equal(mesa.estado().posicoes.chefe, undefined, 'a faixa do chefe não guarda posição')
    audio.currentTime = 60
    mesa.definirContexto(contexto({ roomType: 'chefe' }))
    const [corpo, intro] = audio.fontes.slice(-2)
    assert.equal(intro.loop, false)
    assert.equal(corpo.inicio.offset, 0)
  })

  test('a fase 2 espera o fim do compasso: o chefe sai e o novo entra com a transição no tempo forte', () => {
    const { mesa, audio } = montarMesa()
    mesa.definirContexto(contexto({ roomType: 'chefe' }))
    const chefe = audio.fontes.at(-2) // o corpo da fase 1 (a introdução é a última)
    // O chefe começou em 0,05 s (a introdução); aos 10 s já passaram 9,95 s
    audio.currentTime = 10
    const atraso = COMPASSO_DO_CHEFE - ((10 - 0.05) % COMPASSO_DO_CHEFE)
    mesa.definirContexto(contexto({ roomType: 'chefe', bossPhase: 2 }))
    assert.deepEqual(ativas(mesa), ['chefe-fase2'])
    const [, transicao] = audio.fontes.slice(-2)
    assert.ok(Math.abs(transicao.inicio.quando - (10 + 0.05 + atraso)) < 1e-6, `começa em ${transicao.inicio.quando}`)
    // O chefe da fase 1 só começa a sumir quando a fase nova entra (fade de 300 ms)
    assert.ok(Math.abs(chefe.parada - (10 + atraso + FADES.faseSaida / 1000 + 0.05)) < 1e-6, `parou em ${chefe.parada}`)
  })

  test('a vitória toca uma vez, não repete com o contexto repetido e depois a faixa do andar volta em 2,5 s', () => {
    const { mesa, audio } = montarMesa()
    mesa.definirContexto(contexto({ roomType: 'chefe' }))
    audio.currentTime = 30
    mesa.definirContexto(contexto({ roomType: 'chefe', bossState: 'vitoria' }))
    assert.deepEqual(ativas(mesa), ['chefe-vitoria'])
    const vitoria = audio.fontes.at(-1)
    assert.equal(vitoria.loop, false, 'o final toca uma vez só')
    const criadas = audio.fontes.length

    // O contexto muda de novo (pausa) e o final continua: nada recomeça
    mesa.definirContexto(contexto({ roomType: 'chefe', bossState: 'vitoria', paused: true }))
    mesa.definirContexto(contexto({ roomType: 'chefe', bossState: 'vitoria', paused: false }))
    assert.equal(audio.fontes.length, criadas)
    assert.deepEqual(ativas(mesa), ['chefe-vitoria'])

    // O final acaba: a faixa do andar volta com fade longo
    audio.currentTime = 41
    vitoria.onended()
    assert.deepEqual(ativas(mesa), ['andar-cucina'])
    const volta = audio.fontes.at(-1)
    assert.equal(volta.loop, true)
    assert.equal(audio.fontes.length, criadas + 1)
  })

  test('palco: show quando a Batuta sai do pedestal; final do espetáculo e bastidores quando a luta acaba', () => {
    const { mesa, audio } = montarMesa()
    mesa.definirContexto(contexto())
    audio.currentTime = 5
    mesa.definirContexto(contexto({ roomType: 'palco', palco: 'espera' }))
    assert.deepEqual(ativas(mesa), ['palco'])

    audio.currentTime = 20
    mesa.definirContexto(contexto({ roomType: 'palco', palco: 'show' }))
    assert.deepEqual(ativas(mesa), ['palco-show'])
    assert.equal(audio.fontes.at(-1).loop, false, 'a abertura toca uma vez antes do show')

    audio.currentTime = 80
    mesa.definirContexto(contexto({ roomType: 'palco', palco: 'depois' }))
    assert.deepEqual(ativas(mesa), ['palco-fim'])
    const fim = audio.fontes.at(-1)
    assert.equal(fim.loop, false)
    audio.currentTime = 90
    fim.onended()
    assert.deepEqual(ativas(mesa), ['palco'])
  })

  test('trocar de sala no meio do final: o final sai e a faixa nova entra', () => {
    const { mesa, audio } = montarMesa()
    mesa.definirContexto(contexto({ roomType: 'palco', palco: 'show' }))
    audio.currentTime = 60
    mesa.definirContexto(contexto({ roomType: 'palco', palco: 'depois' }))
    assert.deepEqual(ativas(mesa), ['palco-fim'])
    audio.currentTime = 62
    mesa.definirContexto(contexto())
    assert.deepEqual(ativas(mesa), ['andar-cucina'])
  })

  test('troca de andar na sala do chefe: some em 450 ms e o andar seguinte entra', () => {
    const { mesa, audio } = montarMesa()
    mesa.definirContexto(contexto({ floorNumber: 2, roomType: 'chefe' }))
    const chefe = audio.fontes.at(-1)
    audio.currentTime = 50
    mesa.definirContexto(contexto({ floorNumber: 3, roomType: 'chefe', floorChange: true }))
    assert.deepEqual(ativas(mesa), ['andar-piazza'])
    assert.ok(Math.abs(chefe.parada - (50 + 0.45 + 0.05)) < 1e-9)
  })
})
