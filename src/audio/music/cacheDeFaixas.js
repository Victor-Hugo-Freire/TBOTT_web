// Cache das faixas preparadas: no máximo 5 de cada vez (uma faixa de 65 s em estéreo ocupa ~23 MB; os
// finais de vitória, de 10 s, ocupam ~4 MB). Na sala do chefe ficam prontos o chefe, as fases seguintes e a
// vitória, além da faixa do andar e a do próximo.
//
// - preparar(id) gera a faixa num worker (uma de cada vez, para não disputar a CPU com o jogo).
//   { urgente: true } passa a faixa para a frente da fila (a que vai tocar agora).
// - Passando do limite, sai a faixa usada há mais tempo.
// - Assim que a faixa fica pronta, os AudioBuffer (o corpo e a introdução, se houver) são montados
//   em pedaços pequenos nos momentos ociosos do navegador (copiar 23 MB de uma vez travaria um
//   quadro do jogo). obterBuffer e obterIntro usam esses AudioBuffer; se ainda não estiverem
//   montados, montam na hora. Depois de montados, os Float32Array são soltos (sem memória em dobro).

import { ZZFX_EXPERIMENTAL_SAMPLE_RATE } from '../zzfxExperimental.js'
import { prepararFaixa } from '../masterizacao.js'

export const LIMITE_DO_CACHE = 5

function canaisValidos(canais) {
  return Array.isArray(canais)
    && canais.length === 2
    && canais.every((canal) => canal instanceof Float32Array && canal.length > 0)
}

// Aceita o resultado da preparação ({ canais, intro, introAmostras }) ou só os canais do corpo
function normalizarFaixa(resultado) {
  const faixa = Array.isArray(resultado) ? { canais: resultado, intro: null, introAmostras: 0 } : resultado
  if (!canaisValidos(faixa?.canais)) return null
  const temIntro = canaisValidos(faixa.intro) && faixa.introAmostras > 0
  return {
    canais: faixa.canais,
    intro: temIntro ? faixa.intro : null,
    introAmostras: temIntro ? faixa.introAmostras : 0,
  }
}

// Quantas amostras copiar por vez ao montar o AudioBuffer (~1 ms de trabalho em cada pedaço)
const AMOSTRAS_POR_PEDACO = 1 << 18

const quandoOcioso = (tarefa) => {
  if (typeof globalThis.requestIdleCallback === 'function') globalThis.requestIdleCallback(tarefa, { timeout: 200 })
  else setTimeout(tarefa, 0)
}

// Monta um AudioBuffer (sem precisar de AudioContext) copiando os canais aos poucos.
// Sem suporte a new AudioBuffer (Node, navegador antigo), devolve null.
export function montarBufferAosPoucos(canais, sampleRate, { pedaco = AMOSTRAS_POR_PEDACO, agendar = quandoOcioso } = {}) {
  if (typeof globalThis.AudioBuffer !== 'function') return Promise.resolve(null)
  let buffer
  try {
    buffer = new globalThis.AudioBuffer({ length: canais[0].length, numberOfChannels: 2, sampleRate })
  } catch {
    return Promise.resolve(null)
  }
  if (typeof buffer.copyToChannel !== 'function') return Promise.resolve(null)

  return new Promise((resolve) => {
    let inicio = 0
    const copiar = () => {
      try {
        const fim = Math.min(canais[0].length, inicio + pedaco)
        buffer.copyToChannel(canais[0].subarray(inicio, fim), 0, inicio)
        buffer.copyToChannel(canais[1].subarray(inicio, fim), 1, inicio)
        inicio = fim
        if (inicio < canais[0].length) agendar(copiar)
        else resolve(buffer)
      } catch {
        resolve(null)
      }
    }
    agendar(copiar)
  })
}

