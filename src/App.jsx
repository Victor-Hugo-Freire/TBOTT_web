import { BrowserRouter } from 'react-router-dom'
import { SessionProvider } from './context/SessionContext.jsx'
import { AudioProvider } from './context/AudioManagerContext.jsx'
import AppRoutes from './routes/AppRoutes.jsx'
import VilaEsperaMusicController from './components/VilaEsperaMusicController/VilaEsperaMusicController.jsx'

// Componente raiz: liga o sistema de rotas e a sessão do jogador acessível
// a todas as telas que precisarem consultar o perfil autenticado.
export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <AudioProvider>
          <VilaEsperaMusicController />
          <AppRoutes />
        </AudioProvider>
      </SessionProvider>
    </BrowserRouter>
  )
}
