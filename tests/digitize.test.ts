import { describe, expect, it } from 'vitest'
import type { ParsedNotation } from '../src'
import { digitize } from '../src'
import digitizedNotation from './fixtures/digitized-notation.json' with { type: 'json' }
import parsedNotation from './fixtures/parsed-notation.json' with { type: 'json' }
import score from './fixtures/score.txt?raw'

describe('digitize', () => {

  it('should digitize score correctly', () => {
    const digitized = digitize(score)
    expect(digitized).toEqual(digitizedNotation)
  })

  it('should also be able to digitize notation', () => {
    const digitized = digitize(parsedNotation as ParsedNotation)
    expect(digitized).toEqual(digitizedNotation)
  })

})
