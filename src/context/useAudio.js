import { createContext, useContext } from 'react'

export const AudioManagerContext = createContext(null)

export function useAudio() {
  const context = useContext(AudioManagerContext)
  if (!context) {
    throw new Error('useAudio deve ser usado dentro de AudioProvider.')
  }
  return context
}
