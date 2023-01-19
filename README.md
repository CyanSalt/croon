# CroonJS

CroonJS is a toolkit for parsing and playing [numbered musical notation](https://en.wikipedia.org/wiki/Numbered_musical_notation).

## Usage

```typescript
import { parse, play } from 'croonjs'

/** Parse notation */
const notationText = `!120 | 1 1 5 5 | 6 6 5 - | 4 4 3 3 | 2 2 1 - |`
const notation = parse(notationText)

/** Play notation */
play(notation)
// Or
play(notationText)
```
