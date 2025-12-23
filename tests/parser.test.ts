import { describe, expect, it } from 'vitest'
import { parse } from '../src'

describe('parse', () => {

  it('should parse notations correctly', () => {
    const score = `
1=bB 4/4 !97
6+_ 5+_ 3+_ 2+_ ^2+_ 3+_ 2+_ 3+_ | 6_ 1+_ 2+_ 3+_ ^3+. 0_ | 6+_ 5+_ 3+_ 2+_ ^2+_ 3+_ 2+_ 3+_ | 6_ 1+_ 2+_ 3+_ ^3+_ 0 0_ ||
`
    const parsed = parse(score)
    expect(parsed).toMatchSnapshot()
  })

})

describe('stringify', () => {

  it('should stringify notations correctly', () => {
    // ...
  })

})
