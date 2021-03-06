/* relies on <ResponsiveVoice.JS> */
var ScriptBud = {
	init: function(script, htmlElement, ) {
		this.humans = [];
		this.script = null;
		this.stopped = true;
		this.scoreListeners = [];
		this.timeout = 7 * 1000;
		this.score = 0;
		this.satisfaction = 50; // start halfway.
		if (this.meter) {
			this.meter.setProgress(this.satisfaction);
		}

		if (typeof SpeechRecognition === "undefined" && typeof webkitSpeechRecognition === "undefined") {
			console.error("[scriptbud] No speech recognition available in this browser. The plugin will not function. (Try chrome).");
			return false;
		}

		if (!this.boo_sound) {
			this.boo_sound = new Pizzicato.Sound('./sound/boo.mp3', function() {
			    // Sound loaded!
			    console.log("[scriptbud] Loaded audio.");
			});
		}
		
		let self = this;

		if (!this.loaded_clap_sounds) {
			this.loaded_clap_sounds = [];
			let applauses = ["applause5.mp3", "applause6.mp3", "applause7.mp3"];
			this.remaining_applauses = applauses.length;

			for (let i = 0; i < applauses.length; i++) {
				this.loaded_clap_sounds.push(new Pizzicato.Sound('./sound/' + applauses[i], function(){
					console.log("[scriptbud] Loaded " + applauses[i]);
					self.remaining_applauses = self.remaining_applauses - 1;
				}));
			}
		}

		if (!this.gameover_sound) {
			this.gameover_sound = new Pizzicato.Sound('./sound/hellodarkness.mp3', function() {
			    // Sound loaded!
			    console.log("[scriptbud] Loaded audio.");
			});
		}
		
		this.SpeechRecognition = webkitSpeechRecognition || SpeechRecognition;
		this.SpeechGrammarList = webkitSpeechGrammarList || SpeechGrammarList;
		this.SpeechRecognitionEvent = webkitSpeechRecognitionEvent || SpeechRecognitionEvent;

		this.waiting = false;

		return true;
	},

	gameover: function(then) {
		this.gameover_sound.play();
		setTimeout($.proxy(function() {
			this.gameover_sound.stop();
			then();
		},this), 15000);
	},

	onScoreChange: function(listener) {
		this.scoreListeners.push(listener);
		listener(this.satisfaction, this.score);
	},

	_scoreDidChange: function() {
		console.log("Score changed: " + this.score);
		console.log("Alerting " + this.scoreListeners.length + " listeners");
		for (let i = 0; i < this.scoreListeners.length; i++) {
			this.scoreListeners[i](this.satisfaction, this.score);
		}
	},

	useRockMeter: function(meter) {
		this.meter = meter;
	},

	boo: function() {
		if (this.boo_sound) {
			this.boo_sound.play();
		}
	},

	clap: function() {
		if (this.remaining_applauses == 0) {
			console.log("[scriptbud] Clapping.");
			let randClap = this.loaded_clap_sounds[Math.floor(Math.random() * this.loaded_clap_sounds.length)]
			randClap.play();
		}
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
		console.log("[scriptbud] Loaded script for " + script);
		console.log(this.script);
		this.voices = {};

		/* map a voice for each character */
		let roles = ["UK English Female", "UK English Male", "US English Female"];

		for (let idx in this.script["characters"]) {
			let character = this.script["characters"][idx];
			let pitch = Math.floor((Math.random() * 4) + .5);
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
				console.log("[error] Line timed out.");
				this.boo(); // BOOOOOO
				this.satisfaction -= 15;
				if (this.meter) {
					this.meter.setProgress(this.satisfaction);
				}
				this._scoreDidChange();
				this.step();
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
				// console.log("spkn: " + spoken_words);
				// console.log("waiting for: " + words);

				for (var i = 0; i < spoken_words.length; i++) {
					for (var j = 0; j < words.length; j++) {
						if (spoken_words[i].toLowerCase() == words[j].toLowerCase()) {
							hits++;
							lastHit = Math.max(j, lastHit);
						}
					}
				}
			}
			// console.log("Got " + hits + " hits. (lastHit=" + lastHit + ")");

			let progress = lastHit + 1;
			this.wordTicker = this.wordTicker + progress;
			if (progress >= words.length) {
				/* Done! */
				console.log("Success");
				this.waiting = false;
				this.__startTrackingAudio(false);

				if (Math.random() > .8) {
					// clapping every time is fkning annoying
					this.clap();
				}

				this.satisfaction += 7;
				this.score += currentLine.length * 70;
				if (this.meter) {
					this.meter.setProgress(this.satisfaction);
				}
				this._scoreDidChange();
				this.step();
				return;
			}
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

	next: function() {
		this.step();
	},

	previous: function() {
		this.currentIdx = this.currentIdx - 2;
		this.step();
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