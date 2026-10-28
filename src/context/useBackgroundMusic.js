import { useContext } from 'react'
import { BackgroundMusicContext } from './backgroundMusic.js'

export function useBackgroundMusic() {
  const context = useContext(BackgroundMusicContext)
  if (!context) {
    throw new Error('useBackgroundMusic deve ser usado dentro de BackgroundMusicProvider.')
  }
  return context
}
