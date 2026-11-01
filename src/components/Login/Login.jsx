import { forwardRef, useEffect, useState } from 'react'
import CardUsuario from '../../components/CardUsuario/CardUsuario.jsx'
import { useSession } from '../../context/SessionContext.jsx'
import { apiRequest } from '../../services/api.js'
import './Login.css'

const AUTH_FORM_OPEN_CLASS = 'auth-form-open'

const initialForm = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export function buildRegisterPayload(form = {}) {
  return {
    username: String(form.username ?? '').trim(),
    email: String(form.email ?? '').trim().toLowerCase(),
    password: String(form.password ?? ''),
  }
}

export function buildLoginPayload(form = {}) {
  return {
    email: String(form.email ?? '').trim().toLowerCase(),
    password: String(form.password ?? ''),
  }
}

export function validateRegisterForm(form = {}) {
  const username = String(form.username ?? '').trim()
  const email = String(form.email ?? '').trim().toLowerCase()
  const password = String(form.password ?? '')
  const confirmPassword = String(form.confirmPassword ?? '')

  if (!username) return { isValid: false, message: 'Nome de usuário é obrigatório.' }
  if (!email) return { isValid: false, message: 'E-mail é obrigatório.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { isValid: false, message: 'E-mail inválido.' }
  if (!password) return { isValid: false, message: 'Senha é obrigatória.' }
  if (password.trim().length === 0) return { isValid: false, message: 'Senha não pode conter apenas espaços.' }
  if (!confirmPassword) return { isValid: false, message: 'Confirmação de senha é obrigatória.' }
  if (password !== confirmPassword) return { isValid: false, message: 'As senhas não conferem.' }

  return { isValid: true, message: '' }
}

export function validateLoginForm(form = {}) {
  const email = String(form.email ?? '').trim().toLowerCase()
  const password = String(form.password ?? '')

  if (!email) return { isValid: false, message: 'E-mail é obrigatório.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { isValid: false, message: 'E-mail inválido.' }
  if (!password) return { isValid: false, message: 'Senha é obrigatória.' }
  if (password.trim().length === 0) return { isValid: false, message: 'Senha não pode conter apenas espaços.' }

  return { isValid: true, message: '' }
}

function getLoginErrorMessage(error) {
  const status = Number(error?.status ?? 0)
  const message = String(error?.message ?? '')

  if (status === 400) return message || 'Dados inválidos.'
  if (status === 401) return message || 'E-mail ou senha incorretos.'
  if (status === 403) return message || 'Confirme seu e-mail antes de entrar.'
  if (status === 429) return message || 'Muitas tentativas. Tente novamente mais tarde.'
  if (status === 500) return message || 'Perfil ausente ou erro interno.'
  if (status === 503) return message || 'Serviço de autenticação indisponível no momento.'

  return message || 'Não foi possível entrar no momento.'
}

const Login = forwardRef(function Login({ className = '' }, ref) {
  const [screen, setScreen] = useState('options')
  const [form, setForm] = useState(initialForm)
  const [statusMessage, setStatusMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { profile, isAuthenticated, refreshSession, logoutSession } = useSession()

  useEffect(() => {
    if (typeof document === 'undefined') return

    document.body.classList.toggle(AUTH_FORM_OPEN_CLASS, screen !== 'options')
    return () => {
      document.body.classList.remove(AUTH_FORM_OPEN_CLASS)
    }
  }, [screen])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (statusMessage) setStatusMessage('')
  }

  function resetToOptions() {
    setScreen('options')
    setForm(initialForm)
    setStatusMessage('')
    setIsSubmitting(false)
    setIsUserMenuOpen(false)
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault()

    const validation = validateRegisterForm(form)
    if (!validation.isValid) {
      setStatusMessage(validation.message)
      return
    }

    const payload = buildRegisterPayload(form)
    setIsSubmitting(true)
    setStatusMessage('Enviando cadastro...')

    try {
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (response?.requiresEmailConfirmation) {
        setStatusMessage('Conta criada. Confirme seu e-mail para ativar a conta.')
      } else {
        setStatusMessage('Conta criada com sucesso. Use o e-mail e a senha informados para entrar.')
      }

      setForm(initialForm)
    } catch (error) {
      setStatusMessage(error?.message || 'Não foi possível concluir o cadastro.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLoginSubmit(event) {
    event.preventDefault()

    const validation = validateLoginForm(form)
    if (!validation.isValid) {
      setStatusMessage(validation.message)
      return
    }

    const payload = buildLoginPayload(form)
    setIsSubmitting(true)
    setStatusMessage('Entrando...')

    try {
      await apiRequest('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      await refreshSession()
      setForm(initialForm)
      setScreen('options')
      setStatusMessage('')
    } catch (error) {
      setStatusMessage(getLoginErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogout() {
    try {
      await logoutSession()
    } finally {
      setIsUserMenuOpen(false)
      setScreen('options')
      setForm(initialForm)
      setStatusMessage('')
    }
  }

  function renderOptions() {
    if (isAuthenticated && profile?.username) {
      return (
        <div className={`login ${className}`} ref={ref} tabIndex={0} role="group" aria-label="Perfil do usuário">
          <div className="login__user-card">
            <CardUsuario nome={profile.username} onClick={() => setIsUserMenuOpen((open) => !open)} />
            {isUserMenuOpen && (
              <div className="login__user-menu" role="menu" aria-label="Opções da conta">
                <button type="button" className="login__user-menu-button" onClick={handleLogout}>
                  Sair da conta
                </button>
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className={`login ${className}`} ref={ref} tabIndex={0} role="group" aria-label="Acesso do usuário">
        <div className="login__panel">
          <div className="login__actions">
            <button type="button" className="login__action" onClick={() => setScreen('login')}>
              Entrar
            </button>
            <button type="button" className="login__action" onClick={() => setScreen('register')}>
              Criar conta
            </button>
          </div>
        </div>
      </div>
    )
  }

  function renderForm() {
    const isRegister = screen === 'register'

    return (
      <div className={`login login--open ${className}`} ref={ref} tabIndex={0} role="dialog" aria-modal="false" aria-label={isRegister ? 'Criar conta' : 'Entrar'}>
        <div className="login__panel login__panel--form">
          <div className="login__header">
            <h2 className="login__title">{isRegister ? 'Criar conta' : 'Entrar'}</h2>
            <button type="button" className="login__close" onClick={resetToOptions} aria-label="Fechar formulário">
              Fechar
            </button>
          </div>

          <form className="login__form" onSubmit={isRegister ? handleRegisterSubmit : handleLoginSubmit}>
            {isRegister && (
              <label className="login__field">
                <span>Nome de usuário</span>
                <small>Será o nome exibido no jogo. Exemplo: jogador123</small>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="jogador123"
                />
              </label>
            )}

            <label className="login__field">
              <span>E-mail</span>
              <small>Use um endereço de e-mail válido. Exemplo: jogador@email.com</small>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jogador@email.com"
              />
            </label>

            <label className="login__field">
              <span>Senha</span>
              <small>A senha deve ter entre 8 e 72 caracteres e não pode ser apenas espaços.</small>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Senha"
              />
            </label>

            {isRegister && (
              <label className="login__field">
                <span>Confirmação de senha</span>
                <small>Repita exatamente a mesma senha informada acima.</small>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirme a senha"
                />
              </label>
            )}

            {statusMessage && (
              <span className="login__status" role="status" aria-live="polite">
                {statusMessage}
              </span>
            )}

            <div className="login__form-actions">
              <button type="button" className="login__button login__button--secondary" onClick={resetToOptions}>
                Cancelar
              </button>
              <button type="submit" className="login__button login__button--primary" disabled={isSubmitting}>
                {isSubmitting ? 'Aguarde...' : isRegister ? 'Criar conta' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return screen === 'options' ? renderOptions() : renderForm()
})

export default Login
