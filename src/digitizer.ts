import type { ParsedNotation } from './parser.js'
import { parse } from './parser.js'

const CODE_C = 'C'.charCodeAt(0)
const MIDDLE_C_NUMBER = 40

function getPianoKeyFrequency(number: number) {
  return 2 ** ((number - 49) / 12) * 440
}

export interface FrequencyNode {
  kind: 'Frequency',
  value: number,
  time: number,
}

export interface BreakNode {
  kind: 'Break',
  post: number,
  time: number,
}

export type DigitizedNode = FrequencyNode | BreakNode

export interface DigitizedNotation {
  kind: 'Digitized',
  nodes: DigitizedNode[],
  duration: number,
}

export function digitize(notation: string | ParsedNotation): DigitizedNotation {
  if (typeof notation === 'string') {
    notation = parse(notation)
  }
  const nodes: DigitizedNode[] = []
  let currentTime = 0
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
        nodes.push({
          kind: 'Frequency',
          value: frequency,
          time: currentTime + leaningDuration,
        })
        if (!node.continuation && !hasLeaning && node.notation) {
          nodes.push({
            kind: 'Break',
            post: actualDuration,
            time: currentTime,
          })
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
  return {
    kind: 'Digitized',
    nodes,
    duration: currentTime,
  }
}
