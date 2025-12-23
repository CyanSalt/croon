import { describe, expect, it } from 'vitest'
import type { SerializableParsedNode, SerializableParsedNotation } from '../src'
import { divide, parse, stringify } from '../src'
import parsedNotation from './fixtures/parsed-notation.json' with { type: 'json' }
import score from './fixtures/score.txt?raw'

describe('parse', () => {

  it('should parse score correctly', () => {
    const parsed = parse(score)
    expect(parsed).toEqual(parsedNotation)
  })

})

describe('stringify', () => {

  it('should stringify notations correctly', () => {
    const stringified = stringify(parsedNotation as SerializableParsedNotation)
    expect(stringified).toEqual(score.trim())
  })

  it('should stringify even no loc provided', () => {
    const stringified = stringify({
      ...parsedNotation,
      nodes: parsedNotation.nodes.map(({ loc, ...node }) => node),
    } as SerializableParsedNotation)
    expect(stringified.split(/\s+/)).toEqual(score.trim().split(/\s+/))
  })

  it('should stringify to pretty format', () => {
    const stringified = stringify({
      ...parsedNotation,
      nodes: parsedNotation.nodes
        .filter(node => node.type !== 'DividerNode')
        .map(({ loc, range, ...node }) => node),
    } as SerializableParsedNotation, {
      pretty: true,
    })
    expect(stringified).toEqual(score)
  })

})

describe('divide', () => {

  it('should divide notations correctly', () => {
    const nodes = parsedNotation.nodes.map(({ loc, range, ...node }) => node) as SerializableParsedNode[]
    const divided = divide(nodes)
    expect(divided).toEqual(nodes)
  })

})
