import type { Notation } from './parser.js'
import { parse } from './parser.js'

const CODE_C = 'C'.charCodeAt(0)
const MIDDLE_C_NUMBER = 40

function getPianoKeyFrequency(number: number) {
  return 2 ** ((number - 49) / 12) * 440
}

interface AudioOptions {
  type?: OscillatorType,
  volume?: number,
}

function generateAudioNodes(context: AudioContext, notation: Notation, options?: AudioOptions) {
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
  let currentTime = initialTime
  let currentDuration = 1
  let currentKeyNumber = 40
  let currentUnit = 4
  let hasLeaning = false
  for (const node of notation.nodes) {
    switch (node.kind) {
      case 'Tempo':
        currentDuration = 60 / node.beat
        break
      case 'KeySignature': {
        const pitchCode = node.pitch.toUpperCase().charCodeAt(0)
        currentKeyNumber = pitchCode + (pitchCode < CODE_C ? 12 : 0) - CODE_C
          + MIDDLE_C_NUMBER
          + node.accidental
        break
      }
      case 'TimeSignature':
        currentUnit = node.unit
        break
      case 'Note': {
        const frequency = node.notation === 0 ? 0 : getPianoKeyFrequency(
          currentKeyNumber
          + node.accidental
          + 2 * node.notation - (node.notation < 4 ? 1 : 2)
          + 12 * node.octave,
        )
        const actualDuration = node.length * currentDuration * 4 / currentUnit
        const leaningDuration = hasLeaning ? actualDuration / 4 : 0
        oscillator.frequency.setValueAtTime(frequency, currentTime + leaningDuration)
        const breathDuration = actualDuration / 16
        if (!node.continuation && !hasLeaning && node.notation) {
          gain.gain.setValueAtTime(0, currentTime)
          gain.gain.exponentialRampToValueAtTime(volume ?? 1, currentTime + breathDuration)
        }
        if (hasLeaning) {
          hasLeaning = false
        }
        if (node.leaning) {
          hasLeaning = true
        } else {
          currentTime += actualDuration
        }
        break
      }
      case 'Dash': {
        const actualDuration = currentDuration * 4 / currentUnit
        currentTime += actualDuration
        break
      }
      default:
        // ignore
    }
  }
  oscillator.connect(gain)
  return { oscillator, gain, duration: currentTime }
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

export function play(notation: string | Notation, options?: PlayOptions) {
  if (typeof notation === 'string') {
    notation = parse(notation)
  }
  const context = options?.context ?? new AudioContext()
  const { oscillator, gain, duration } = generateAudioNodes(context, notation, options)
  return new Promise((resolve, reject) => {
    if (options?.signal) {
      options.signal.addEventListener('abort', () => {
        oscillator.stop()
        reject(new AbortError())
      })
    }
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(duration)
    oscillator.addEventListener('ended', () => {
      resolve(undefined)
    })
  })
}
