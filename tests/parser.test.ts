import { describe, expect, it } from 'vitest'
import type { SerializableParsedNotation } from '../src'
import { parse, stringify } from '../src'
import notation from './fixtures/notation.json' with { type: 'json' }
import score from './fixtures/score.txt?raw'

describe('parse', () => {

  it('should parse notations correctly', () => {
    const parsed = parse(score)
    expect(parsed).toEqual(notation)
  })

})

describe('stringify', () => {

  it('should stringify notations correctly', () => {
    const stringified = stringify(notation as SerializableParsedNotation)
    expect(stringified).toEqual(score.trim())
  })

})
