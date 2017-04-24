/* relies on <ResponsiveVoice.JS> */
var ScriptBud = {
	init: function(script, htmlElement) {
		this.humans = [];
		this.script = null;
		this.stopped = true;
		this.timeout = 6000;
		
		if (typeof SpeechRecognition === "undefined" && typeof webkitSpeechRecognition === "undefined") {
			console.error("[scriptbud] No speech recognition available in this browser. The plugin will not function. (Try chrome).");
			return false;
		}
		
		this.SpeechRecognition = webkitSpeechRecognition || SpeechRecognition;
		this.SpeechGrammarList = webkitSpeechGrammarList || SpeechGrammarList;
		this.SpeechRecognitionEvent = webkitSpeechRecognitionEvent || SpeechRecognitionEvent;

		this.waiting = false;

		return true;
	},

	getCharacters: function() {
		return this.script["characters"];
	},

	onCharacterSpeak: function(cb) {
		this.onCharacterSpeak = cb;
	},

	onLine: function(cb) {
		this.onLine = cb;
	},

	loadScript: function(script) {
		this.script = plays[script];
		this.voices = {};

		/* map a voice for each character */
		let roles = ["UK English Female", "UK English Male", "US English Female"];

		for (let idx in this.script["characters"]) {
			let character = this.script["characters"][idx];
			let pitch = Math.floor((Math.random() * 4) + 1);
			let role = roles[Math.floor(Math.random() * roles.length)]
			this.voices[character] = function(t, onEnd) {
				console.log("[" + character + "]: " + t);
				responsiveVoice.speak(t, role, {pitch: pitch, onend: onEnd});
			};
		}
		console.log("[scriptbud] Loaded voices.");

		this.currentIdx = 0; // real index into the play.
		this.currentLine = 0; // play line number.
	},

	readAs: function(character) {
		this.humans.push(character)
	},

	__timeoutAfter: function(amt) {
		console.log("[line] [info] Will time out after " + amt + "ms");
		let currentLine = this.currentIdx;
		this.recv = false;
		this._timeout_id = setTimeout($.proxy(function() {
			console.log("Checking...");
			if (this.currentIdx === currentLine) {
				console.log("Checking for timeout...");
				/* nothing has changed. */
				if (!this.recv) {
					console.log("[error] Line timed out.");
					this.step();
				} else {
					console.log("[error] false timeout.");
					this.recv = false;
				}
			}
		}, this), amt);
	},

	__cancelTimeout: function() {
		if (this._timeout_id) {
			clearTimeout(this._timeout_id);
			this._timeout_id = null;
		}
	},

	__processSpeech: function(e) {

		if (!this.waiting) {
			/* whoops */
			return;
		}

		/* Indicate for timeout that we have received something. */
		this.recv = true;
		this.__cancelTimeout();

		let currentLine = this.script["lines"][this.currentIdx]["content"];

		/* Get rid of all '[' ']' crap. */
		let expected = currentLine.replace(/\s*\[.*?\]\s*/g, '');

		let got = e["results"];
		if (got) {
			console.log(got);
			
			/* see how they compare to the line. */
			let words = currentLine
				.replace(/[^\w\s]|_/g, "")
         		.replace(/\s+/g, " ")
         		.split(/[ ,]+/)
         		.slice(this.wordTicker);

			let hits = 0;
			let lastHit = -1;

			for (var l = 0; l < got.length; l++) {
	         	/* look at the words. */
				let spoken_words = got[l][0]["transcript"]
					.replace(/[^\w\s]|_/g, "")
	         		.replace(/\s+/g, " ")
					.split(/[ ,]+/);
				console.log("spkn: " + spoken_words);
				console.log("waiting for: " + words);

				for (var i = 0; i < spoken_words.length; i++) {
					for (var j = 0; j < words.length; j++) {
						if (spoken_words[i].toLowerCase() == words[j].toLowerCase()) {
							hits++;
							lastHit = Math.max(j, lastHit);
						}
					}
				}
			}
			console.log("Got " + hits + " hits. (lastHit=" + lastHit + ")");

			let progress = lastHit + 1;
			this.wordTicker = this.wordTicker + progress;
			if (progress >= words.length) {
				/* Done! */
				console.log("Success");
				this.waiting = false;
				this.__startTrackingAudio(false);
				this.step();
				return;
			}

			this.__timeoutAfter(this.timeout);	
		}
	},

	__startTrackingAudio: function(on) {
		/* Build up a listener for 'audio' */
		if (!this.recognition) {
			this.recognition = new (this.SpeechRecognition)();
			this.recognition.continuous = true;
			this.recognition.interimResults = true;
			this.recognition.lang = "en-US";
			this.recognition.onresult = $.proxy(this.__processSpeech, this);
			console.log("[scriptbud] Allocated speech recognition engine.");
		}
		if (on) {
			this.recognition.start();
			console.log("[scriptbud] Started.");
		} else {
			this.recognition.stop();
		}
	},

	start: function() {
		this.currentIdx = -1; // real index into the play.
		this.currentLine = -1; // play line number.
		this.resume();
	},

	stop: function() {
		this.stopped = true;
	},

	resume: function() {
		this.stopped = false;
		this.step();
	},

	isPlaying: function() {
		return !this.stopped;
	},

	step: function() {
		/* reset some shit. */
		this.waiting = false;
		this.__startTrackingAudio(false);
		this.__cancelTimeout();
		this.wordTicker = 0;

		if (this.stopped) {
			/* cut it off. */
			return;
		}

		/* step into a line. */
		this.currentIdx++;

		let currentLine = this.script["lines"][this.currentIdx];
		let currentCharacter = currentLine["character"];

		/* callback */
		if (this.onCharacterSpeak) {
			this.onCharacterSpeak(currentCharacter);
		}

		if (this.onLine) {
			this.onLine(currentLine);
		}

		if (this.humans.includes(currentCharacter)) {
			/* Wait on the line. */
			console.log("[line] " + currentLine["content"]);
			this.__startTrackingAudio(true);
			this.__timeoutAfter(this.timeout);
			this.waiting = true;
		} else {
			/* Read the line */
			this.voices[currentCharacter](currentLine["content"], $.proxy(this.step, this));
		}
	}
};
console.log("[scriptbud] Bound.");