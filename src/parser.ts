export interface Position {
  line: number,
  column: number,
}

export interface BaseParsedNode {
  type: string,
  raw: string,
  range: [number, number],
  loc: {
    start: Position,
    end: Position,
  },
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
  dot: number,
  half: number,
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

function getPosition(source: string, index: number): Position {
  const prefix = source.slice(0, index)
  const breakIndexes = Array.from(prefix)
    .map((item, itemIndex) => (item === '\n' ? itemIndex : -1))
    .filter(itemIndex => itemIndex !== -1)
  const lastBreakIndex = breakIndexes[breakIndexes.length - 1] ?? -1
  return {
    line: breakIndexes.length + 1,
    column: (index - lastBreakIndex) + 1,
  }
}

function parseToken(token: string, index: number, source: string): ParsedNode {
  const range: BaseParsedNode['range'] = [index, index + token.length]
  const loc: BaseParsedNode['loc'] = {
    start: getPosition(source, index),
    end: getPosition(source, index + token.length),
  }
  const tempoMatches = token.match(/^!(\d+)$/)
  if (tempoMatches) {
    return {
      type: 'TempoNode',
      range,
      loc,
      raw: token,
      beat: Number(tempoMatches[1]),
    }
  }
  const keySignatureMatches = token.match(/^([1-7])=([#b])?([A-G])$/)
  if (keySignatureMatches) {
    return {
      type: 'KeySignatureNode',
      range,
      loc,
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
      loc,
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
      loc,
      raw: token,
      continuation: Boolean(noteMatches[1]),
      accidental: noteMatches[2] === '#' ? 1 : (
        noteMatches[2] === 'b' ? -1 : 0
      ),
      notation: transformNoteNotation(noteMatches[3]),
      octave: noteMatches[4].startsWith('+') ? noteMatches[4].length : (
        noteMatches[4].startsWith('-') ? -noteMatches[4].length : 0
      ),
      dot: dotCount,
      half: underlineCount,
      leaning: Boolean(noteMatches[6]),
    }
  }
  if (token === '-') {
    return {
      type: 'DashNode',
      range,
      loc,
      raw: token,
    }
  }
  const barLineMatches = token.match(/^(?:(\|{1,2})|(\|{2}:)|(:\|{2}))$/)
  if (barLineMatches) {
    return {
      type: 'BarLineNode',
      range,
      loc,
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
      loc,
      raw: token,
      except: Number(fineMatches[1]),
    }
  }
  return {
    type: 'UnknownNode',
    range,
    loc,
    raw: token,
  }
}

export function parse(notation: string): ParsedNotation {
  const nodes: ParsedNode[] = []
  let matches: RegExpExecArray | null
  const matcher = /\S+/g
  // eslint-disable-next-line no-cond-assign
  while (matches = matcher.exec(notation)) {
    nodes.push(parseToken(matches[0], matches.index, notation))
  }
  return {
    type: 'ParsedNotation',
    nodes,
  }
}

export type Serializable<T extends BaseParsedNode> =
  Omit<T, 'range' | 'loc'>
  & Partial<Pick<T, 'range' | 'loc'>>

export type SerializableParsedNode =
  Serializable<TempoNode>
  | Serializable<KeySignatureNode>
  | Serializable<TimeSignatureNode>
  | Serializable<NoteNode>
  | Serializable<DashNode>
  | Serializable<BarLineNode>
  | Serializable<FineNode>
  | Serializable<UnknownNode>

export type SerializableParsedNotation = Omit<ParsedNotation, 'nodes'> & {
  nodes: SerializableParsedNode[],
}

function stringifyNode(node: SerializableParsedNode) {
  switch (node.type) {
    case 'TempoNode':
      return `!${node.beat}`
    case 'KeySignatureNode':
      return `${
        node.tonic
      }=${
        node.accidental === -1 ? 'b' : (node.accidental === 1 ? '#' : '')
      }${node.pitch}`
    case 'TimeSignatureNode':
      return `${node.beat}/${node.unit}`
    case 'NoteNode':
      return `${
        node.continuation ? '^' : ''
      }${
        node.notation
      }${
        node.octave > 0 ? '+'.repeat(node.octave) : (node.octave < 0 ? '-'.repeat(-node.octave) : '')
      }${
        '_'.repeat(node.half)
      }${
        '.'.repeat(node.dot)
      }${
        node.accidental === -1 ? 'b' : (node.accidental === 1 ? '#' : '')
      }${
        node.leaning ? '&' : ''
      }`
    case 'DashNode':
      return '-'
    case 'BarLineNode':
      return `${
        node.repeat === 1 ? ':' : ''
      }|${
        node.end || node.repeat ? '|' : ''
      }${
        node.repeat === -1 ? ':' : ''
      }`
    case 'FineNode':
      return `[${node.except}.`
    case 'UnknownNode':
      return node.raw
    default:
      break
  }
}

export function stringify(notation: SerializableParsedNotation): string {
  let result = ''
  let lastPosition: Position | undefined
  for (const node of notation.nodes) {
    if (lastPosition) {
      if (node.loc && node.loc.start.line > lastPosition.line) {
        result += '\n'
      } else {
        result += ' '
      }
    }
    lastPosition = node.loc ? node.loc.end : { line: 1, column: 1 }
    result += stringifyNode(node)
  }
  return result
}