// Gera a faixa num worker. Sem Worker (navegador antigo, Node), gera na própria thread.
export function renderizarNoWorker(id, sampleRate = ZZFX_EXPERIMENTAL_SAMPLE_RATE) {
  if (typeof Worker === 'undefined') {
    return import('./musicas.js').then(({ obterFaixa }) => prepararFaixa(obterFaixa(id), sampleRate))
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../../workers/musica.worker.js', import.meta.url), { type: 'module' })

    worker.onmessage = ({ data }) => {
      worker.terminate()
      if (data?.error) {
        reject(new Error(data.error))
        return
      }
      if (!canaisValidos(data?.channels)) {
        reject(new Error('A preparação da trilha não produziu canais válidos.'))
        return
      }
      resolve({ canais: data.channels, intro: data.intro ?? null, introAmostras: data.introSamples ?? 0 })
    }

    worker.onerror = () => {
      worker.terminate()
      reject(new Error('Falha ao iniciar a preparação da trilha.'))
    }

    worker.postMessage({ id, sampleRate })
  })
}

function criarEntrada() {
  return {
    canais: null, // corpo ainda em Float32Array
    buffer: null, // corpo já em AudioBuffer
    introCanais: null,
    introBuffer: null,
    introAmostras: 0,
    promessa: null,
    tarefa: null,
    usadoEm: 0,
  }
}

