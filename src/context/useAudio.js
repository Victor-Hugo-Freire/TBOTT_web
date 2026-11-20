import { createContext, useContext } from 'react'

export const AudioContext = createContext(null)

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio deve ser usado dentro de AudioProvider.')
  }
  return context
}
