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

- `waveform?: "sawtooth" | "sine" | "square" | "triangle" | PeriodicWaveOptions`

  Specify what shape of waveform the oscillator will output. See also [here](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode/type).

  If you wish to use instrument sounds, you can use [`@mohayonao/wave-tables`](https://npmjs.com/package/@mohayonao/wave-tables).

- `gain?: number`

  Specify the global volume of the audio. Defaults to `1`.

- `simulation?: 'idiophone' | 'aerophone'`

  Simulate the effect of an instrument. Currently supports `'idiophone'` or `'aerophone'`.

- `context?: AudioContext`

  By default, `play` will create an `AudioContext` instance automatically. However, it is also possible to make multiple scores play in the same context by specifying `context`. This is useful for playing multiple tracks at the same time.

- `signal?: AbortSignal`

  This allows you to abort it if desired via an [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

## Syntax

A CroonJS score consists of a number of notations, which can be separated by **any blank character**. The syntax supported by CroonJS is generally the same as that of the numbered musical notation, but with some improvements for ease of input.

Full examples can be found in [Examples](./examples/).

### Notes

#### Note notation

As with the numbered musical notation, the numbers 1 through 7 are used to represent [quarter notes](https://en.wikipedia.org/wiki/Quarter_note). By default `1` means C4 and `7` means B4.

In particular, the number `0` is used to indicate a musical rest, representing a quarter note stop.

```
1 1 5 5 6 6 5 0
```

You can also use `do`, `re`, `mi`, `fa`, `sol`, `la`, `ti` instead of `1` to `7` respectively. `so` and `si` are also supported as dialects of `sol` and `ti`.

#### Octaves and accidentals

Add `+` or `-` to raise or lower a note to other octaves. If you need to raise or lower multiple octaves, you can use it as `1++` or `1--`.

```
1- 1 3 1 4 1 3 1
```

Add `#` or `b` before the note to raise or lower the pitch. This allows you to declare a scale similar to the black keys of a piano.

```
6+ 5+ #4+ 5+
```

#### Note length

Add an underscore `_` after a note to halve its length. For example, `1_` means an eighth note and `1__` means a sixteenth note.

Add a dot `.` to increase its length by half, two dots by three-quarters, and so on.

**The underscore should always be noted before the dot sign**.

```
4 4 3 3 2 2_. 3__ 1 1
```

#### Inter-note relations

Use `-` to indicate that the previous note is extended by one quarter note. More than one can also be used in succession, but they need to be notated as multiple notes.

```
1 1 5 5 6 6 5 - 4 4 3 3 2 2 1 - - -
```

`^` could be added at the start of the note to indicate that it does not need to be preceded by the previous note, and is usually used to indicate a single note across the beat.

`&` could be added at the end of the note to indicate the preceding leaning note, which takes up a quarter of a beat of the following note.

```
7_ 1+_ #5_ 6_ ^6 2+& 3+
```

### Bar lines

Use `|` as a bar separator. Use `||` as a terminator for the score.

Bar separators and terminators **are semantically meaningful only**.

```
1 1 | 5 5 | 6 6 | 5 - | 4 4 | 3 3 | 2 2 | 1 - ||
```

The use of `||:` indicates the start of a repeated section of the score, and `:||` indicates a return to the previous repetition point. If there are certain bars in the repeated section that you only want to play on the nth repetition, you can use the `[n.` notation, which will continue until the next `:||` notation.

You can also leave out the `||:` notation, which defaults back to the beginning of the score.

```
1 1 | 5 5 | 6 6 | 5 - | 4 4 | 3 3 | 2 2 | 1 - | [1. 5 5 5 | 4 4 | 3 3 | 2 - | 5 5 | 4 4 | 3 3 | 2 - :||
```

### Key signature, time signature and tempo

The key signature, time signature and tempo notations will take effect for everything after them.

#### Key signature

CroonJS supports [Movable Do](https://en.wikipedia.org/wiki/Solf%C3%A8ge#Variations), which means you can define a tune using the form `1=C`. `1=C` means that `1` in the score is equivalent to C4, which is the key of C major. You can also use a notation like `2=D`, which is obviously equivalent to `1=C`.

If you want to use a minor, you can add the `#` or `b` character before the letter after the equal sign, similar to accidentals.

```
1=bB
```

The default key signature is `1=C`.

#### Time signature

The time signature is written as a fraction, e.g. `2/4`, which means one beat in quarters and two beats per measure.

```
2/4
```

The default time signature is `4/4`.

#### Tempo

You can define the tempo of the score with the `!` command, followed by a number indicating how many beats per minute.

```
!120
```

The default tempo is `!60`.