export function criarCacheDeFaixas({
  renderizar = renderizarNoWorker,
  montarBuffer = montarBufferAosPoucos,
  limite = LIMITE_DO_CACHE,
  sampleRate = ZZFX_EXPERIMENTAL_SAMPLE_RATE,
} = {}) {
  const entradas = new Map()
  const fila = []
  let ocupado = false
  let relogio = 0

  const usar = (entrada) => {
    relogio += 1
    entrada.usadoEm = relogio
  }

  const pronta = (entrada) => Boolean(entrada && (entrada.canais || entrada.buffer))

  function liberarExcesso(protegida) {
    while (entradas.size > limite) {
      let maisAntiga = null
      for (const [id, entrada] of entradas) {
        if (id === protegida) continue
        if (!maisAntiga || entrada.usadoEm < maisAntiga[1].usadoEm) maisAntiga = [id, entrada]
      }
      if (!maisAntiga) return
      liberar(maisAntiga[0])
    }
  }

  function processarFila() {
    if (ocupado) return
    const tarefa = fila.shift()
    if (!tarefa) return
    ocupado = true
    tarefa.executar().finally(() => {
      ocupado = false
      processarFila()
    })
  }

  function preencher(entrada, faixa) {
    entrada.canais = faixa.canais
    entrada.buffer = null
    entrada.introCanais = faixa.intro
    entrada.introBuffer = null
    entrada.introAmostras = faixa.introAmostras
  }

  // Monta os AudioBuffer em segundo plano; quem pedir antes de terminar monta na hora
  function montarDepois(id, entrada) {
    const canais = entrada.canais
    void Promise.resolve(montarBuffer(canais, sampleRate)).then((buffer) => {
      if (!buffer || entradas.get(id) !== entrada || entrada.buffer || entrada.canais !== canais) return
      entrada.buffer = buffer
      entrada.canais = null
    }, () => {})

    const introCanais = entrada.introCanais
    if (!introCanais) return
    void Promise.resolve(montarBuffer(introCanais, sampleRate)).then((buffer) => {
      if (!buffer || entradas.get(id) !== entrada || entrada.introBuffer || entrada.introCanais !== introCanais) return
      entrada.introBuffer = buffer
      entrada.introCanais = null
    }, () => {})
  }

  function preparar(id, { urgente = false } = {}) {
    let entrada = entradas.get(id)

    if (!entrada) {
      entrada = criarEntrada()
      entradas.set(id, entrada)
      const atual = entrada
      atual.promessa = new Promise((resolve) => {
        atual.tarefa = {
          executar() {
            atual.tarefa = null
            // Liberada enquanto esperava na fila: nem gera
            if (entradas.get(id) !== atual) {
              resolve(false)
              return Promise.resolve()
            }
            return Promise.resolve()
              .then(() => renderizar(id, sampleRate))
              .then((resultado) => {
                if (entradas.get(id) !== atual) return resolve(false)
                if (!pronta(atual)) {
                  const faixa = normalizarFaixa(resultado)
                  if (!faixa) throw new Error('A preparação da trilha não produziu canais válidos.')
                  preencher(atual, faixa)
                  montarDepois(id, atual)
                }
                resolve(true)
              })
              .catch((error) => {
                console.warn(`Não foi possível preparar a faixa "${id}".`, error)
                if (entradas.get(id) === atual) entradas.delete(id)
                resolve(false)
              })
          },
        }
        if (urgente) fila.unshift(atual.tarefa)
        else fila.push(atual.tarefa)
      })
      processarFila()
    } else if (urgente && entrada.tarefa) {
      // Ainda na fila: passa para a frente
      const indice = fila.indexOf(entrada.tarefa)
      if (indice > 0) {
        fila.splice(indice, 1)
        fila.unshift(entrada.tarefa)
      }
    }

    usar(entrada)
    liberarExcesso(id)
    return pronta(entrada) ? Promise.resolve(true) : entrada.promessa
  }

  function estaPronta(id) {
    return pronta(entradas.get(id))
  }

  // Guarda uma faixa já gerada (ex.: a "A Vila Espera" gerada na hora, sem worker).
  // Aceita { canais, intro, introAmostras } ou só os canais do corpo.
  function guardar(id, resultado) {
    const faixa = normalizarFaixa(resultado)
    if (!faixa) throw new TypeError('Canais inválidos para o cache da trilha.')
    let entrada = entradas.get(id)
    if (!entrada) {
      entrada = criarEntrada()
      entrada.promessa = Promise.resolve(true)
      entradas.set(id, entrada)
    }
    preencher(entrada, faixa)
    usar(entrada)
    liberarExcesso(id)
  }

  function montarAgora(canais, context) {
    const [esquerdo, direito] = canais
    const buffer = context.createBuffer(2, esquerdo.length, sampleRate)
    buffer.getChannelData(0).set(esquerdo)
    buffer.getChannelData(1).set(direito)
    return buffer
  }

  // AudioBuffer do corpo (a parte em loop)
  function obterBuffer(id, context) {
    const entrada = entradas.get(id)
    if (!entrada) return null
    usar(entrada)
    if (entrada.buffer) return entrada.buffer
    if (!entrada.canais) return null
    entrada.buffer = montarAgora(entrada.canais, context)
    entrada.canais = null
    return entrada.buffer
  }

  // Introdução da faixa: { buffer, duracao } (duracao = onde o corpo começa, em segundos), ou null
  function obterIntro(id, context) {
    const entrada = entradas.get(id)
    if (!entrada || !(entrada.introAmostras > 0)) return null
    if (!entrada.introBuffer && entrada.introCanais) {
      entrada.introBuffer = montarAgora(entrada.introCanais, context)
      entrada.introCanais = null
    }
    if (!entrada.introBuffer) return null
    return { buffer: entrada.introBuffer, duracao: entrada.introAmostras / sampleRate }
  }

  function liberar(id) {
    const entrada = entradas.get(id)
    if (!entrada) return
    entradas.delete(id)
    if (entrada.tarefa) {
      const indice = fila.indexOf(entrada.tarefa)
      if (indice >= 0) fila.splice(indice, 1)
      entrada.tarefa.executar()
    }
  }

  return {
    preparar,
    estaPronta,
    guardar,
    obterBuffer,
    obterIntro,
    liberar,
    ids: () => [...entradas.keys()],
    get tamanho() {
      return entradas.size
    },
  }
}

// O cache usado pelo jogo e pelo menu (uma instância só)
export const CACHE_DAS_FAIXAS = criarCacheDeFaixas()
