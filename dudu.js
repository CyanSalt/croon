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
var regex = /^([a-z#0\+\-]+)((?:\:([\d\.]+))|=|_|\.|~)?(\^)?$/;
var timer, playing, signal = false;

var playNotes = function(segment, current, osc) {
	if (current >= segment.length) {
		signal = 'end';
		return;
	}
	var rhythm = dudu.rhythm,
		breath = dudu.breath,
		wave = dudu.wave,
		destination = dudu.destination;
	var slices = segment[current].match(regex);
	var note = slices[1];
	var rate = 0;
	var continuation = !!slices[4];
	switch (slices[2]) {
		case undefined: break;
		case '=': rate = 0.25; break;
		case '_': rate = 0.5; break;
		case '.': rate = 1.5; break;
		case '~': rate = 2; break;
		default: rate = slices[3]; break;
	}
	if (rate) rhythm = rate * (rhythm + breath) - breath;
	var created = !osc
	if (created) {
		var osc = context.createOscillator();
		osc.type = wave;
	}
	if (typeof notes[note] !== 'undefined')  {
		osc.frequency.value = notes[note];
		if (created) osc.start();
		osc.connect(destination);
		playing = osc;
	}
	timer = setTimeout(function(){
		if (continuation) {
			setTimeout(function() {
				osc.disconnect();
				timer = dudu.transition === 'smooth' ?
					playNotes(segment, current + 1, osc) :
					playNotes(segment, current + 1);
			}, breath);
		} else {
			osc.disconnect();
			setTimeout(function() {
				timer = playNotes(segment, current + 1);
			}, breath);
		}
	}, rhythm);
	return timer;
}

var encodeWAV = function(wave) {
	var frequency = context.sampleRate;
	var pointSize = 16;
	var channelNumber = 1;
	var blockSize = channelNumber * pointSize / 8;
	var length = wave.length * pointSize / 8;
	var buffer = new Uint8Array(length + 44);
	var view = new DataView(buffer.buffer);
	buffer.set(new Uint8Array([0x52, 0x49, 0x46, 0x46])); // "RIFF"
	view.setUint32(4, wave.length >> 10, true); // one per `audioprocess`
	buffer.set(new Uint8Array([0x57, 0x41, 0x56, 0x45]), 8); // "WAVE"
	buffer.set(new Uint8Array([0x66, 0x6D, 0x74, 0x20]), 12); // "fmt "
	view.setUint32(16, 16, true); // WAV head
	view.setUint16(20, 1, true); // encode type
	view.setUint16(22, channelNumber, true); // channel number
	view.setUint32(24, frequency, true); // frequency
	view.setUint32(28, frequency * blockSize, true); // byte per second
	view.setUint16(32, blockSize, true); // block size
	view.setUint16(34, pointSize, true); // point size
	buffer.set(new Uint8Array([0x64, 0x61, 0x74, 0x61]), 36); // "data"
	view.setUint32(40, length, true); // data length
	buffer.set(new Uint8Array(new Int16Array(wave).buffer), 44); // data
	return new Blob([buffer], {type: "audio/wav"});
}

var downloadBlob = function(blob, filename) {
	var link = document.createElement('a');
	link.href = window.URL.createObjectURL(blob);
	link.download = filename;
	link.click();
	window.URL.revokeObjectURL(link.href);
}

var dudu = {
	rhythm: 300,
	breath: 30,
	wave: 'square',
	transition: 'normal',
	melody: {},
	clock: 0,
	destination: context.destination,
	recorder: [],
	keyboard: function() {
		var oscillators = {};
		for (var key in keybinding) {
			var freq = notes[keybinding[key]];
			var osc = context.createOscillator();
			osc.frequency.value = freq;
			osc.type = this.wave;
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
			music: args.join(' ')
		}
	},
	sing: function(title) {
		var melody = this.melody[title];
		if (!melody) return;
		this.rest();
		this.rhythm = melody.rhythm;
		this.croon(melody.music);
	},
	record: function(title, callback) {
		var _this = this
		this.recorder = [];
		this.destination = context.createScriptProcessor(1024, 1, 1);
		this.destination.connect(context.destination);
		this.destination.onaudioprocess = function(e) {
			if (signal === 'end') {
				_this.destination.disconnect();
				_this.destination = context.destination;
				var blob = encodeWAV(_this.recorder);
				downloadBlob(blob, title + '.wav');
				callback && callback();
				return signal = false;
			}
			e.inputBuffer.getChannelData(0).forEach(function(input) {
				_this.recorder.push(input * 0x8000 | 0)
			})
		}
		this.sing(title);
	},
	rest: function() {
		timer && clearTimeout(timer);
		playing && playing.disconnect();
	}
}

window.dudu = dudu;

})()
