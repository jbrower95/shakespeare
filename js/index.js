function clamp(a, b, c) {
	// inclusive clamp
	if (a < b) { return b; }
	if (a > c) { return c; }
	return a;
}

var char_faces = {};
var char_lefts = {};

$(document).ready(function() {
	showModal();
	ScriptBud.init();
});

var SHOWING_MODAL = false;

$(document).keyup(function(e) {
	// console.log(e.keyCode);
    if (e.keyCode == 27) { // escape key maps to keycode `27`
    	if (!SHOWING_MODAL) {
    		showModal();
    		closeCurtain();
    	} else {
    		hideModal();
    		openCurtain();
    	}
    	SHOWING_MODAL = !SHOWING_MODAL;
    }
    if (e.keyCode == 39) {
    	// -->
    	if (ScriptBud.isPlaying()) {
    		// next
    		ScriptBud.next();
    	} 
    } 
    if (e.keycode == 37) {
    	// <--
    	if (ScriptBud.isPlaying()) {
    		ScriptBud.previous();
    	}
    }
});

var modal = null;

function list2datalist(id, values) {
	// ret: HTML element (datalist).
	let datalist = document.createElement("datalist");
	datalist.id = id;

	let mappings = {
		"asyoulikeit" : "As you like it",
		"hamlet" : "Hamlet",
		"allswell" : "All's well that ends well",
		"tamingshrew" : "The Taming of the Shrew",
		"comedyerrors" : "A comedy of errors",
		"antonycleo" : "Antony and Cleopatra",
		"romeojuliet" : "Romeo and Juliet",
		"tempest" : "The Tempest",
		"12night" : "Twelfth Night"
	};

	values.forEach(function(obj) {
		let elt = document.createElement("option");
		elt.value = obj;
		elt.innerHTML = mappings[obj] || obj;
		datalist.append(elt);
	});
	return datalist;
}

function createModal() {

	let menu = document.createElement("div");
	menu.class = "fullpage";
	menu.style.background = "rgba(0, 0, 0, .3)";
	menu.style.display = "flex";
	menu.style.justifyContent = "center";
	menu.style.alignItems = "center";
	menu.style.width = "100%";
	menu.style.height = "100%";
	menu.style.position = "fixed";
	menu.style.left = 0;
	menu.style.zIndex = 10;
	menu.style.top = 0;
	menu = $(menu);

	let innermenu = document.createElement("div");
	innermenu.style.background = "rgba(0, 0, 0, .8)";
	innermenu.style.width = "400px";
	innermenu.style.height = "400px";
	innermenu.style.display = "flex";
	innermenu.style.flexDirection = "column";
	innermenu.style.alignItems = "center";
	innermenu.style.zIndex = 100;
	innermenu = $(innermenu);

	/* add actual options. */

	//		Shakespeare
	let header = document.createElement("h2");
	header.style.color = "white";
	header.style.width = "100%";
	header.style.textAlign = "center";
	header.innerHTML = "Shakespeare"
	innermenu.append(header);

	//		Choose play: <plays>
	let choice = document.createElement("select");
	choice.id = "__choosePlay";
	choice.style.display = "block";
	choice.style.width = "150px";
	choice.placeholder = "play name";
	choice.style.margin = "20px";
	choice = $(choice);

	$($(list2datalist("plays", Object.keys(plays))).children()).each(function(i,o) {
		choice.append(o);
	});
	innermenu.append(choice);

	$(function() {
	  $("#__choosePlay").on("change",function() {
	    var val = this.value;
	    if (val=="") return; // please select - possibly you want something else here

	    //		Choose character: <character>
	    if (plays[val]) {
			let characters = plays[val]["characters"];
			let data = $(list2datalist("plays", characters, true));
			$("#__chooseCharacter").empty();
			data.children().each(function(idx, child) {
				$("#__chooseCharacter").append(child);
			});
		}
	  }); 
	});

	let choice2 = document.createElement("select");
	choice2.id = "__chooseCharacter";
	choice2.style.display = "block";
	choice2.style.width = "150px";
	choice2.style.margin = "15px";
	choice2.placeholder = "character name";
	choice2.style.margin = "20px";
	choice2 = $(choice2);
	
	$(list2datalist("characters", [])).each(function(idx, obj) {
		choice2.append(obj);
	});

	innermenu.append(choice2);

	/* finally, the OK button. */
	let ok = document.createElement("button");
	ok.innerHTML = "Start";
	ok.style.width = "150px";
	ok.style.height = "40px";
	ok.style.margin = "7px";
	$(ok).click(function() {
		console.log("OK click.");
		let play = $("#__choosePlay").val();
		let character = $("#__chooseCharacter").val();
		
		console.log("Got play: " + play);
		console.log("Got character: " + character);

		if (!play || !plays[play]) {
			alert("Please choose a valid play from the dropdown.");
			return;
		}

		if (!character || plays[play]["characters"].indexOf(character) < 0) {
			alert("Please choose a valid character from " + play);
			return;
		} 

		/* otherwise, start reading. */
		hideModal();
		$("#charDiv").empty();
		setupScript(play, character);
		openCurtain();
		ScriptBud.clap();
		ScriptBud.start();
	});
	ok = $(ok);
	innermenu.append(ok);


	menu.append(innermenu);
	return menu;
}

function showModal() {
	if (modal == null) {
		modal = createModal();
		$("#fullpage").append(modal);
	}
	if (ScriptBud.isPlaying()) {
		ScriptBud.stop();
	}
	modal.show();
}

function hideModal() {
	modal.hide();
	if (!ScriptBud.isPlaying() && ScriptBud.currentIdx > 0) {
		ScriptBud.resume();
	}
}

function openCurtain() {
	let left = $("#curtain_left");
	let right = $("#curtain_right");

	left.animate({
		left: -800
	}, 2000);

	right.animate({
		right: -800
	}, 2000);
}

function closeCurtain() {
	let left = $("#curtain_left");
	let right = $("#curtain_right");

	left.animate({
		left: 0
	}, 2000);

	right.animate({
		right: 0
	}, 2000);
}

function setupScript(play, character) {
	if (ScriptBud.init()) {
		// Browser is supported. 
		ScriptBud.loadScript(play);
		$("#playname").text(play);

		let characters = ScriptBud.getCharacters();

		let padding = 200 + 400;

		/* Generate a bunch of faces. */
		char_faces = {};
		char_lefts = {};
		characters.forEach(function(character) {
			char_faces[character] = faces.generate();
			char_lefts[character] = Math.ceil(((Math.random() * $(window).width()) + padding) - padding);
		});

		ScriptBud.readAs(character);
		ScriptBud.onLine(function(line) {

			let content = line["content"];
			let line_no = line["line"];

			if (line_no) {
				$("#currentLineNo").text(line_no);
			}

			$("#currentLineText").text(content);
		});
		ScriptBud.onCharacterSpeak(function(character) {
			if (char_faces[character]) {
				faces.display("charDiv", char_faces[character]);
				$("#charName").text(character);
				$("#charDiv").css("left", char_lefts[character]);
				$("#charName").css("left", char_lefts[character]);
			} else {
				console.error("No face bound for " + character);
			}
		});
	} else {
		// Browser unsupported.
		alert('Browser unsupported. Please use chrome.');
	}
}

let playing = null;


