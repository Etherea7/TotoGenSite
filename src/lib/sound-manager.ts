type SoundName = 'ball-click' | 'drumroll' | 'celebration' | 'machine-hum'

interface SoundOptions {
  volume?: number
  loop?: boolean
}

class SoundManager {
  private audioContext: AudioContext | null = null
  private buffers: Map<SoundName, AudioBuffer> = new Map()
  private activeSources: Map<string, AudioBufferSourceNode> = new Map()
  private gainNode: GainNode | null = null
  private initialized = false
  private muted = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.muted = localStorage.getItem('toto-sound-muted') === 'true'
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized || typeof window === 'undefined') return

    try {
      this.audioContext = new AudioContext()
      this.gainNode = this.audioContext.createGain()
      this.gainNode.connect(this.audioContext.destination)
      this.gainNode.gain.value = this.muted ? 0 : 1

      // Pre-load all sounds
      const sounds: SoundName[] = ['ball-click', 'drumroll', 'celebration', 'machine-hum']
      await Promise.allSettled(
        sounds.map(async (name) => {
          try {
            const response = await fetch(`/sounds/${name}.mp3`)
            if (!response.ok) return
            const arrayBuffer = await response.arrayBuffer()
            const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
            this.buffers.set(name, audioBuffer)
          } catch {
            // Sound file not available - silently continue
          }
        })
      )

      this.initialized = true
    } catch {
      // Web Audio API not available
    }
  }

  play(name: SoundName, options?: SoundOptions): string | null {
    if (!this.initialized || !this.audioContext || !this.gainNode) return null

    const buffer = this.buffers.get(name)
    if (!buffer) return null

    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const source = this.audioContext.createBufferSource()
    source.buffer = buffer

    const sourceGain = this.audioContext.createGain()
    sourceGain.gain.value = options?.volume ?? 1
    source.connect(sourceGain)
    sourceGain.connect(this.gainNode)

    source.loop = options?.loop ?? false

    const id = `${name}-${Date.now()}`
    this.activeSources.set(id, source)

    source.onended = () => {
      this.activeSources.delete(id)
    }

    source.start()
    return id
  }

  stop(id: string): void {
    const source = this.activeSources.get(id)
    if (source) {
      try {
        source.stop()
      } catch {
        // Already stopped
      }
      this.activeSources.delete(id)
    }
  }

  stopAll(): void {
    for (const [id, source] of this.activeSources) {
      try {
        source.stop()
      } catch {
        // Already stopped
      }
      this.activeSources.delete(id)
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted

    if (this.gainNode) {
      this.gainNode.gain.value = this.muted ? 0 : 1
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('toto-sound-muted', String(this.muted))
    }

    return this.muted
  }

  isMuted(): boolean {
    return this.muted
  }
}

// Singleton
export const soundManager = new SoundManager()
