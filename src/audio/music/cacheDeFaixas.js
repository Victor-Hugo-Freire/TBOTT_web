// Cache das faixas preparadas: no máximo 3 de cada vez (uma faixa de 65 s em estéreo ocupa ~23 MB).
//
// - preparar(id) gera a faixa num worker (uma de cada vez, para não disputar a CPU com o jogo).
//   { urgente: true } passa a faixa para a frente da fila (a que vai tocar agora).
// - Passando do limite, sai a faixa usada há mais tempo.
// - Assim que a faixa fica pronta, o AudioBuffer é montado em pedaços pequenos nos momentos ociosos
//   do navegador (copiar 23 MB de uma vez travaria um quadro do jogo). obterBuffer(id, context) usa
//   esse AudioBuffer; se ele ainda não estiver montado, monta na hora. Depois de montado, os
//   Float32Array são soltos (a memória não fica em dobro).

import { ZZFX_EXPERIMENTAL_SAMPLE_RATE } from '../zzfxExperimental.js'
import { prepararCanaisDaMusica } from '../masterizacao.js'

export const LIMITE_DO_CACHE = 3

function canaisValidos(canais) {
  return Array.isArray(canais)
    && canais.length === 2
    && canais.every((canal) => canal instanceof Float32Array && canal.length > 0)
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
    return import('./musicas.js').then(({ obterMusica }) => prepararCanaisDaMusica(obterMusica(id), sampleRate))
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
      resolve(data.channels)
    }

    worker.onerror = () => {
      worker.terminate()
      reject(new Error('Falha ao iniciar a preparação da trilha.'))
    }

    worker.postMessage({ id, sampleRate })
  })
}

export function criarCacheDeFaixas({
  renderizar = renderizarNoWorker,
  montarBuffer = montarBufferAosPoucos,
  limite = LIMITE_DO_CACHE,
  sampleRate = ZZFX_EXPERIMENTAL_SAMPLE_RATE,
} = {}) {
  const entradas = new Map() // id → { canais, buffer, promessa, tarefa, usadoEm }
  const fila = []
  let ocupado = false
  let relogio = 0

  const usar = (entrada) => {
    relogio += 1
    entrada.usadoEm = relogio
  }

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

  // Monta o AudioBuffer em segundo plano; quem pedir antes de terminar monta na hora (obterBuffer)
  function montarDepois(id, entrada) {
    const canais = entrada.canais
    void Promise.resolve(montarBuffer(canais, sampleRate)).then((buffer) => {
      if (!buffer || entradas.get(id) !== entrada || entrada.buffer || entrada.canais !== canais) return
      entrada.buffer = buffer
      entrada.canais = null
    }, () => {})
  }

  function preparar(id, { urgente = false } = {}) {
    let entrada = entradas.get(id)

    if (!entrada) {
      entrada = { canais: null, buffer: null, promessa: null, tarefa: null, usadoEm: 0 }
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
              .then((canais) => {
                if (entradas.get(id) !== atual) return resolve(false)
                if (!atual.canais && !atual.buffer) {
                  if (!canaisValidos(canais)) throw new Error('A preparação da trilha não produziu canais válidos.')
                  atual.canais = canais
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
    return entrada.canais || entrada.buffer ? Promise.resolve(true) : entrada.promessa
  }

  function estaPronta(id) {
    const entrada = entradas.get(id)
    return Boolean(entrada && (entrada.canais || entrada.buffer))
  }

  // Guarda canais já gerados (ex.: a "A Vila Espera" gerada na hora, sem worker)
  function guardar(id, canais) {
    if (!canaisValidos(canais)) throw new TypeError('Canais inválidos para o cache da trilha.')
    let entrada = entradas.get(id)
    if (!entrada) {
      entrada = { canais: null, buffer: null, promessa: null, tarefa: null, usadoEm: 0 }
      entrada.promessa = Promise.resolve(true)
      entradas.set(id, entrada)
    }
    entrada.canais = canais
    entrada.buffer = null
    usar(entrada)
    liberarExcesso(id)
  }

  function obterBuffer(id, context) {
    const entrada = entradas.get(id)
    if (!entrada) return null
    usar(entrada)
    if (entrada.buffer) return entrada.buffer
    if (!entrada.canais) return null

    const [esquerdo, direito] = entrada.canais
    const buffer = context.createBuffer(2, esquerdo.length, sampleRate)
    buffer.getChannelData(0).set(esquerdo)
    buffer.getChannelData(1).set(direito)
    entrada.buffer = buffer
    entrada.canais = null
    return buffer
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
    liberar,
    ids: () => [...entradas.keys()],
    get tamanho() {
      return entradas.size
    },
  }
}

// O cache usado pelo jogo e pelo menu (uma instância só)
export const CACHE_DAS_FAIXAS = criarCacheDeFaixas()
