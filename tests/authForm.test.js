import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  PASSWORD_MAX,
  PASSWORD_MIN,
  buildLoginPayload,
  buildRegisterPayload,
  validateLoginForm,
  validateRegisterForm,
} from '../src/utils/authForm.js'

const validRegister = {
  username: 'jogador123',
  email: 'jogador@email.com',
  password: 'senha1234',
  confirmPassword: 'senha1234',
}

describe('payloads de autenticação', () => {
  test('o e-mail vai sem espaços e em minúsculas, a senha vai exatamente como digitada', () => {
    const payload = buildLoginPayload({ email: '  Jogador@Email.COM ', password: ' Abc 123 ' })
    assert.deepEqual(payload, { email: 'jogador@email.com', password: ' Abc 123 ' })
  })

  test('o cadastro não envia a confirmação de senha', () => {
    const payload = buildRegisterPayload({ ...validRegister, username: '  jogador123 ' })
    assert.deepEqual(payload, { username: 'jogador123', email: 'jogador@email.com', password: 'senha1234' })
  })
})

describe('validateLoginForm', () => {
  test('aceita e-mail e senha preenchidos', () => {
    assert.equal(validateLoginForm({ email: 'a@b.co', password: 'x' }).isValid, true)
  })

  test('recusa e-mail vazio, e-mail inválido, senha vazia e senha só com espaços', () => {
    assert.equal(validateLoginForm({ email: '', password: 'x' }).isValid, false)
    assert.equal(validateLoginForm({ email: 'sem-arroba', password: 'x' }).isValid, false)
    assert.equal(validateLoginForm({ email: 'a@b.co', password: '' }).isValid, false)
    assert.equal(validateLoginForm({ email: 'a@b.co', password: '   ' }).isValid, false)
  })

  test('não limita o tamanho da senha, para contas criadas com regra antiga', () => {
    assert.equal(validateLoginForm({ email: 'a@b.co', password: 'x'.repeat(PASSWORD_MAX + 20) }).isValid, true)
  })
})

describe('validateRegisterForm', () => {
  test('aceita um cadastro completo', () => {
    assert.equal(validateRegisterForm(validRegister).isValid, true)
  })

  test('recusa nome de usuário vazio e e-mail inválido', () => {
    assert.equal(validateRegisterForm({ ...validRegister, username: '  ' }).isValid, false)
    assert.equal(validateRegisterForm({ ...validRegister, email: 'sem-arroba' }).isValid, false)
  })

  test('recusa senha menor que o mínimo e maior que o máximo', () => {
    const curta = 'a'.repeat(PASSWORD_MIN - 1)
    const longa = 'a'.repeat(PASSWORD_MAX + 1)
    assert.equal(validateRegisterForm({ ...validRegister, password: curta, confirmPassword: curta }).isValid, false)
    assert.equal(validateRegisterForm({ ...validRegister, password: longa, confirmPassword: longa }).isValid, false)
  })

  test('recusa senhas diferentes', () => {
    const result = validateRegisterForm({ ...validRegister, confirmPassword: 'outra-senha' })
    assert.equal(result.isValid, false)
    assert.match(result.message, /não conferem/)
  })
})
