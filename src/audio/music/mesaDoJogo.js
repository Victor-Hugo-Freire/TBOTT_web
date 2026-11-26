// Mesa de som do jogo: a música de /jogo inteira passa por aqui.
//
// O AudioManager toca uma música por vez (com o volume das Opções e a cadeia do master). Para ele,
// a música do jogo é uma fonte só (MUSICA_DO_JOGO), criada por criarFonte(context). Dentro dela, a
// mesa troca as faixas conforme o contexto da run:
//
//   Momento do jogo                     Música
//   entrar na run (ou recomeçar com R)  a faixa do andar sobe em 1,5 s (no R, do começo)
//   sala comum → sala comum             continua sem reiniciar
//   sala com faixa própria              crossfade de 1,5 s; ao sair, a faixa do andar volta do ponto
//                                       onde parou
//   troca de andar (3º golpe no tambor) a faixa atual some em 450 ms, junto com a tela escurecendo,
//                                       e a do próximo andar sobe em 1,5 s
//   morte ou fim da run                 fade para silêncio (1,5 s)
//   pausa                               abafada (passa-baixa e -6 dB) em vez de parar
//   sala do chefe / palco               a faixa da sala entra desde o começo, com a introdução (faixas.js:
//                                       doComeco); a faixa do andar volta de onde parou ao sair
//   fase do chefe, Batuta do palco      a troca espera o fim do compasso (ou do tempo) da faixa que toca e a
//                                       nova entra com a transição dela
//   vitória, fim do palco               o final toca uma vez (unica) e a faixa indicada volta em 2,5 s
//
// A mesa toca ~3 dB abaixo do menu (NIVEL_DO_JOGO); o volume de música das Opções vem depois, no
// AudioManager. A música nunca segura o jogo: faixa que ainda não está pronta é pedida ao cache, a
// atual continua (ou o jogo segue em silêncio) e a nova entra com fade quando ficar pronta.

import { CADEIA_DO_MASTER, criarRespostaDeSala } from '../masterizacao.js'
import { FAIXAS, FAIXAS_COMPOSTAS, ganhoDoNivel } from './faixas.js'
import { ROUTES } from '../../routes/paths.js'
import { FAIXA_DO_MENU, FASES_DO_CHEFE, getBossTrack, getFloorTrack, getTrackForContext, VITORIA_DO_CHEFE } from './trackSelection.js'
import { LAST_FLOOR } from '../../utils/floorGenerator.js'

export const MUSICA_DO_JOGO = 'musica-do-jogo'

// ~3 dB abaixo do menu
export const NIVEL_DO_JOGO = 10 ** (-3 / 20)

// Duração dos fades, em milissegundos
export const FADES = Object.freeze({
  entradaDaRun: 1500,
  sala: 1500,
  saidaDoAndar: 450, // a metade escura da transição de andar (FLOOR_TRANSITION_MS / 2)
  entradaDoAndar: 1500,
  silencio: 1500,
  recomeco: 300,
  saidaDoJogo: 800,
  faseEntrada: 40, // a transição da fase nova traz o impacto: entra quase sem fade
  faseSaida: 300,
  depoisDoFinal: 2500, // a faixa que volta depois de um final (vitória, fim do palco)
})

// Pausa: passa-baixa em 700 Hz e -6 dB
export const ABAFADO = Object.freeze({ frequencia: 700, ganho: 0.5 })
const LIVRE = Object.freeze({ frequencia: 20000, ganho: 1 })

// Cada faixa começa um pouco no futuro: assim o ponto de início (e a retomada) é exato
const ANTECEDENCIA = 0.05

// A fonte da música do jogo deve começar agora? Em /jogo, com o áudio destravado. Antes do primeiro
// gesto depois de abrir a página ('idle'), o navegador não deixa tocar: o AudioProvider destrava no
// primeiro gesto e a música entra sozinha. Nunca pede o destravamento sem gesto (no Chrome, o resume
// sem gesto fica pendente e travaria o destravamento seguinte).
export function shouldStartGameMusic({ pathname, audioState, activeMusicName }) {
  return pathname === ROUTES.novaPartida && audioState === 'ready' && activeMusicName !== MUSICA_DO_JOGO
}

