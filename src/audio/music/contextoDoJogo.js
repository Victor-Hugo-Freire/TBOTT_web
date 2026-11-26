// Contexto musical do jogo: o que a música precisa saber da run, lido do estado do jogo sem mudar nada.
//
// A tela do jogo (SalaInicial.jsx) calcula o contexto a cada quadro com getGameMusicContext, compara
// com o anterior (isSameGameMusicContext) e só chama notifyGameMusic quando ele muda. O controlador
// de música (useMusicaDoJogo) ouve esses avisos com subscribeGameMusic.
//
// Estados usados, do jeito que o jogo já guarda:
// - run.floor.number e a sala atual (getCurrentRoom); na transição de sala, a sala de destino
//   (run.transition.toRoomId), para a música trocar junto com a câmera
// - run.transition.type === 'floor': a troca de andar depois do 3º golpe no tambor. Até a tela
//   escurecer (switched false) o andar novo ainda não existe; o contexto já aponta para ele.
// - run.death (morte), run.finished (fim da run) e run.seed (o R recomeça com outra seed)
// - a pausa vem da tela (isPaused: menu de pausa ou janela sem foco)
// - Chefe (issue #47): o chefe é o alvo `boss: true` de run.targets (os clones do Cappuccino não têm essa marca) e
//   a fase dele é `phase` (1 a 3). A vitória é a sala do chefe ficar limpa (room.cleared). Sem chefe no andar (sem
//   catálogo), a sala já nasce limpa. bossPhase e bossState ('luta' ou 'vitoria') mudam a faixa.
// - Palco: run.stage (a luta das ondas) e room.emptied (a Batuta já saiu do pedestal) dizem em que ponto
//   está: 'espera' (a Batuta no pedestal), 'show' (as ondas lutando) e 'depois' (luta vencida).

import { getCurrentRoom } from '../../utils/run.js'

function getStageState(run, room) {
  if (run.stage && !run.stage.won) return 'show'
  return room.emptied?.length > 0 ? 'depois' : 'espera'
}

// Roda a cada quadro dentro do laço do jogo: nunca lança erro (devolve null se a run vier estranha)
export function getGameMusicContext(run, paused = false) {
  try {
    if (!run?.floor) return null

    const transition = run.transition
    const floorChange = transition?.type === 'floor'
    const room = transition?.type === 'room'
      ? run.floor.rooms?.find((item) => item.id === transition.toRoomId)
      : getCurrentRoom(run)
    const boss = run.targets?.find((target) => target.boss)

    return {
      seed: run.seed ?? null,
      floorNumber: floorChange && !transition.switched ? run.floor.number + 1 : run.floor.number,
      roomType: room?.type ?? 'comum',
      floorChange,
      bossPhase: Number.isInteger(boss?.phase) && boss.phase > 1 ? boss.phase : 1,
      bossState: room?.type === 'chefe' && room.cleared ? 'vitoria' : 'luta',
      palco: room?.type === 'palco' ? getStageState(run, room) : null,
      paused: Boolean(paused),
      dead: Boolean(run.death),
      finished: Boolean(run.finished),
    }
  } catch {
    return null
  }
}

const CAMPOS = ['seed', 'floorNumber', 'roomType', 'floorChange', 'bossPhase', 'bossState', 'palco', 'paused', 'dead', 'finished']

export function isSameGameMusicContext(previous, next) {
  if (previous === next) return true
  if (!previous || !next) return false
  return CAMPOS.every((campo) => previous[campo] === next[campo])
}

// --------------------------------------------------
// Canal entre a tela do jogo e o controlador de música
// --------------------------------------------------

let ultimo = null
const ouvintes = new Set()

// Nunca lança erro: um problema na música não pode parar o laço do jogo
export function notifyGameMusic(context) {
  ultimo = context ?? null
  for (const ouvinte of [...ouvintes]) {
    try {
      ouvinte(ultimo)
    } catch (error) {
      console.warn('Falha ao atualizar a música do jogo.', error)
    }
  }
}

// O ouvinte recebe na hora o último contexto (se houver) e depois cada mudança
export function subscribeGameMusic(ouvinte) {
  ouvintes.add(ouvinte)
  if (ultimo) {
    try {
      ouvinte(ultimo)
    } catch (error) {
      console.warn('Falha ao atualizar a música do jogo.', error)
    }
  }
  return () => {
    ouvintes.delete(ouvinte)
  }
}

// Ao sair de /jogo: o próximo jogo não começa com o contexto velho
export function clearGameMusicContext() {
  ultimo = null
}

export function getLastGameMusicContext() {
  return ultimo
}
