import type { DigitizedNotation } from './digitizer.js'
import { digitize } from './digitizer.js'
import type { ParsedNotation } from './parser.js'

interface AudioOptions {
  waveform?: OscillatorType,
  gain?: number,
}

function generateAudioNodes(
  context: AudioContext,
  notation: DigitizedNotation,
  options?: AudioOptions
): {
  source: AudioScheduledSourceNode,
  destination: AudioNode,
  duration: number,
} {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  if (options?.waveform) {
    oscillator.type = options.waveform
  }
  const baseGain = options?.gain
  if (baseGain) {
    gain.gain.value = baseGain
  }
  const initialTime = context.currentTime
  for (const node of notation.nodes) {
    switch (node.type) {
      case 'FrequencyNode':
        oscillator.frequency.setValueAtTime(node.value, initialTime + node.time)
        break
      case 'BreakNode':
        gain.gain.setValueAtTime(0, node.time)
        gain.gain.exponentialRampToValueAtTime(baseGain ?? 1, initialTime + node.time + node.base / 64)
        break
    }
  }
  oscillator.connect(gain)
  return {
    source: oscillator,
    destination: gain,
    duration: notation.duration,
  }
}

export interface PlayOptions extends AudioOptions {
  context?: AudioContext,
  signal?: AbortSignal,
}

class AbortError extends Error {
  constructor() {
    super('The operation was aborted.')
  }
}

export function play(notation: string | ParsedNotation | DigitizedNotation, options?: PlayOptions) {
  if (typeof notation === 'string' || notation.type === 'ParsedNotation') {
    notation = digitize(notation)
  }
  const context = options?.context ?? new AudioContext()
  const { source, destination, duration } = generateAudioNodes(context, notation, options)
  return new Promise((resolve, reject) => {
    if (options?.signal) {
      options.signal.addEventListener('abort', () => {
        source.stop()
        reject(new AbortError())
      })
    }
    destination.connect(context.destination)
    source.start()
    source.stop(duration)
    source.addEventListener('ended', () => {
      resolve(undefined)
    })
  })
}
