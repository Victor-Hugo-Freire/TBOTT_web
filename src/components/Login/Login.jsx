import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CardUsuario from '../../components/CardUsuario/CardUsuario.jsx'
import { useSession } from '../../context/useSession.js'
import { ROUTES } from '../../routes/paths.js'
import { apiRequest } from '../../services/api.js'
import {
  PASSWORD_MAX,
  PASSWORD_MIN,
  buildLoginPayload,
  buildRegisterPayload,
  validateLoginForm,
  validateRegisterForm,
} from '../../utils/authForm.js'
import './Login.css'

const AUTH_FORM_OPEN_CLASS = 'auth-form-open'

const initialForm = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
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

// - ref: vai para o botão que o atalho de teclado do menu seleciona (o card, se logado, ou "Entrar")
// - modoPagina: usado na tela /entrar. Abre direto o formulário de login (sem os botões
//   Entrar e Criar conta), sem Fechar e Cancelar, e troca entre login e cadastro por um link.
export default function Login({ ref, className = '', modoPagina = false }) {
  const navigate = useNavigate()
  const [screen, setScreen] = useState(modoPagina ? 'login' : 'options')
  const [form, setForm] = useState(initialForm)
  const [statusMessage, setStatusMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { profile, isAuthenticated, refreshSession, logoutSession } = useSession()

  useEffect(() => {
    if (modoPagina) return
    document.body.classList.toggle(AUTH_FORM_OPEN_CLASS, screen !== 'options')
    return () => {
      document.body.classList.remove(AUTH_FORM_OPEN_CLASS)
    }
  }, [screen, modoPagina])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (statusMessage) setStatusMessage('')
  }

  // Alterna entre o login e o cadastro, começando o outro formulário limpo
  function switchForm(nextScreen) {
    setScreen(nextScreen)
    setForm(initialForm)
    setStatusMessage('')
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

      // O login deu certo, mas o perfil ainda precisa chegar pelo cookie. Se não chegar,
      // o formulário fica aberto com o motivo, em vez de fechar sem ninguém logado.
      const session = await refreshSession()
      if (!session.isAuthenticated) {
        setStatusMessage(session.error || 'Login feito, mas não foi possível iniciar a sessão.')
        return
      }

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
      setIsUserMenuOpen(false)
      setStatusMessage('')
    } catch {
      setStatusMessage('Não foi possível sair. Tente de novo.')
    }
  }

  function renderOptions() {
    if (isAuthenticated && profile?.username) {
      return (
        <div className={`login ${className}`} role="group" aria-label="Perfil do usuário">
          <div className="login__user-card">
            <CardUsuario ref={ref} nome={profile.username} onClick={() => setIsUserMenuOpen((open) => !open)} />
            {isUserMenuOpen && (
              <div className="login__user-menu" aria-label="Opções da conta">
                <button type="button" className="login__user-menu-button" onClick={() => navigate(ROUTES.perfil)}>
                  Perfil
                </button>
                <button type="button" className="login__user-menu-button" onClick={handleLogout}>
                  Sair da conta
                </button>
                {statusMessage && (
                  <span className="login__status" role="status" aria-live="polite">
                    {statusMessage}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className={`login ${className}`} role="group" aria-label="Acesso do usuário">
        <div className="login__panel">
          <div className="login__actions">
            <button type="button" className="login__action" ref={ref} onClick={() => setScreen('login')}>
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
      <div className={`login login--open ${modoPagina ? 'login--pagina' : ''} ${className}`} role="dialog" aria-modal="false" aria-label={isRegister ? 'Criar conta' : 'Entrar'}>
        <div className="login__panel login__panel--form">
          <div className="login__header">
            <h2 className="login__title">{isRegister ? 'Criar conta' : 'Entrar'}</h2>
            {!modoPagina && (
              <button type="button" className="login__close" onClick={resetToOptions} aria-label="Fechar formulário">
                Fechar
              </button>
            )}
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
                  autoFocus={modoPagina}
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
                autoFocus={modoPagina && !isRegister}
                onChange={handleChange}
                placeholder="jogador@email.com"
              />
            </label>

            <label className="login__field">
              <span>Senha</span>
              {isRegister && <small>A senha deve ter entre {PASSWORD_MIN} e {PASSWORD_MAX} caracteres.</small>}
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
              {!modoPagina && (
                <button type="button" className="login__button login__button--secondary" onClick={resetToOptions}>
                  Cancelar
                </button>
              )}
              <button type="submit" className="login__button login__button--primary" disabled={isSubmitting}>
                {isSubmitting ? 'Aguarde...' : isRegister ? 'Criar conta' : 'Entrar'}
              </button>
            </div>
          </form>

          {modoPagina && (
            <p className="login__troca">
              {isRegister ? 'Já tem uma conta? ' : 'Não tem uma conta? '}
              <button type="button" className="login__troca-botao" onClick={() => switchForm(isRegister ? 'login' : 'register')}>
                {isRegister ? 'Entrar' : 'Criar conta'}
              </button>
            </p>
          )}
        </div>
      </div>
    )
  }

  return screen === 'options' ? renderOptions() : renderForm()
}
