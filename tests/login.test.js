import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { describe, test } from 'node:test'

describe('Login', () => {
  test('renderiza as opções de acesso sem a indicação de visitante fixa', () => {
    const source = fs.readFileSync(path.resolve('src/components/Login/Login.jsx'), 'utf8')

    assert.match(source, /Entrar/)
    assert.match(source, /Criar conta/)
    assert.doesNotMatch(source, /Sem login/)
    assert.match(source, /Sair da conta/)
  })

  test('inclui validação e envio do login com cookies e sem dados fictícios', () => {
    const source = fs.readFileSync(path.resolve('src/components/Login/Login.jsx'), 'utf8')

    assert.match(source, /buildLoginPayload/)
    assert.match(source, /validateLoginForm/)
    assert.match(source, /apiRequest\((?:'|\")\/api\/auth\/login(?:'|\")/)
    assert.match(source, /credentials:\s*'include'/)
    assert.match(source, /JSON\.stringify\(payload\)/)
    assert.doesNotMatch(source, /localStorage|sessionStorage/)
    assert.doesNotMatch(source, /usuario@example|demo|usuario\.com/i)
  })

  test('recupera a sessão autenticada e exibe profile.username em CardUsuario', () => {
    const loginSource = fs.readFileSync(path.resolve('src/components/Login/Login.jsx'), 'utf8')
    const appSource = fs.readFileSync(path.resolve('src/App.jsx'), 'utf8')
    const sessionSource = fs.readFileSync(path.resolve('src/context/SessionContext.jsx'), 'utf8')
    const salaSource = fs.readFileSync(path.resolve('src/pages/SalaInicial/SalaInicial.jsx'), 'utf8')

    assert.match(loginSource, /CardUsuario/)
    assert.match(loginSource, /profile\.username/)
    assert.match(appSource, /SessionProvider/)
    assert.match(sessionSource, /\/api\/auth\/me/)
    assert.match(sessionSource, /\/api\/auth\/logout/)
    assert.match(sessionSource, /credentials:\s*'include'/)
    assert.match(loginSource, /auth-form-open/)
    assert.match(salaSource, /auth-form-open/)
  })
})
