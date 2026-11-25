import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  distanciaHarmonica, estatisticasDoBaixo, impressaoDaLevada, impressaoHarmonica, lerAcorde, perfilDaMelodia, unissonosPorMinuto, viradasNasPassagens,
} from '../src/audio/music/analiseDosAndares.js'
import { INSTRUMENTOS, notaDoInstrumento } from '../src/audio/music/instrumentos.js'

// Música pequena no formato do ZzFXM: um canal por instrumento, compassos de 4 passos
const musica = (nomes, compassos, bpm = 120) => [
  nomes.map((nome) => INSTRUMENTOS[nome].parametros),
  compassos.map((canais) => canais.map((passos, indice) => [indice, 0, ...passos])),
  compassos.map((_, indice) => indice),
  bpm,
]
const n = (midi, nome) => notaDoInstrumento(midi, nome)

describe('análise dos andares: harmonia', () => {
  test('lê fundamental, qualidade, família e baixo dos acordes', () => {
    assert.deepEqual({ ...lerAcorde('Am9') }, { simbolo: 'Am9', raiz: 9, qualidade: 'm9', familia: 'menor', baixo: 9 })
    assert.equal(lerAcorde('D9/F#').baixo, 6)
    assert.equal(lerAcorde('Bbmaj7').familia, 'maior')
    assert.equal(lerAcorde('E7b9').familia, 'dominante')
    assert.equal(lerAcorde('Gm7b5').familia, 'meio-diminuto')
    assert.equal(lerAcorde('F#7sus4').familia, 'suspenso')
    assert.equal(lerAcorde('Bdim7/C').familia, 'diminuto')
    assert.equal(lerAcorde('E5').familia, 'quinta')
    assert.equal(lerAcorde('Am(maj7)/G#').familia, 'menor')
  })

  test('conta a cadência ♭VI → V7 → i e os acordes 7#9', () => {
    const { cadencias } = impressaoHarmonica(['Am7', 'Fmaj7', 'E7#9', 'Am7'])
    assert.equal(cadencias.sextaQuintaPrimeira, 1)
    assert.equal(cadencias.setimaSustenidoNove, 1)
    const outra = impressaoHarmonica(['Am9', 'Dm9', 'E7b9', 'Am9'])
    assert.equal(outra.cadencias.sextaQuintaPrimeira, 0)
  })

  test('ritmo harmônico: repete, troca ou dois acordes no compasso', () => {
    const { ritmo } = impressaoHarmonica(['F9', 'F9', 'Bb13', 'Gm9 C13sus4'])
    assert.deepEqual(ritmo, { troca: 2, repete: 1, dois: 1 })
  })

  test('harmonia igual tem distância zero; harmonias sem nada em comum, distância alta', () => {
    const a = impressaoHarmonica(['Am7', 'Dm7', 'E7#9', 'Am7'])
    assert.equal(distanciaHarmonica(a, a), 0)
    const b = impressaoHarmonica(['E5', 'E5', 'F5', 'E5'])
    assert.ok(distanciaHarmonica(a, b) > 0.6)
  })
})

describe('análise dos andares: levada, baixo e uníssonos', () => {
  test('a levada separa bumbo e tons pela nota e pela posição no tempo', () => {
    const song = musica(['bumbo'], [[[12, 0, 26, 0]]])
    const batidas = impressaoDaLevada(song, ['bumbo'], { passosPorTempo: 2 })
    assert.deepEqual(batidas, { 'bumbo:0:0': 1, 'tons:1:0': 1 })
  })

  test('virada: o último compasso da seção tem bateria diferente do padrão da seção', () => {
    const song = musica(['bumbo'], [[[12, 0, 0, 0]], [[12, 0, 0, 0]], [[12, 0, 12, 12]]])
    assert.equal(viradasNasPassagens(song, ['bumbo'], [{ inicio: 0, compassos: 3 }]), 1)
    assert.equal(viradasNasPassagens(song, ['bumbo'], [{ inicio: 0, compassos: 2 }]), 0)
  })

  test('baixo: mediana, parte abaixo de 80 Hz e movimento', () => {
    const notas = [33, 45, 45, 40].map((midi) => n(midi, 'contrabaixo'))
    const song = musica(['contrabaixo'], [[notas]])
    const baixo = estatisticasDoBaixo(song, ['contrabaixo'])
    assert.equal(baixo.notas, 4)
    assert.equal(Math.round(baixo.medianaHz), 110)
    assert.equal(baixo.abaixoDe80, 0.25)
    assert.equal(baixo.movimento, 2 / 3)
  })

  test('uníssono é o mesmo som em dois instrumentos no mesmo passo (oitava não conta)', () => {
    const nomes = ['contrabaixo', 'saxBaritono']
    const song = musica(nomes, [[[n(45, 'contrabaixo'), 0, n(45, 'contrabaixo'), 0], [n(45, 'saxBaritono'), 0, n(57, 'saxBaritono'), 0]]], 60)
    // um compasso de 4 passos a 60 bpm do ZzFXM = 1 s; um uníssono → 60 por minuto
    assert.equal(Math.round(unissonosPorMinuto(song, nomes)), 60)
  })

  test('perfil da melodia: pentatônica, notas do modo, registro e região dos efeitos', () => {
    const nomes = ['vibrafone']
    // Si dórico: Si, Ré, Sol# (a nota do modo) e Fá#; o Fá#6 passa de 880 Hz
    const notas = [59, 62, 68, 90].map((midi) => n(midi, 'vibrafone'))
    const song = musica(nomes, [[notas]], 60)
    const perfil = perfilDaMelodia(song, nomes, [[['vibrafone', 0]]], { passosPorTempo: 1 }, { tonica: 'B', modo: 'dorico' })
    assert.equal(perfil.notas, 4)
    assert.equal(perfil.pentatonica, 0.75)
    assert.equal(perfil.notasDoModo, 0.25)
    assert.equal(perfil.acimaDe880, 1)
    assert.equal(perfil.regiaoDosEfeitos, 3)
  })
})
