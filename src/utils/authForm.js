// Regras e montagem dos dados dos formulários de entrar e criar conta.
// O limite de senha precisa ser o mesmo da TBOTT_api (auth.routes.js e authService.js).
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function buildRegisterPayload(form = {}) {
  return {
    username: String(form.username ?? '').trim(),
    email: normalizeEmail(form.email),
    password: String(form.password ?? ''),
  }
}

export function buildLoginPayload(form = {}) {
  return {
    email: normalizeEmail(form.email),
    password: String(form.password ?? ''),
  }
}

// No login a senha não tem limite de tamanho: quem criou a conta com
// uma regra antiga precisa conseguir entrar.
export function validateLoginForm(form = {}) {
  const email = normalizeEmail(form.email)
  const password = String(form.password ?? '')

  if (!email) return { isValid: false, message: 'E-mail é obrigatório.' }
  if (!EMAIL_PATTERN.test(email)) return { isValid: false, message: 'E-mail inválido.' }
  if (!password) return { isValid: false, message: 'Senha é obrigatória.' }
  if (password.trim().length === 0) return { isValid: false, message: 'Senha não pode conter apenas espaços.' }

  return { isValid: true, message: '' }
}

export function validateRegisterForm(form = {}) {
  const username = String(form.username ?? '').trim()
  const password = String(form.password ?? '')
  const confirmPassword = String(form.confirmPassword ?? '')

  if (!username) return { isValid: false, message: 'Nome de usuário é obrigatório.' }

  const login = validateLoginForm(form)
  if (!login.isValid) return login

  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return { isValid: false, message: `A senha deve ter entre ${PASSWORD_MIN} e ${PASSWORD_MAX} caracteres.` }
  }
  if (!confirmPassword) return { isValid: false, message: 'Confirmação de senha é obrigatória.' }
  if (password !== confirmPassword) return { isValid: false, message: 'As senhas não conferem.' }

  return { isValid: true, message: '' }
}
