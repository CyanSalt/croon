import { describe, expect, it } from 'vitest'
import type { SerializableParsedNode, SerializableParsedNotation } from '../src'
import { divide, parse, stringify } from '../src'
import notation from './fixtures/notation.json' with { type: 'json' }
import score from './fixtures/score.txt?raw'

describe('parse', () => {

  it('should parse score correctly', () => {
    const parsed = parse(score)
    expect(parsed).toEqual(notation)
  })

})

describe('stringify', () => {

  it('should stringify notations correctly', () => {
    const stringified = stringify(notation as SerializableParsedNotation)
    expect(stringified).toEqual(score.trim())
  })

  it('should stringify even no loc provided', () => {
    const stringified = stringify({
      ...notation,
      nodes: notation.nodes.map(({ loc, ...node }) => node),
    } as SerializableParsedNotation)
    expect(stringified.split(/\s+/)).toEqual(score.trim().split(/\s+/))
  })

  it('should stringify to pretty format', () => {
    const stringified = stringify({
      ...notation,
      nodes: notation.nodes.map(({ loc, range, ...node }) => node),
    } as SerializableParsedNotation, {
      pretty: true,
    })
    expect(stringified).toEqual(score)
  })

})

describe('divide', () => {

  it('should divide notations correctly', () => {
    const nodes = notation.nodes.map(({ loc, range, ...node }) => node) as SerializableParsedNode[]
    const divided = divide(nodes)
    expect(divided).toEqual(nodes)
  })

})
