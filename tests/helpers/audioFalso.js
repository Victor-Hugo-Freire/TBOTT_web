// AudioContext de mentira, que registra o que a mesa de som pede (usado pelos testes da mesa do jogo)

export function criarParametro(valor) {
  return {
    value: valor,
    eventos: [],
    setValueAtTime(v, t) { this.eventos.push(['set', v, t]) },
    linearRampToValueAtTime(v, t) { this.eventos.push(['rampa', v, t]) },
    cancelScheduledValues(t) { this.eventos.push(['cancelar', t]) },
    setTargetAtTime(v, t, c) { this.eventos.push(['alvo', v, t, c]); this.alvo = v },
  }
}

export function criarNo(extra = {}) {
  return { ligacoes: [], connect(destino) { this.ligacoes.push(destino) }, disconnect() { this.ligacoes = [] }, ...extra }
}

export function criarContextoFalso() {
  const fontes = []
  const contexto = {
    currentTime: 0,
    sampleRate: 44100,
    fontes,
    createGain: () => criarNo({ gain: criarParametro(1) }),
    createBiquadFilter: () => criarNo({ type: 'lowpass', frequency: criarParametro(350) }),
    createConvolver: () => criarNo({ buffer: null, normalize: true }),
    createBuffer(canais, length, sampleRate) {
      const dados = []
      return {
        length,
        sampleRate,
        duration: length / sampleRate,
        numberOfChannels: canais,
        getChannelData(indice) {
          dados[indice] ??= new Float32Array(length)
          return dados[indice]
        },
      }
    },
    createBufferSource() {
      const fonte = criarNo({
        buffer: null,
        loop: false,
        inicio: null,
        parada: null,
        onended: null,
        start(quando, offset) { this.inicio = { quando, offset } },
        stop(quando) { this.parada = quando ?? contexto.currentTime },
      })
      fontes.push(fonte)
      return fonte
    },
  }
  return contexto
}

// Cache de mentira: `prontas` = ids com buffer de duração `duracoes[id]` (60 s por padrão);
// `intros` = ids com introdução { duracao } em segundos
export function criarCacheFalso(prontas, { duracoes = {}, intros = {} } = {}) {
  return {
    prontas,
    pedidos: [],
    preparar(id, opcoes = {}) {
      this.pedidos.push({ id, urgente: Boolean(opcoes.urgente) })
      return Promise.resolve(this.prontas.has(id))
    },
    obterBuffer(id) {
      const duration = duracoes[id] ?? 60
      return this.prontas.has(id) ? { duration, length: duration * 44100, sampleRate: 44100 } : null
    },
    obterIntro(id) {
      return intros[id] ? { buffer: { duration: intros[id], length: intros[id] * 44100, sampleRate: 44100 }, duracao: intros[id] } : null
    },
  }
}
