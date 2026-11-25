// Fonte de áudio "introdução + loop": a introdução toca uma vez e o corpo entra em loop exatamente no
// fim dela (no início de um compasso). Para quem usa (AudioManager), é uma fonte só, como um
// AudioBufferSourceNode: connect, start, stop, onended e loop.
//
// São duas fontes de verdade, começando no mesmo instante com precisão de amostra: a da introdução
// (com a cauda inteira das notas, que soa por cima do começo do corpo) e a do corpo, com loop. Assim a
// introdução nunca se repete e a cauda dela nunca entra no loop.
//
// O começo do corpo já traz a cauda do fim dele (loop contínuo), então a primeira amostra não é zero.
// Na primeira entrada o corpo sobe de 0 a 1 em ENTRADA_DO_CORPO segundos, para não estalar; nas voltas
// seguintes do loop o ganho já está em 1.

export const ENTRADA_DO_CORPO = 0.008

export function criarFonteComIntro(context, corpo, intro = null) {
  const fonteDoCorpo = context.createBufferSource()
  fonteDoCorpo.buffer = corpo
  fonteDoCorpo.loop = true
  if (!intro?.buffer || !(intro.duracao > 0)) return fonteDoCorpo

  const fonteDaIntro = context.createBufferSource()
  fonteDaIntro.buffer = intro.buffer
  const saida = context.createGain()
  const entradaDoCorpo = context.createGain()
  fonteDaIntro.connect(saida)
  fonteDoCorpo.connect(entradaDoCorpo)
  entradaDoCorpo.connect(saida)

  let iniciou = false
  let parou = false

  const fonte = {
    buffer: corpo,
    loop: true,
    introDuracao: intro.duracao,
    onended: null,
    connect(destino) {
      saida.connect(destino)
    },
    disconnect() {
      try { saida.disconnect() } catch { /* já desligada */ }
    },
    start(quando = 0) {
      if (iniciou) return
      iniciou = true
      const inicio = Math.max(quando || 0, context.currentTime || 0)
      const inicioDoCorpo = inicio + intro.duracao
      const ganho = entradaDoCorpo.gain
      if (typeof ganho?.setValueAtTime === 'function' && typeof ganho.linearRampToValueAtTime === 'function') {
        ganho.value = 0
        ganho.setValueAtTime(0, inicioDoCorpo)
        ganho.linearRampToValueAtTime(1, inicioDoCorpo + ENTRADA_DO_CORPO)
      }
      fonteDaIntro.start(inicio)
      fonteDoCorpo.start(inicioDoCorpo)
    },
    stop(quando) {
      if (parou) return
      parou = true
      try { fonteDaIntro.stop(quando) } catch { /* já parada */ }
      try { fonteDoCorpo.stop(quando) } catch { /* já parada */ }
    },
  }

  fonteDoCorpo.onended = () => {
    try { saida.disconnect() } catch { /* já desligada */ }
    if (typeof fonte.onended === 'function') fonte.onended()
  }

  return fonte
}
