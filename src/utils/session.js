// Um 401 numa rota de dados (ranking, personagens...) quer dizer que a sessão venceu.
// Nas rotas de /api/auth/ ele significa outra coisa (senha errada ou ninguém logado).
export function isSessionExpiredResponse(path, status) {
  return status === 401 && !path.startsWith('/api/auth/')
}
