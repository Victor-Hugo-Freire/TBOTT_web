import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '../context/useSession.js'
import { ROUTES } from './paths.js'

// Envolve as telas que exigem login: quem não está logado vai para a tela de entrar.
export default function RotaProtegida() {
  const { isAuthenticated, isLoading } = useSession()

  // Espera a API dizer quem está logado, para não expulsar quem tem sessão válida
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to={ROUTES.entrar} replace />

  return <Outlet />
}
