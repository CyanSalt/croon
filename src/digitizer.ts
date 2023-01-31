import type { ParsedNotation } from './parser.js'
import { parse } from './parser.js'

const CODE_C = 'C'.charCodeAt(0)
const MIDDLE_C_NUMBER = 40

function getPianoKeyFrequency(number: number) {
  return 2 ** ((number - 49) / 12) * 440
}

export interface FrequencyNode {
  type: 'FrequencyNode',
  value: number,
  time: number,
}

export interface BreakNode {
  type: 'BreakNode',
  base: number,
  time: number,
}

export type DigitizedNode = FrequencyNode | BreakNode

export interface DigitizedNotation {
  type: 'DigitizedNotation',
  nodes: DigitizedNode[],
  duration: number,
}

export function digitize(notation: string | ParsedNotation): DigitizedNotation {
  if (typeof notation === 'string') {
    notation = parse(notation)
  }
  const nodes: DigitizedNode[] = []
  let currentTime = 0
  /** Seconds per beat */
  let currentDuration = 1
  let currentKeyNumber = 40
  let currentUnit = 4
  let hasLeaning = false
  let currentRepeatingFrom = 0
  let currentRepeating = 1
  let currentFineExcept = 0
  for (let index = 0, length = notation.nodes.length; index < length; index += 1) {
    const node = notation.nodes[index]
    if (
      currentFineExcept && currentFineExcept !== currentRepeating
      && !(node.type === 'BarLineNode' && node.repeat === 1)
    ) continue
    switch (node.type) {
      case 'TempoNode':
        currentDuration = 60 / node.beat
        break
      case 'KeySignatureNode': {
        const pitchCode = node.pitch.toUpperCase().charCodeAt(0)
        currentKeyNumber = pitchCode + (pitchCode < CODE_C ? 12 : 0) - CODE_C
          + MIDDLE_C_NUMBER
          + node.accidental
        break
      }
      case 'TimeSignatureNode':
        currentUnit = node.unit
        break
      case 'NoteNode': {
        const frequency = node.notation === 0 ? 0 : getPianoKeyFrequency(
          currentKeyNumber
          + node.accidental
          + 2 * node.notation - (node.notation < 4 ? 1 : 2)
          + 12 * node.octave,
        )
        const actualDuration = node.length * currentDuration * 4 / currentUnit
        const leaningDuration = hasLeaning ? currentDuration / 4 : 0
        nodes.push({
          type: 'FrequencyNode',
          value: frequency,
          time: currentTime + leaningDuration,
        })
        if (!node.continuation && !hasLeaning && node.notation) {
          nodes.push({
            type: 'BreakNode',
            base: currentDuration,
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
      case 'DashNode': {
        const actualDuration = currentDuration * 4 / currentUnit
        currentTime += actualDuration
        break
      }
      case 'BarLineNode':
        if (node.repeat === -1) {
          currentRepeatingFrom = index
        } else if (node.repeat === 1) {
          // TODO: multiple repeating
          if (currentRepeating <= 1) {
            index = currentRepeatingFrom
            currentRepeating += 1
            currentFineExcept = 0
          } else {
            currentRepeatingFrom = 0
            currentRepeating = 1
            currentFineExcept = 0
          }
        }
        break
      case 'FineNode':
        currentFineExcept = node.except
        break
      default:
        // ignore
    }
  }
  nodes.push({
    type: 'BreakNode',
    base: currentDuration,
    time: currentTime,
  })
  return {
    type: 'DigitizedNotation',
    nodes,
    duration: currentTime,
  }
}
