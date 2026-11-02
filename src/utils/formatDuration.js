// Converte milissegundos em mm:ss (ex.: 650000 -> "10:50"). Minutos não têm limite: 75:03.
export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// Tempo de partida no formato do contador da sala: HH:MM:SS.cc (ex.: 12430 -> "00:00:12.43")
export function formatRunTime(ms) {
  const centiseconds = Math.floor(Math.max(0, ms) / 10)
  const pad = (value) => String(value).padStart(2, '0')
  const totalSeconds = Math.floor(centiseconds / 100)
  return `${pad(Math.floor(totalSeconds / 3600))}:${pad(Math.floor(totalSeconds / 60) % 60)}:${pad(totalSeconds % 60)}.${pad(centiseconds % 100)}`
}