// O que a música deve fazer quando o contexto muda (função pura)
// Devolve { faixa, entradaMs, saidaMs, reiniciar, abafada, depois, quantizar }:
// - depois: a faixa que volta quando um final (faixa unica) acaba
// - quantizar: 'tempo' ou 'compasso' = a troca espera o fim do tempo/compasso da faixa que toca
export function decidirMusica(anterior, atual, compostas = FAIXAS_COMPOSTAS) {
  if (!atual) return { faixa: null, entradaMs: 0, saidaMs: FADES.saidaDoJogo, reiniciar: false, abafada: false, depois: null, quantizar: null }

  const reiniciar = Boolean(anterior) && anterior.seed !== atual.seed
  const silencio = atual.dead || atual.finished
  // Na troca de andar a sala do chefe já é passado: vale a faixa do andar que vem
  const sala = atual.floorChange ? 'comum' : atual.roomType
  let faixa = silencio
    ? null
    : getTrackForContext({ floorNumber: atual.floorNumber, roomType: sala, bossPhase: atual.bossPhase, bossState: atual.bossState, palco: atual.palco }, compostas)
  const mesmaSala = Boolean(anterior) && !reiniciar && !atual.floorChange
    && anterior.roomType === atual.roomType && anterior.floorNumber === atual.floorNumber

  let depois = null
  let quantizar = null
  if (faixa) {
    const fimDoShow = sala === 'palco' && mesmaSala && anterior.palco === 'show' && atual.palco === 'depois' && compostas.includes('palco-fim')
    if (fimDoShow) {
      // A última onda caiu: o final do espetáculo toca uma vez e os bastidores voltam
      depois = faixa
      faixa = 'palco-fim'
      quantizar = 'tempo'
    } else if (FAIXAS[faixa]?.unica) {
      // A vitória sobre o chefe: só toca na hora em que o chefe cai (quem entra na sala já vencida ouve o andar)
      depois = getFloorTrack(atual.floorNumber, compostas)
      if (mesmaSala && anterior.bossState !== atual.bossState) quantizar = 'tempo'
      else faixa = depois
    } else if (mesmaSala && FAIXAS[faixa]?.doComeco && (anterior.bossPhase !== atual.bossPhase || anterior.palco !== atual.palco)) {
      quantizar = sala === 'palco' ? 'tempo' : 'compasso'
    }
  }

  let entradaMs = FADES.sala
  let saidaMs = FADES.sala
  if (!anterior || reiniciar) {
    entradaMs = FADES.entradaDaRun
    saidaMs = FADES.recomeco
  } else if (atual.floorChange && atual.floorNumber !== anterior.floorNumber) {
    entradaMs = FADES.entradaDoAndar
    saidaMs = FADES.saidaDoAndar
  } else if (silencio || faixa === null) {
    saidaMs = FADES.silencio
  } else if (quantizar) {
    entradaMs = FADES.faseEntrada
    saidaMs = FADES.faseSaida
  }

  return { faixa, entradaMs, saidaMs, reiniciar, abafada: Boolean(atual.paused), depois, quantizar }
}

// Faixas que vale a pena ter prontas: a que toca, a do andar (para voltar das salas especiais) e a do
// próximo andar. Nos andares, também o chefe (ele é beco: a faixa já está pronta quando o jogador chega);
// na sala do chefe, as fases seguintes e a vitória; no palco, o show e o final. Quando a run acaba (morte
// ou fim), a "A Vila Espera": o cache a libera durante a run, e assim ela já está pronta quando o jogador
// volta ao menu.
export function faixasParaPreparar(contexto, alvo, compostas = FAIXAS_COMPOSTAS) {
  if (!contexto) return []
  if (contexto.dead || contexto.finished) return [FAIXA_DO_MENU]
  const ids = [alvo, getFloorTrack(contexto.floorNumber, compostas), getFloorTrack(contexto.floorNumber + 1, compostas)]
  if (contexto.floorNumber >= 1 && contexto.floorNumber <= LAST_FLOOR && !contexto.floorChange) {
    const familia = contexto.floorNumber === LAST_FLOOR ? 'final' : 'comum'
    if (contexto.roomType === 'chefe') {
      ids.push(...FASES_DO_CHEFE[familia], VITORIA_DO_CHEFE[familia])
    } else if (contexto.roomType === 'palco') {
      ids.push('palco', 'palco-show', 'palco-fim')
    } else {
      ids.push(getBossTrack(contexto.floorNumber))
    }
  }
  return [...new Set(ids.filter((id) => id && compostas.includes(id)))]
}

