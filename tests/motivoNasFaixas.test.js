import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { INSTRUMENTOS } from '../src/audio/music/instrumentos.js'
import { INSTRUMENTOS_DAS_MUSICAS, MOTIVOS_DAS_MUSICAS, MUSICAS } from '../src/audio/music/musicas.js'
import { CELULA_DO_TUNG_GRAUS, CELULA_DO_TUNG_TEMPOS, passosDoTungTungTung, temposParaPassos } from '../src/audio/music/motivos.js'

const alturaEscrita = (nota, nome) => (nota | 0) - 12 + INSTRUMENTOS[nome].baseMidi
const tocadas = (canal) => canal.slice(2).flatMap((nota, passo) => (nota > 0 ? [{ passo, nota }] : []))

describe('o motivo do Tung em cada faixa', () => {
  for (const [id, motivo] of Object.entries(MOTIVOS_DAS_MUSICAS)) {
    const [, padroes] = MUSICAS[id]
    const nomes = INSTRUMENTOS_DAS_MUSICAS[id]
    const passosPorCompasso = padroes[0][0].length - 2
    const passosPorTempo = passosPorCompasso / 4
    const canaisDe = (nome) => padroes[0].flatMap((canal, indice) => (nomes[canal[0]] === nome ? [indice] : []))

    test(`${id}: a célula (5 – ♭7 – 1' – ♭7 – 5) com o ritmo fixo, em pelo menos dois compassos`, () => {
      const compassos = Object.entries(motivo.riff.compassos)
      assert.ok(compassos.length >= 2)
      const passos = temposParaPassos(CELULA_DO_TUNG_TEMPOS, passosPorTempo)
      const [canal] = canaisDe(motivo.riff.instrumento)
      for (const [compasso, tonica] of compassos) {
        const notas = tocadas(padroes[Number(compasso)][canal]).slice(0, 5)
        assert.deepEqual(notas.map(({ passo }) => passo), passos, `compasso ${compasso}`)
        assert.deepEqual(notas.map(({ nota }) => alturaEscrita(nota, motivo.riff.instrumento) - tonica), [...CELULA_DO_TUNG_GRAUS], `compasso ${compasso}`)
      }
    })

    test(`${id}: o tung-tung-tung no último tempo, em crescendo, e só nos compassos marcados`, () => {
      const [canal] = canaisDe('madeira')
      const passos = passosDoTungTungTung(passosPorTempo)
      assert.ok(motivo.tung.compassos.length >= 2)
      padroes.forEach((padrao, compasso) => {
        const batidas = tocadas(padrao[canal])
        if (!motivo.tung.compassos.includes(compasso)) {
          assert.deepEqual(batidas, [], `compasso ${compasso}`)
          return
        }
        assert.deepEqual(batidas.map(({ passo }) => passo), passos, `compasso ${compasso}`)
        const atenuacoes = batidas.map(({ nota }) => nota % 1)
        assert.ok(atenuacoes[0] > atenuacoes[2], `crescendo no compasso ${compasso}`)
      })
    })
  }
})
