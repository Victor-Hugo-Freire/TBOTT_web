import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { formatDuration, formatRunTime } from '../src/utils/formatDuration.js'

describe('formatDuration', () => {
  test('formata em mm:ss com zero à esquerda', () => {
    assert.equal(formatDuration(0), '00:00')
    assert.equal(formatDuration(5000), '00:05')
    assert.equal(formatDuration(650000), '10:50')
  })

  test('descarta os milissegundos em vez de arredondar para cima', () => {
    assert.equal(formatDuration(59999), '00:59')
  })

  test('passa de uma hora sem virar horas', () => {
    assert.equal(formatDuration(4503000), '75:03')
  })
})

describe('formatRunTime (contador da sala)', () => {
  test('formata em HH:MM:SS.cc, como o contador do Isaac', () => {
    assert.equal(formatRunTime(0), '00:00:00.00')
    assert.equal(formatRunTime(12430), '00:00:12.43')
    assert.equal(formatRunTime(3723456), '01:02:03.45')
  })

  test('descarta o que passa dos centésimos e ignora tempo negativo', () => {
    assert.equal(formatRunTime(12439), '00:00:12.43')
    assert.equal(formatRunTime(-50), '00:00:00.00')
  })
})
