# Croon

Croon is a Javascript component with HTML5 Audio library. 

### How to use it

```html
<script src="dudu.js"></script>
```

and then you can use the method of `window.dudu`.

### Methods and Properties

`.rhythm`

time of each note (unit: `ms`, default: `300`).

`.breath`

time of interval between notes (unit: `ms`, default: `30`).

`.type`

type of wave form (default: `square`, optional: `sine`, `square`).

`.keyboard()`

Use keyboard as a piano. `w-i` are in high pitch, `s-k` are in middle pitch, and `z-m` are in low pitch.

You can use Shift+Letter to play a sharp note.

`.croon(string song1, [string song2, ...])`

Play a melody from one or several strings.

`.write(string name, string song1, [string song2, ...])`

Save one or several strings as a melody.

`.sing(string melody)`

Play a melody.

`.rest()`

Stop any playing (except the voice of keyboard).

### Melody Syntax

Use notes: `do`, `re`, `mi`, `fa`, `so`, `la`, `si`

`+`, `-` represent notes in high or low pitch.

`#` represent a sharp note.

`_`, `.`, `~` represent a note that lasts 0.5, 1.5 or 2 `rhythm`. You can also use `:1.25` to custom the length.

You can see more demo in `melody.js`.
