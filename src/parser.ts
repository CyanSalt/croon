export interface BaseParsedNode {
  type: string;
  raw: string,
  range: [number, number],
}

export interface TempoNode extends BaseParsedNode {
  type: 'TempoNode',
  /** Beats per minute */
  beat: number,
}

export interface KeySignatureNode extends BaseParsedNode {
  type: 'KeySignatureNode',
  tonic: number,
  accidental: 0 | 1 | -1,
  pitch: string,
}

export interface TimeSignatureNode extends BaseParsedNode {
  type: 'TimeSignatureNode',
  /** Beats per measure */
  beat: number,
  /** Beats per note */
  unit: number,
}

export interface NoteNode extends BaseParsedNode {
  type: 'NoteNode',
  continuation: boolean,
  accidental: 0 | 1 | -1,
  notation: number,
  octave: number,
  length: number,
  leaning: boolean,
}

export interface DashNode extends BaseParsedNode {
  type: 'DashNode',
}

export interface BarLineNode extends BaseParsedNode {
  type: 'BarLineNode',
  end: boolean,
  repeat: 0 | 1 | -1,
}

export interface FineNode extends BaseParsedNode {
  type: 'FineNode',
  except: number,
}

export interface UnknownNode extends BaseParsedNode {
  type: 'UnknownNode',
}

export type ParsedNode =
  TempoNode
  | KeySignatureNode
  | TimeSignatureNode
  | NoteNode
  | DashNode
  | BarLineNode
  | FineNode
  | UnknownNode

export interface ParsedNotation {
  type: 'ParsedNotation',
  nodes: ParsedNode[],
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

function parseToken(token: string, index: number): ParsedNode {
  const range: [number, number] = [index, index + token.length]
  const tempoMatches = token.match(/^!(\d+)$/)
  if (tempoMatches) {
    return {
      type: 'TempoNode',
      range,
      raw: token,
      beat: Number(tempoMatches[1]),
    }
  }
  const keySignatureMatches = token.match(/^([1-7])=([#b])?([A-G])$/)
  if (keySignatureMatches) {
    return {
      type: 'KeySignatureNode',
      range,
      raw: token,
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
      type: 'TimeSignatureNode',
      range,
      raw: token,
      beat: Number(timeSignatureMatches[1]),
      unit: Number(timeSignatureMatches[2]),
    }
  }
  const noteMatches = token.match(/^(\^)?([#b])?([A-Za-z]+|[0-7])(\+*|-*)(_*\.*)(&)?$/)
  if (noteMatches) {
    const dotIndex = noteMatches[5].indexOf('.')
    const dotCount = dotIndex === -1 ? 0 : noteMatches[5].length - dotIndex
    const underlineCount = noteMatches[5].length - dotCount
    return {
      type: 'NoteNode',
      range,
      raw: token,
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
      type: 'DashNode',
      range,
      raw: token,
    }
  }
  const barLineMatches = token.match(/^(?:(\|{1,2})|(\|{2}:)|(:\|{2}))$/)
  if (barLineMatches) {
    return {
      type: 'BarLineNode',
      range,
      raw: token,
      end: Boolean(barLineMatches[1]) && token.length > 1,
      repeat: barLineMatches[2] ? -1 : (barLineMatches[3] ? 1 : 0),
    }
  }
  const fineMatches = token.match(/^\[(\d+)\.$/)
  if (fineMatches) {
    return {
      type: 'FineNode',
      range,
      raw: token,
      except: Number(fineMatches[1]),
    }
  }
  return {
    type: 'UnknownNode',
    range,
    raw: token,
  }
}

export function parse(notation: string): ParsedNotation {
  const nodes: ParsedNode[] = []
  let matches: RegExpExecArray | null
  const matcher = /\S+/g
  while (matches = matcher.exec(notation)) {
    nodes.push(parseToken(matches[0], matches.index))
  }
  return {
    type: 'ParsedNotation',
    nodes,
  }
}
