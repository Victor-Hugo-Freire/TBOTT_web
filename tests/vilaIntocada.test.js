import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { describe, test } from 'node:test'
import { VILA_ESPERA_INTRO_SONG, VILA_ESPERA_SONG } from '../src/audio/music/vila-espera.js'

// A "A Vila Espera" (o menu) e a introdução dela ficam como estão enquanto as faixas dos andares
// mudam. A impressão inclui os parâmetros dos timbres, então mexer num timbre que a Vila usa
// (contrabaixo, guitarraJazz, vibrafone, órgãos, sax, bateria, madeira) também muda o resultado.
// Se um dia a Vila mudar de propósito, atualize as impressões aqui.
// Os números entram arredondados em 6 casas: o Node 20 e o Node 24 calculam `2 ** (n / 12)` com o último
// dígito diferente (783.9908719634985 e ...86), o que não se ouve mas trocava a impressão de uma versão para a outra.
const arredondar = (chave, valor) => (typeof valor === 'number' ? Math.round(valor * 1e6) / 1e6 : valor)
const impressao = (song) => createHash('sha256').update(JSON.stringify(song, arredondar)).digest('hex').slice(0, 16)

describe('a música do menu não muda com as faixas dos andares', () => {
  test('o corpo da "A Vila Espera" é o mesmo, nota por nota e timbre por timbre', () => {
    assert.equal(impressao(VILA_ESPERA_SONG), 'cf6d41f15aeb9dd5')
  })

  test('a introdução de 7,2 s é a mesma', () => {
    assert.equal(impressao(VILA_ESPERA_INTRO_SONG), '84ede3157fdbb570')
  })
})
