# CroonJS

CroonJS is a toolkit for parsing and playing [numbered musical notation](https://en.wikipedia.org/wiki/Numbered_musical_notation).

## Usage

```typescript
import { parse, play } from 'croonjs'

/** Parse notation */
const notation = `!120 | 1 1 5 5 | 6 6 5 - | 4 4 3 3 | 2 2 1 - |`
const parsedNotation = parse(notation)

/** Digitize notation */
const digitizedNotation = digitize(parsedNotation)
// Or
// const digitizedNotation = digitize(notation)

/** Play notation */
const playingPromise = play(digitizedNotation)
// Or
// const playingPromise = play(parsedNotation)
// const playingPromise = play(notation)
```

## Options

```typescript
function play(notation: string | ParsedNotation | DigitizedNotation, options?: PlayOptions): Promise<unknown>
```

`options` could have the following properties:

- `waveform?: "custom" | "sawtooth" | "sine" | "square" | "triangle"`

  Specify what shape of waveform the oscillator will output. See also [here](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode/type).

- `gain?: number`

  Specify the global volume of the audio. Defaults to `1`.

- `context?: AudioContext`

  By default, `play` will create an `AudioContext` instance automatically. However, it is also possible to make multiple scores play in the same context by specifying `context`. This is useful for playing multiple tracks at the same time.

- `signal?: AbortSignal`

  This allows you to abort it if desired via an [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).
