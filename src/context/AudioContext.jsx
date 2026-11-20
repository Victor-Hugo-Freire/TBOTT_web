import { useCallback, useMemo, useState } from 'react'
import { createAudioManager } from '../audio/AudioManager.js'
import { readOptions } from '../utils/options.js'
import { AudioContext as AudioContextProvider } from './useAudio.js'

export function AudioProvider({ children }) {
  const [initialOptions] = useState(readOptions)
  const [manager] = useState(() => createAudioManager({ fallbackOptions: initialOptions.options }))
  const [state, setState] = useState('idle')
  const [muted, setMutedState] = useState(false)
  const [activeMusicName, setActiveMusicName] = useState(null)
  const [musicVolume, setMusicVolumeState] = useState(initialOptions.options.musicVolume)
  const [effectsVolume, setEffectsVolumeState] = useState(initialOptions.options.effectsVolume)

  const unlock = useCallback(async () => {
    const result = await manager.unlock()
    setState(manager.state)
    return result
  }, [manager])

  const setEffectsVolume = useCallback((value) => {
    manager.setEffectsVolume(value)
    setEffectsVolumeState(manager.effectsVolume)
  }, [manager])

  const setMusicVolume = useCallback((value) => {
    manager.setMusicVolume(value)
    setMusicVolumeState(manager.musicVolume)
  }, [manager])

  const setMuted = useCallback((mutedValue) => {
    manager.setMuted(mutedValue)
    setMutedState(manager.muted)
  }, [manager])

  const toggleMute = useCallback(() => {
    const isMuted = manager.toggleMute()
    setMutedState(isMuted)
    return isMuted
  }, [manager])

  const playMusic = useCallback((name, options) => {
    const result = manager.playMusic(name, options)
    setActiveMusicName(manager.activeMusicName)
    return result
  }, [manager])

  const stopMusic = useCallback((options) => {
    manager.stopMusic(options)
    setActiveMusicName(null)
  }, [manager])

  const value = useMemo(() => ({
    state,
    muted,
    activeMusicName,
    musicVolume,
    effectsVolume,
    unlock,
    registerEffect: (...args) => manager.registerEffect(...args),
    registerMusic: (...args) => manager.registerMusic(...args),
    unregisterEffect: (...args) => manager.unregisterEffect(...args),
    unregisterMusic: (...args) => manager.unregisterMusic(...args),
    playEffect: (...args) => manager.playEffect(...args),
    stopEffect: (...args) => manager.stopEffect(...args),
    stopAllEffects: (...args) => manager.stopAllEffects(...args),
    playMusic,
    stopMusic,
    setEffectsVolume,
    setMusicVolume,
    setMuted,
    toggleMute,
  }), [state, muted, activeMusicName, musicVolume, effectsVolume, unlock, playMusic, stopMusic, setEffectsVolume, setMusicVolume, setMuted, toggleMute, manager])

  return <AudioContextProvider.Provider value={value}>{children}</AudioContextProvider.Provider>
}
