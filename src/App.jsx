import { BrowserRouter } from 'react-router-dom'
import { BackgroundMusicProvider } from './context/BackgroundMusicContext.jsx'
import AppRoutes from './routes/AppRoutes.jsx'

// Componente raiz: liga o sistema de rotas. Recursos usados por todas as
// telas (como a sessão do jogador, no futuro) também entram aqui.
export default function App() {
  return (
    <BrowserRouter>
      <BackgroundMusicProvider>
        <AppRoutes />
      </BackgroundMusicProvider>
    </BrowserRouter>
  )
}
