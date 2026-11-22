// A pausa só abre numa run ativa: não abre na transição de sala ou de andar, dormindo na rede, na morte nem no fim da run
export function canPauseRun(run) {
  return Boolean(run && !run.finished && !run.death && !run.transition && !run.sleep)
}
