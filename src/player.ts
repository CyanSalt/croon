import type { DigitizedNotation } from './digitizer.js'
import { digitize } from './digitizer.js'
import type { ParsedNotation } from './parser.js'

interface AudioOptions {
  type?: OscillatorType,
  volume?: number,
}

function generateAudioNodes(context: AudioContext, notation: DigitizedNotation, options?: AudioOptions) {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  if (options?.type) {
    oscillator.type = options.type
  }
  const volume = options?.volume
  if (volume) {
    gain.gain.value = volume
  }
  const initialTime = context.currentTime
  for (const node of notation.nodes) {
    switch (node.kind) {
      case 'Frequency':
        oscillator.frequency.setValueAtTime(node.value, initialTime + node.time)
        break
      case 'Break':
        gain.gain.setValueAtTime(0, node.time)
        gain.gain.exponentialRampToValueAtTime(volume ?? 1, initialTime + node.time + node.post / 16)
        break
    }
  }
  oscillator.connect(gain)
  return {
    oscillator,
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
  if (typeof notation === 'string' || notation.kind === 'Parsed') {
    notation = digitize(notation)
  }
  const context = options?.context ?? new AudioContext()
  const { oscillator, destination, duration } = generateAudioNodes(context, notation, options)
  return new Promise((resolve, reject) => {
    if (options?.signal) {
      options.signal.addEventListener('abort', () => {
        oscillator.stop()
        reject(new AbortError())
      })
    }
    destination.connect(context.destination)
    oscillator.start()
    oscillator.stop(duration)
    oscillator.addEventListener('ended', () => {
      resolve(undefined)
    })
  })
}
