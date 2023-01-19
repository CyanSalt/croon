export interface TempoNode {
  kind: 'Tempo',
  beat: number,
}

export interface KeySignatureNode {
  kind: 'KeySignature',
  tonic: number,
  accidental: 0 | 1 | -1,
  pitch: string,
}

export interface TimeSignatureNode {
  kind: 'TimeSignature',
  /** Beats per measure */
  beat: number,
  /** Beats per note */
  unit: number,
}

export interface NoteNode {
  kind: 'Note',
  continuation: boolean,
  accidental: 0 | 1 | -1,
  notation: number,
  octave: number,
  length: number,
  leaning: boolean,
}

export interface DashNode {
  kind: 'Dash',
}

export interface BarLineNode {
  kind: 'BarLine',
}

export interface UnknownNode {
  kind: 'Unknown',
  raw: string,
}

export type Node = TempoNode | KeySignatureNode | TimeSignatureNode | NoteNode | DashNode | BarLineNode | UnknownNode

export interface Notation {
  nodes: Node[],
}

function transformNoteNotation(note: string): number {
  switch (note.toLowerCase()) {
    case '1':
    case 'do':
      return 1
    case '2':
    case 're':
      return 2
    case '3':
    case 'mi':
      return 3
    case '4':
    case 'fa':
      return 4
    case '5':
    case 'so':
    case 'sol':
      return 5
    case '6':
    case 'la':
      return 6
    case '7':
    case 'ti':
    case 'si':
      return 7
    default:
      return 0
  }
}

function parseToken(token: string): Node {
  const tempoMatches = token.match(/^!(\d+)$/)
  if (tempoMatches) {
    return {
      kind: 'Tempo',
      beat: Number(tempoMatches[1]),
    }
  }
  const keySignatureMatches = token.match(/^([1-7])=([#b])?([A-G])$/)
  if (keySignatureMatches) {
    return {
      kind: 'KeySignature',
      tonic: Number(keySignatureMatches[1]),
      accidental: keySignatureMatches[2] === '#' ? 1 : (
        keySignatureMatches[2] === 'b' ? -1 : 0
      ),
      pitch: keySignatureMatches[3],
    }
  }
  const timeSignatureMatches = token.match(/^(\d+)\/(\d+)$/)
  if (timeSignatureMatches) {
    return {
      kind: 'TimeSignature',
      beat: Number(timeSignatureMatches[1]),
      unit: Number(timeSignatureMatches[2]),
    }
  }
  const noteMatches = token.match(/^(\^)?([#b])?([A-Za-z]+|[0-7])(\+*|-*)(_*\.*)(&)?$/)
  if (noteMatches) {
    const dotCount = noteMatches[5].indexOf('.') + 1
    const underlineCount = noteMatches[5].length - dotCount
    return {
      kind: 'Note',
      continuation: Boolean(noteMatches[1]),
      accidental: noteMatches[2] === '#' ? 1 : (
        noteMatches[2] === 'b' ? -1 : 0
      ),
      notation: transformNoteNotation(noteMatches[3]),
      octave: noteMatches[4].startsWith('+') ? noteMatches[4].length : (
        noteMatches[4].startsWith('-') ? -noteMatches[4].length : 0
      ),
      length: (2 ** -underlineCount) * ((2 ** (dotCount + 1) - 1) / 2 ** dotCount),
      leaning: Boolean(noteMatches[6]),
    }
  }
  if (token === '-') {
    return {
      kind: 'Dash',
    }
  }
  if (token === '|') {
    return {
      kind: 'BarLine',
    }
  }
  return {
    kind: 'Unknown',
    raw: token,
  }
}

export function parse(score: string): Notation {
  const tokens = score.split(/\s+/).filter(Boolean)
  return {
    nodes: tokens.map(parseToken),
  }
}
