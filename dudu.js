(function() {

var context = new AudioContext();

var notes = {
	// low
	'do-': 262, 'do-#': 277, 're-': 294, 're-#': 311, 'mi-': 330, 'fa-': 349,
	'fa-#': 370, 'so-': 392, 'so-#': 415, 'la-': 440, 'la-#': 466, 'si-': 494,
	// mid
	'do': 523, 'do#': 554, 're': 578, 're#': 622, 'mi': 659, 'fa': 698,
	'fa#': 740, 'so': 784, 'so#': 831, 'la': 880, 'la#': 932, 'si': 988,
	// high
	'do+': 1046, 'do+#': 1109, 're+': 1175, 're+#': 1245, 'mi+': 1318, 'fa+': 1397,
	'fa+#': 1480, 'so+': 1568, 'so+#': 1661, 'la+': 1760, 'la+#': 1865, 'si+': 1976
}
var keybinding = {
	w: 'do+', W: 'do+#', e: 're+', E: 're+#', r: 'mi+', t: 'fa+',
	T: 'fa+#', y: 'so+', Y: 'so+#', u: 'la+', U: 'la+#', i: 'si+',
	s: 'do', S: 'do#', d: 're', D: 're#', f: 'mi', g: 'fa',
	G: 'fa#', h: 'so', H: 'so#', j: 'la', J: 'la#', k: 'si',
	z: 'do-', Z: 'do-#', x: 're-', X: 're-#', c: 'mi-', v: 'fa-',
	V: 'fa-#', b: 'so-', B: 'so-#', n: 'la-', N: 'la-#', m: 'si-'
}
var noteReg = /^([a-z#0\+\-]+)((:([\d\.]+))|_|~)?$/;
var timer, playing;

var playNotes = function(segment, current) {
	if (current >= segment.length) return;
	var rhythm = dudu.rhythm,
		breath = dudu.breath,
		type = dudu.type;
	var slices = segment[current].match(noteReg);
	var note = slices[1];
	var rate = 0;
	switch (slices[2]) {
		case undefined: break;
		case '~': rate = 2; break;
		case '_': rate = 0.5; break;
		case '.': rate = 1.5; break;
		default: rate = slices[4]; break;
	}
	if (rate) rhythm = rate * (rhythm + breath) - breath;
	var osc = context.createOscillator();
	osc.type = type;
	if (typeof notes[note] != 'undefined')  {
		osc.frequency.value = notes[note];
		osc.start();
		osc.connect(context.destination);
		playing = osc;
	}
	timer = setTimeout(function(){
		osc.disconnect();
		setTimeout(function() {
			timer = playNotes(segment, current + 1);
		}, breath);
	}, rhythm);
	return timer;
}

var dudu = {
	rhythm: 300,
	breath: 30,
	type: 'square',
	melody: {},
	clock: 0,
	keyboard: function() {
		var oscillators = {};
		for (var key in keybinding) {
			var freq = notes[keybinding[key]];
			var osc = context.createOscillator();
			osc.frequency.value = freq;
			osc.type = this.type;
			osc.start();
			oscillators[key] = osc;
		}
		var osc = null; // clouser variable
		window.addEventListener('keydown', function(e) {
			var code = String.fromCharCode(e.keyCode);
			if (!e.shiftKey) code = code.toLowerCase();
			osc = oscillators[code];
			osc && osc.connect(context.destination);
		})
		window.addEventListener('keyup', function(e) {
			var code = String.fromCharCode(e.keyCode);
			if (!e.shiftKey) code = code.toLowerCase();
			osc = oscillators[code];
			osc && osc.disconnect();
		})
	},
	croon: function() {
		var song = Array.prototype.join.call(arguments, ' ').split(' ');
		playNotes(song, 0);
	},
	write: function(title, rhythm) {
		var args = Array.prototype.slice.call(arguments, 2);
		this.melody[title] = {
			rhythm: rhythm,
			music: args.join('')
		}
	},
	sing: function(title) {
		var melody = this.melody[title];
		if (!melody) return;
		this.rest();
		this.rhythm = melody.rhythm;
		this.croon(melody.music);
	},
	rest: function() {
		timer && clearTimeout(timer);
		playing && playing.disconnect();
	}
}

window.dudu = dudu;

})()
