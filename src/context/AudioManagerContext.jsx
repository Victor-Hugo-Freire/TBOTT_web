import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createAudioManager } from '../audio/AudioManager.js'
import { readOptions } from '../utils/options.js'
import { AudioManagerContext } from './useAudio.js'
import { installAudioUnlock } from './audioUnlock.js'
import { createAudioLifecycleCleanup } from './audioLifecycle.js'
import { createVilaEsperaAudioSource, VILA_ESPERA_MUSIC_NAME, VILA_ESPERA_MUSIC_OPTIONS } from '../data/vilaEsperaMusic.js'
import { registerRoomInteractionEffects, unregisterRoomInteractionEffects } from '../audio/AudioEffects/rooms/index.js'

export function AudioProvider({ children }) {
  const [initialOptions] = useState(readOptions)
  const [manager] = useState(() => createAudioManager({ fallbackOptions: initialOptions.options }))
  const [state, setState] = useState('idle')
  const [muted, setMutedState] = useState(false)
  const [activeMusicName, setActiveMusicName] = useState(null)
  const [musicVolume, setMusicVolumeState] = useState(initialOptions.options.musicVolume)
  const [effectsVolume, setEffectsVolumeState] = useState(initialOptions.options.effectsVolume)
  const mountedRef = useRef(true)
  const [lifecycle] = useState(() => createAudioLifecycleCleanup(() => {
    manager.destroy()
  }))

  const unlock = useCallback(async () => {
    const result = await manager.unlock()
    if (mountedRef.current) setState(manager.state)
    return result
  }, [manager])

  useEffect(() => {
    mountedRef.current = true
    lifecycle.activate()
    const cleanupUnlock = installAudioUnlock(window, unlock)

    manager.registerMusic(VILA_ESPERA_MUSIC_NAME, createVilaEsperaAudioSource, VILA_ESPERA_MUSIC_OPTIONS)
    registerRoomInteractionEffects(manager)

    return () => {
      mountedRef.current = false
      cleanupUnlock()
      manager.unregisterMusic(VILA_ESPERA_MUSIC_NAME)
      unregisterRoomInteractionEffects(manager)
      lifecycle.deactivate()
    }
  }, [unlock, lifecycle, manager])

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

  const registerEffect = useCallback((...args) => manager.registerEffect(...args), [manager])
  const registerMusic = useCallback((...args) => manager.registerMusic(...args), [manager])
  const unregisterEffect = useCallback((...args) => manager.unregisterEffect(...args), [manager])
  const unregisterMusic = useCallback((...args) => manager.unregisterMusic(...args), [manager])

  const playMusic = useCallback((name, options) => {
    const result = manager.playMusic(name, options)
    setActiveMusicName(manager.activeMusicName)
    return result
  }, [manager])

  const stopMusic = useCallback((options) => {
    manager.stopMusic(options)
    setActiveMusicName(null)
  }, [manager])

  const playEffect = useCallback((...args) => manager.playEffect(...args), [manager])
  const stopEffect = useCallback((...args) => manager.stopEffect(...args), [manager])
  const stopAllEffects = useCallback((...args) => manager.stopAllEffects(...args), [manager])

  const value = useMemo(() => ({
    state,
    muted,
    activeMusicName,
    musicVolume,
    effectsVolume,
    unlock,
    registerEffect,
    registerMusic,
    unregisterEffect,
    unregisterMusic,
    playEffect,
    stopEffect,
    stopAllEffects,
    playMusic,
    stopMusic,
    setEffectsVolume,
    setMusicVolume,
    setMuted,
    toggleMute,
  }), [state, muted, activeMusicName, musicVolume, effectsVolume, unlock, registerEffect, registerMusic, unregisterEffect, unregisterMusic, playEffect, stopEffect, stopAllEffects, playMusic, stopMusic, setEffectsVolume, setMusicVolume, setMuted, toggleMute])

  return <AudioManagerContext.Provider value={value}>{children}</AudioManagerContext.Provider>
}
