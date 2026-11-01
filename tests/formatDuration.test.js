import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { formatDuration } from '../src/utils/formatDuration.js'

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
