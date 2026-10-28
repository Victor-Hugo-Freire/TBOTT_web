import { Navigate, Route, Routes } from 'react-router-dom'
import Inicial from '../pages/Inicial/Inicial.jsx'
import MenuPrincipal from '../pages/MenuPrincipal/MenuPrincipal.jsx'
import MenuDestino from '../pages/MenuPrincipal/MenuDestino.jsx'
import { ROUTES } from './paths.js'

// Para adicionar uma tela: crie a pasta dela em src/pages (com nome em
// português, como Inicial), coloque o endereço em paths.js e registre a rota aqui.
export default function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.inicial} element={<Inicial />} />
      <Route path={ROUTES.menuPrincipal} element={<MenuPrincipal />} />
      <Route path={ROUTES.novaPartida} element={<MenuDestino titulo="New game" />} />
      <Route path={ROUTES.ranking} element={<MenuDestino titulo="Ranks" />} />
      <Route path={ROUTES.opcoes} element={<MenuDestino titulo="Options" />} />
      <Route path={ROUTES.perfil} element={<MenuDestino titulo="Perfil do usuário" />} />
      {/* Endereço desconhecido volta para a tela inicial */}
      <Route path="*" element={<Navigate to={ROUTES.inicial} replace />} />
    </Routes>
  )
}
