import { isSessionExpiredResponse } from '../utils/session.js'

// Comunicação com a TBOTT_api. O endereço vem do .env (VITE_API_URL);
// sem ele, usa a porta padrão da API em desenvolvimento.
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')

// Função chamada quando a API responde 401 numa rota de dados (sessão vencida).
// O SessionContext registra a dele aqui, assim nenhuma tela repete esse tratamento.
let onSessionExpired = null

export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler
}

// Faz uma requisição à API e devolve o JSON da resposta.
// Exemplo: const { ranking } = await apiRequest('/api/ranking?limit=10')
// Se a API responder com erro, lança um Error com a mensagem dela e o status HTTP.
export async function apiRequest(path, options = {}) {
  const headers = { Accept: 'application/json', ...options.headers }
  if (options.body) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('Não foi possível conectar à API. Verifique se ela está em execução.')
  }

  // Respostas sem corpo (como 204) viram null
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    if (isSessionExpiredResponse(path, response.status)) onSessionExpired?.()
    const error = new Error(data?.error || `A API respondeu com o status ${response.status}.`)
    error.status = response.status
    throw error
  }

  return data
}
