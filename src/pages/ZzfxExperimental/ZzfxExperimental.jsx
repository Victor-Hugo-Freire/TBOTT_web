import { useEffect, useMemo, useState } from 'react'
import { useAudio } from '../../context/useAudio.js'
import { createZzfxAudioSource } from '../../audio/zzfxExperimental.js'
import { createZzfxmAudioSource } from '../../audio/zzfxmExperimental.js'
import {
  ZZFX_EXPERIMENTAL_PRESETS,
  ZZFXM_EXPERIMENTAL_SONG,
} from '../../data/zzfxExperimentalPresets.js'
import './ZzfxExperimental.css'

export default function ZzfxExperimental() {
  const audio = useAudio()
  const {
    registerEffect,
    registerMusic,
    unregisterEffect,
    unregisterMusic,
  } = audio
  const [selectedPresetId, setSelectedPresetId] = useState('attack')
  const [frequency, setFrequency] = useState(220)
  const [volume, setVolume] = useState(80)
  const [release, setRelease] = useState(0.12)
  const [lastResult, setLastResult] = useState('Pronto para testar.')

  const selectedPreset = useMemo(
    () => ZZFX_EXPERIMENTAL_PRESETS.find((preset) => preset.id === selectedPresetId) || ZZFX_EXPERIMENTAL_PRESETS[0],
    [selectedPresetId],
  )

  const adjustedParameters = useMemo(() => {
    const parameters = [...selectedPreset.parameters]
    parameters[0] = volume / 100
    parameters[2] = frequency
    parameters[5] = release
    return parameters
  }, [selectedPreset, frequency, volume, release])

  useEffect(() => {
    for (const preset of ZZFX_EXPERIMENTAL_PRESETS) {
      const parameters = preset.parameters
      registerEffect(`zzfx-experimental-${preset.id}`, (context) => (
        createZzfxAudioSource(context, parameters)
      ), { maxVoices: 4, cooldownMs: 40 })
    }

    registerMusic('zzfxm-experimental', (context) => (
      createZzfxmAudioSource(context, ZZFXM_EXPERIMENTAL_SONG)
    ))

    return () => {
      for (const preset of ZZFX_EXPERIMENTAL_PRESETS) {
        unregisterEffect(`zzfx-experimental-${preset.id}`)
      }
      unregisterMusic('zzfxm-experimental')
    }
  }, [registerEffect, registerMusic, unregisterEffect, unregisterMusic])

  const playEffect = async (preset = selectedPreset, parameters = adjustedParameters) => {
    await audio.unlock()
    const name = `zzfx-experimental-${preset.id}`
    registerEffect(name, (context) => createZzfxAudioSource(context, parameters), { maxVoices: 4, cooldownMs: 40 })
    const result = audio.playEffect(name)
    setLastResult(`${preset.label}: ${result.reason}`)
  }

  const playMusic = async () => {
    await audio.unlock()
    const result = audio.playMusic('zzfxm-experimental', { fadeMs: 180 })
    setLastResult(`ZzFXM: ${result.reason}`)
  }

  return (
    <main className="zzfx-experimental">
      <header>
        <p className="zzfx-experimental__eyebrow">TBOTT · experimento isolado</p>
        <h1>ZzFX e ZzFXM</h1>
        <p>A reprodução passa pelo <strong>AudioManager</strong>; esta página não cria outro contexto de áudio.</p>
      </header>

      <section className="zzfx-experimental__status" aria-live="polite">
        <span>Estado: <strong>{audio.state}</strong></span>
        <span>Mute: <strong>{audio.muted ? 'on' : 'off'}</strong></span>
        <span>Música: <strong>{audio.activeMusicName || 'parada'}</strong></span>
        <span>{lastResult}</span>
      </section>

      <section className="zzfx-experimental__grid">
        <div className="zzfx-experimental__panel">
          <h2>Efeitos ZzFX</h2>
          <div className="zzfx-experimental__preset-list">
            {ZZFX_EXPERIMENTAL_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.id}
                className={preset.id === selectedPresetId ? 'is-selected' : ''}
                onClick={() => setSelectedPresetId(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <p>{selectedPreset.description}</p>

          <label>
            Frequência: {frequency} Hz
            <input type="range" min="80" max="900" step="10" value={frequency} onChange={(event) => setFrequency(Number(event.target.value))} />
          </label>
          <label>
            Volume: {volume}%
            <input type="range" min="0" max="100" step="1" value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
          </label>
          <label>
            Release: {release.toFixed(2)} s
            <input type="range" min="0.04" max="0.40" step="0.01" value={release} onChange={(event) => setRelease(Number(event.target.value))} />
          </label>

          <button type="button" className="zzfx-experimental__play" onClick={() => playEffect()}>
            Tocar versão ajustada
          </button>
          <button type="button" onClick={() => playEffect(selectedPreset, selectedPreset.parameters)}>
            Comparar configuração original
          </button>

          <pre>{JSON.stringify(adjustedParameters, null, 2)}</pre>
        </div>

        <div className="zzfx-experimental__panel">
          <h2>Música ZzFXM</h2>
          <p>Sequência curta, 110 BPM, produzida em amostras e entregue ao gerenciador como <code>AudioBufferSourceNode</code>.</p>
          <button type="button" className="zzfx-experimental__play" onClick={playMusic}>Tocar ZzFXM</button>
          <button type="button" onClick={() => { audio.stopMusic({ fadeMs: 180 }); setLastResult('ZzFXM: interrompida') }}>Parar ZzFXM</button>
        </div>

        <div className="zzfx-experimental__panel">
          <h2>Controles existentes</h2>
          <label>
            Efeitos: {audio.effectsVolume}%
            <input type="range" min="0" max="100" value={audio.effectsVolume} onChange={(event) => audio.setEffectsVolume(Number(event.target.value))} />
          </label>
          <label>
            Música: {audio.musicVolume}%
            <input type="range" min="0" max="100" value={audio.musicVolume} onChange={(event) => audio.setMusicVolume(Number(event.target.value))} />
          </label>
          <button type="button" onClick={() => audio.toggleMute()}>
            {audio.muted ? 'Desmutar' : 'Mutar'}
          </button>
          <button type="button" onClick={async () => setLastResult(JSON.stringify(await audio.unlock()))}>Desbloquear áudio</button>
        </div>
      </section>

      <section className="zzfx-experimental__instructions">
        <h2>Sequência de avaliação auditiva</h2>
        <ol>
          <li>Abra esta página em modo de desenvolvimento.</li>
          <li>Teste Ataque, Dano e Coleta; repita e compare os parâmetros ajustados.</li>
          <li>Teste Interface e o contorno sonoro das ações.</li>
          <li>Ajuste frequência, volume e release; use os controles de mute e volumes existentes.</li>
          <li>Inicie a música ZzFXM, troque para outra ação e pare com fade.</li>
          <li>Registre sua percepção em uma issue separada: adequação, clareza, contraste e manutenção.</li>
        </ol>
      </section>
    </main>
  )
}