function ajustar(parametro, valor, agora, constante) {
  if (!parametro) return
  if (typeof parametro.setTargetAtTime === 'function') {
    parametro.cancelScheduledValues?.(agora)
    parametro.setTargetAtTime(valor, agora, constante)
  } else {
    parametro.value = valor
  }
}

function desligar(no) {
  try { no?.disconnect() } catch { /* já desligado */ }
}

export function criarMesaDoJogo({
  cache,
  compostas = FAIXAS_COMPOSTAS,
  reverbDe = (id) => FAIXAS[id]?.reverb ?? CADEIA_DO_MASTER.reverbPadrao,
  nivelDe = ganhoDoNivel,
} = {}) {
  let anterior = null
  let alvo = null
  let depoisDoAlvo = null // quando o alvo é um final (unica): a faixa que volta depois dele
  let quantizar = null // 'tempo' ou 'compasso': a próxima troca espera o fim do tempo/compasso da faixa que toca
  const unicasTocadas = new Set() // finais já tocados nesta sala (o contexto repete o estado, o final não)
  let fades = { entradaMs: FADES.entradaDaRun, saidaMs: FADES.recomeco }
  let abafada = false
  let forcarEntrada = false
  // Muda a cada recomeço: as vozes da run anterior não guardam posição
  let geracao = 0
  const posicoes = new Map() // id → segundos: onde a faixa parou (para voltar dali)
  const vozes = [] // { id, fonte, ganho, envio, inicio, offset, duracao, saindo, geracao }
  const esperando = new Set()
  let grafo = null
  let fachadaAtual = null
  let iniciada = false

  function montarGrafo(context) {
    if (grafo?.context === context) return grafo
    // Contexto novo: as vozes do antigo não servem mais
    vozes.length = 0

    const sampleRate = context.sampleRate || 44100
    const saida = context.createGain()
    saida.gain.value = NIVEL_DO_JOGO
    const ganhoAbafado = context.createGain()
    ganhoAbafado.gain.value = abafada ? ABAFADO.ganho : LIVRE.ganho
    const barramento = context.createGain()

    let filtro = null
    if (typeof context.createBiquadFilter === 'function') {
      filtro = context.createBiquadFilter()
      filtro.type = 'lowpass'
      filtro.frequency.value = abafada ? ABAFADO.frequencia : LIVRE.frequencia
      barramento.connect(filtro)
      filtro.connect(ganhoAbafado)
    } else {
      barramento.connect(ganhoAbafado)
    }
    ganhoAbafado.connect(saida)

    // Sala própria da mesa: cada faixa manda para ela o quanto está em faixas.js
    let reverb = null
    if (typeof context.createConvolver === 'function' && typeof context.createBuffer === 'function') {
      try {
        const resposta = criarRespostaDeSala(sampleRate)
        const buffer = context.createBuffer(2, resposta[0].length, sampleRate)
        buffer.getChannelData(0).set(resposta[0])
        buffer.getChannelData(1).set(resposta[1])
        reverb = context.createConvolver()
        reverb.normalize = false
        reverb.buffer = buffer
        reverb.connect(barramento)
      } catch {
        reverb = null
      }
    }

    grafo = { context, saida, ganhoAbafado, filtro, barramento, reverb }
    return grafo
  }

  const posicaoEm = (voz, tempo) => (voz.offset + Math.max(0, tempo - voz.inicio)) % voz.duracao

  function soltarVoz(voz) {
    const indice = vozes.indexOf(voz)
    if (indice >= 0) vozes.splice(indice, 1)
    desligar(voz.fonte)
    desligar(voz.fonteIntro)
    desligar(voz.ganho)
    desligar(voz.envio)
  }

  // atraso: segundos até a faixa começar (a troca no fim do tempo ou do compasso)
  function entrar(id, buffer, ms, { atraso = 0, depois = null } = {}) {
    const { context } = grafo
    const inicio = context.currentTime + ANTECEDENCIA + atraso
    const duracao = buffer.duration || buffer.length / (buffer.sampleRate || context.sampleRate || 44100)
    const meta = FAIXAS[id] ?? {}
    // As faixas das salas começam sempre do começo, com a introdução; as dos andares voltam de onde pararam
    const offset = meta.doComeco ? 0 : (posicoes.get(id) ?? 0) % duracao
    const intro = meta.doComeco ? cache.obterIntro?.(id, context) ?? null : null
    const duracaoDaIntro = intro?.buffer && intro.duracao > 0 ? intro.duracao : 0

    const fonte = context.createBufferSource()
    fonte.buffer = buffer
    fonte.loop = !meta.unica
    const ganho = context.createGain()
    ganho.gain.value = 0
    ganho.gain.setValueAtTime(0, inicio)
    // Sobe até o nível da faixa (faixas.js), que iguala o volume percebido dos andares
    ganho.gain.linearRampToValueAtTime(nivelDe(id), inicio + Math.max(0, ms) / 1000)
    fonte.connect(ganho)
    ganho.connect(grafo.barramento)

    // A introdução toca uma vez e o corpo entra em loop no fim dela (num compasso inteiro)
    let fonteIntro = null
    if (duracaoDaIntro > 0) {
      fonteIntro = context.createBufferSource()
      fonteIntro.buffer = intro.buffer
      fonteIntro.connect(ganho)
    }

    let envio = null
    const mix = reverbDe(id)
    if (grafo.reverb && mix > 0) {
      envio = context.createGain()
      envio.gain.value = mix
      ganho.connect(envio)
      envio.connect(grafo.reverb)
    }

    const voz = { id, fonte, fonteIntro, ganho, envio, inicio, offset, duracao, saindo: false, geracao, unica: Boolean(meta.unica), depois }
    fonte.onended = () => {
      const terminou = !voz.saindo
      soltarVoz(voz)
      if (voz.unica && terminou && voz.geracao === geracao) terminouUnica(voz)
    }
    vozes.push(voz)
    if (fonteIntro) {
      fonteIntro.start(inicio)
      fonte.start(inicio + duracaoDaIntro, 0)
    } else {
      fonte.start(inicio, offset)
    }
    if (voz.unica) unicasTocadas.add(id)
  }

  function sair(voz, ms, atraso = 0) {
    const { context } = grafo
    const agora = context.currentTime
    const inicioDoFade = agora + Math.max(0, atraso)
    const fim = inicioDoFade + Math.max(0, ms) / 1000
    voz.saindo = true

    const parametro = voz.ganho.gain
    const valor = agora < voz.inicio ? 0 : parametro.value
    parametro.cancelScheduledValues(agora)
    parametro.setValueAtTime(valor, agora)
    if (atraso > 0) parametro.setValueAtTime(valor, inicioDoFade)
    parametro.linearRampToValueAtTime(0, fim)

    if (voz.geracao === geracao && !FAIXAS[voz.id]?.doComeco) posicoes.set(voz.id, posicaoEm(voz, fim))
    try { voz.fonte.stop(fim + 0.05) } catch { /* já parada */ }
    try { voz.fonteIntro?.stop(fim + 0.05) } catch { /* já parada */ }
  }

  function pararTodas() {
    for (const voz of [...vozes]) {
      try { voz.fonte.stop() } catch { /* já parada */ }
      try { voz.fonteIntro?.stop() } catch { /* já parada */ }
      soltarVoz(voz)
    }
  }

  function aplicarAbafamento(imediato = false) {
    if (!grafo) return
    const destino = abafada ? ABAFADO : LIVRE
    const agora = grafo.context.currentTime
    const constante = imediato ? 0.005 : 0.08
    ajustar(grafo.filtro?.frequency, destino.frequencia, agora, constante)
    ajustar(grafo.ganhoAbafado.gain, destino.ganho, agora, constante)
  }

  // Faixa ainda não pronta: pede ao cache e tenta de novo quando ela chegar
  function esperar(id) {
    if (esperando.has(id)) return
    esperando.add(id)
    cache.preparar(id, { urgente: true })
      .then(() => {
        esperando.delete(id)
        if (alvo === id) sincronizar()
      }, () => {
        esperando.delete(id)
      })
  }

  // Segundos até o fim do tempo (ou do compasso) da faixa que toca: a troca de fase cai no tempo forte
  function atrasoDaQuantizacao(atual) {
    const meta = atual && FAIXAS[atual.id]
    if (!quantizar || !meta?.andamento) return 0
    const tempo = 60 / meta.andamento
    const unidade = quantizar === 'compasso' ? tempo * (meta.temposPorCompasso ?? 4) : tempo
    const decorrido = grafo.context.currentTime - atual.inicio
    if (!(decorrido > 0)) return 0
    const resto = decorrido % unidade
    return resto < 0.005 ? 0 : unidade - resto
  }

  // Um final (faixa unica) acabou: volta a faixa que ele indicou, com um fade longo
  function terminouUnica(voz) {
    if (!grafo || !iniciada) return
    if (alvo === voz.id) alvo = voz.depois
    if (alvo !== voz.depois) return
    fades = { entradaMs: FADES.depoisDoFinal, saidaMs: 0 }
    quantizar = null
    sincronizar()
  }

  function sincronizar() {
    if (!grafo || !fachadaAtual || !iniciada) return
    const atual = vozes.find((voz) => !voz.saindo) ?? null

    if (!forcarEntrada && atual?.id === alvo) return
    // O final toca até o fim; quando acabar, o alvo (a faixa que volta) entra
    if (!forcarEntrada && atual?.unica && atual.depois && alvo === atual.depois) return
    if (alvo === null) {
      if (atual) sair(atual, fades.saidaMs)
      forcarEntrada = false
      return
    }

    const buffer = cache.obterBuffer(alvo, grafo.context)
    if (!buffer) {
      esperar(alvo)
      return
    }

    const atraso = forcarEntrada ? 0 : atrasoDaQuantizacao(atual)
    if (atual) sair(atual, fades.saidaMs, atraso)
    entrar(alvo, buffer, fades.entradaMs, { atraso, depois: depoisDoAlvo })
    forcarEntrada = false
    quantizar = null
  }

  return {
    // Fonte para o AudioManager (registerMusic). Comporta-se como um AudioBufferSourceNode:
    // connect, start, stop e onended.
    criarFonte(context) {
      const g = montarGrafo(context)
      desligar(g.saida)
      iniciada = false

      const fachada = {
        onended: null,
        connect(destino) {
          if (fachadaAtual === fachada) g.saida.connect(destino)
        },
        disconnect() {
          if (fachadaAtual === fachada) desligar(g.saida)
        },
        start() {
          if (fachadaAtual !== fachada) return
          iniciada = true
          aplicarAbafamento(true)
          sincronizar()
        },
        stop() {
          // Uma fonte antiga (ainda no fade de saída do AudioManager) não para a música nova
          if (fachadaAtual === fachada) {
            pararTodas()
            iniciada = false
            fachadaAtual = null
          }
          const aoTerminar = fachada.onended
          fachada.onended = null
          if (typeof aoTerminar === 'function') aoTerminar()
        },
      }

      fachadaAtual = fachada
      return fachada
    },

    // Chamado a cada mudança do contexto musical da run (contextoDoJogo.js)
    definirContexto(contexto) {
      const decisao = decidirMusica(anterior, contexto, compostas)
      const mudouDeSala = !anterior || !contexto || anterior.roomType !== contexto.roomType || anterior.floorNumber !== contexto.floorNumber
      anterior = contexto
      if (decisao.reiniciar) {
        geracao += 1
        posicoes.clear()
        forcarEntrada = true
      }
      if (mudouDeSala || decisao.reiniciar) unicasTocadas.clear()
      // O final já tocou nesta sala: o contexto continua dizendo "vitória", mas só a faixa que volta vale
      alvo = decisao.faixa && unicasTocadas.has(decisao.faixa) && decisao.depois ? decisao.depois : decisao.faixa
      depoisDoAlvo = decisao.depois
      quantizar = decisao.quantizar
      fades = { entradaMs: decisao.entradaMs, saidaMs: decisao.saidaMs }
      if (abafada !== decisao.abafada) {
        abafada = decisao.abafada
        aplicarAbafamento()
      }
      for (const id of faixasParaPreparar(contexto, alvo, compostas)) {
        void cache.preparar(id, { urgente: id === alvo }).catch(() => {})
      }
      sincronizar()
    },

    // Fora de /jogo: esquece a run (o próximo jogo começa do zero). As vozes param pelo fade do
    // AudioManager, que chama stop() no fim.
    limpar() {
      anterior = null
      alvo = null
      depoisDoAlvo = null
      quantizar = null
      unicasTocadas.clear()
      forcarEntrada = false
      geracao += 1
      posicoes.clear()
    },

    // Para testes e depuração
    estado() {
      return {
        alvo,
        abafada,
        vozes: vozes.map((voz) => ({ id: voz.id, saindo: voz.saindo, offset: voz.offset })),
        posicoes: Object.fromEntries(posicoes),
      }
    },
  }
}
