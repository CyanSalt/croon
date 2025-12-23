import { describe, expect, it } from 'vitest'
import type { ParsedNode, ParsedNotation } from '../src'
import { divide, parse, stringify, validate } from '../src'
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
    const stringified = stringify(parsedNotation as ParsedNotation)
    expect(stringified).toEqual(score.trim())
  })

  it('should stringify even no loc provided', () => {
    const stringified = stringify({
      ...parsedNotation,
      nodes: parsedNotation.nodes.map(({ loc, ...node }) => node),
    } as ParsedNotation)
    expect(stringified.split(/\s+/)).toEqual(score.trim().split(/\s+/))
  })

  it('should stringify to pretty format', () => {
    const stringified = stringify({
      ...parsedNotation,
      nodes: parsedNotation.nodes
        .filter(node => node.type !== 'DividerNode')
        .map(({ loc, range, ...node }) => node),
    } as ParsedNotation, {
      pretty: true,
    })
    expect(stringified).toEqual(score)
  })

})

describe('validate', () => {

  it('should validate notations correctly', () => {
    expect(() => validate(parsedNotation as ParsedNotation)).not.toThrow()
    expect(() => validate({
      ...parsedNotation,
      nodes: [...parsedNotation.nodes, { type: 'NoteLengthenNode' }],
    } as ParsedNotation)).toThrow()
  })

  it('should also be able to validate score', () => {
    expect(() => validate(score)).not.toThrow()
  })

})

describe('divide', () => {

  it('should divide notations correctly', () => {
    const nodes = parsedNotation.nodes.map(({ loc, range, ...node }) => node) as ParsedNode[]
    const divided = divide(nodes)
    expect(divided).toEqual(nodes)
    expect(() => validate({
      ...parsedNotation,
      nodes: divided,
    } as ParsedNotation)).not.toThrow()
  })

})
