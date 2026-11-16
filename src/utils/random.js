// Sorteio com seed: a mesma seed gera sempre a mesma sequência de números.
// Assim o mesmo andar sai igual de novo (e o progresso só precisa guardar a seed).
// Usa contas de inteiros (mulberry32), que dão o mesmo resultado em qualquer navegador.

// Cria uma função random() que devolve números entre 0 (incluído) e 1 (excluído), como o Math.random.
export function createRandom(seed) {
  let state = seed >>> 0
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

// Número inteiro entre min e max, os dois incluídos
export function randomInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1))
}

// true com a chance pedida (0.5 = metade das vezes)
export function chance(random, probability) {
  return random() < probability
}

// Um item qualquer da lista
export function pick(random, list) {
  return list[Math.floor(random() * list.length)]
}

// Cópia da lista em ordem sorteada (a lista original não muda)
export function shuffle(random, list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Junta uma seed e um número (por exemplo, o andar) numa seed nova.
// Assim cada andar tem a sua seed, mas tudo sai de uma seed só, a da run.
export function mixSeed(seed, value) {
  let hash = (seed ^ Math.imul(value + 1, 0x9e3779b1)) >>> 0
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b)
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35)
  return (hash ^ (hash >>> 16)) >>> 0
}

// Seed nova para uma run (só o começo da run é aleatório de verdade)
export function createRunSeed() {
  return Math.floor(Math.random() * 4294967296)
}
