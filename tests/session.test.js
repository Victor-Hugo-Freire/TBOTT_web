import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { isSessionExpiredResponse } from '../src/utils/session.js'

describe('isSessionExpiredResponse', () => {
  test('401 em rota de dados é sessão vencida', () => {
    assert.equal(isSessionExpiredResponse('/api/ranking?limit=50', 401), true)
    assert.equal(isSessionExpiredResponse('/api/runs', 401), true)
  })

  test('401 nas rotas de autenticação não é sessão vencida', () => {
    assert.equal(isSessionExpiredResponse('/api/auth/login', 401), false)
    assert.equal(isSessionExpiredResponse('/api/auth/me', 401), false)
  })

  test('outros status não são sessão vencida', () => {
    assert.equal(isSessionExpiredResponse('/api/ranking', 200), false)
    assert.equal(isSessionExpiredResponse('/api/ranking', 403), false)
    assert.equal(isSessionExpiredResponse('/api/ranking', 500), false)
  })
})
