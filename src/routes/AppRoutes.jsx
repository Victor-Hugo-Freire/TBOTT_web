import { Navigate, Route, Routes } from 'react-router-dom'
import Inicial from '../pages/Inicial/Inicial.jsx'
import MenuPrincipal from '../pages/MenuPrincipal/MenuPrincipal.jsx'
import MenuDestino from '../pages/MenuPrincipal/MenuDestino.jsx'
import Opcoes from '../pages/Opcoes/Opcoes.jsx'
import SessaoPersonagem from '../pages/sessaoPersonagem/SessaoPersonagem.jsx'
import SalaInicial from '../pages/SalaInicial/SalaInicial.jsx'
import { ROUTES } from './paths.js'

// Para adicionar uma tela: crie a pasta dela em src/pages (com nome em
// português, como Inicial), coloque o endereço em paths.js e registre a rota aqui.
export default function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.inicial} element={<Inicial />} />
      <Route path={ROUTES.menuPrincipal} element={<MenuPrincipal />} />
      <Route path={ROUTES.selecaoPersonagem} element={<SessaoPersonagem />} />
      <Route path={ROUTES.novaPartida} element={<SalaInicial />} />
      <Route path={ROUTES.ranking} element={<MenuDestino titulo="Ranks" />} />
      <Route path={ROUTES.opcoes} element={<Opcoes />} />
      <Route path={ROUTES.perfil} element={<MenuDestino titulo="Perfil do usuário" />} />
      {/* Endereço desconhecido volta para a tela inicial */}
      <Route path="*" element={<Navigate to={ROUTES.inicial} replace />} />
    </Routes>
  )
}
