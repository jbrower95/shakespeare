function clamp(a, b, c) {
	// inclusive clamp
	if (a < b) { return b; }
	if (a > c) { return c; }
	return a;
}

var char_faces = {};
var char_lefts = {};

$(document).ready(function() {
	setupScript("hamlet");
});

function setupScript(play) {
	if (ScriptBud.init()) {
		// Browser is supported. 
		ScriptBud.loadScript(play);

		let characters = ScriptBud.getCharacters();

		let padding = 200 + 338;

		/* Generate a bunch of faces. */
		characters.forEach(function(character) {
			char_faces[character] = faces.generate();
			char_lefts[character] = Math.ceil(((Math.random() * $(window).width()) + padding) - padding);
		});

		ScriptBud.readAs("bernardo");
		ScriptBud.onCharacterSpeak(function(character) {
			faces.display("charDiv", char_faces[character]);
			$("#charName").text(character);
			$("#charDiv").css("left", char_lefts[character]);
			$("#charName").css("left", char_lefts[character]);
		});
	} else {
		// Browser unsupported.
		alert('Browser unsupported. Please use chrome.');
	}
}


let playing = null;

$("body").click(function(){
	/* pause / start */
	if (!ScriptBud.isPlaying()) {
		if (playing == null) {
			ScriptBud.start();
			playing = 1;
		} else {
			ScriptBud.resume();
			$("#character").css("opacity", 1);
		}
	} else {
		ScriptBud.stop();
		$("#character").css("opacity", .4);
	}
});

