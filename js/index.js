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
	console.log(e.keyCode);
    if (e.keyCode == 27) { // escape key maps to keycode `27`
    	if (!SHOWING_MODAL) {
    		showModal();
    	} else {
    		hideModal();
    	}
    	SHOWING_MODAL = !SHOWING_MODAL;
    }
    if (e.keyCode == 39) {
    	// -->
    	if (ScriptBud.isPlaying()) {
    		// next
    		ScriptBud.next();
    	} else {
    		ScriptBud.previous();
    	}
    } 
    if (e.keycode == 37) {
    	// <--
    }
});

var modal = null;

function list2datalist(id, values) {
	// ret: HTML element (datalist).
	let datalist = document.createElement("datalist");
	datalist.id = id;

	values.forEach(function(obj) {
		let elt = document.createElement("option");
		elt.value = obj;
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
	menu.style.top = 0;
	menu = $(menu);

	let innermenu = document.createElement("div");
	innermenu.style.background = "rgba(0, 0, 0, .8)";
	innermenu.style.width = "400px";
	innermenu.style.height = "400px";
	innermenu.style.display = "flex";
	innermenu.style.flexDirection = "column";
	innermenu.style.alignItems = "center";
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
	let choice = document.createElement("input");
	choice.id = "__choosePlay";
	choice.style.display = "block";
	choice.style.width = "150px";
	choice.setAttribute('list', 'plays');
	choice.setAttribute('type', 'dropdown');
	choice.style.margin = "20px";

	innermenu.append(list2datalist("plays", Object.keys(plays)));
	innermenu.append(choice);

	$(function() {
	  $("#__choosePlay").on("change",function() {
	    var val = this.value;
	    if (val=="") return; // please select - possibly you want something else here

	    //		Choose character: <character>
	    if (plays[val]) {
			let characters = plays[val]["characters"];
			let data = $(list2datalist("plays", characters, true));
			$("#characters").empty();
			data.children().each(function(idx, child) {
				$("#characters").append(child);
			});
		}
	  }); 
	});

	let choice2 = document.createElement("input");
	choice2.id = "__chooseCharacter";
	choice2.style.display = "block";
	choice2.style.width = "150px";
	choice2.style.margin = "15px";
	choice2.setAttribute('list', 'characters');
	choice2.setAttribute('type', 'dropdown');
	choice2.style.margin = "20px";
	choice2 = $(choice2);
	
	innermenu.append($(list2datalist("characters", [])));
	innermenu.append(choice2);

	/* finally, the OK button. */
	let ok = document.createElement("button");
	ok.innerHTML = "Start";
	ok.style.width = "150px";
	ok.style.height = "40px";
	ok.style.margin = "7px";
	$(ok).click(function() {

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
	}
	$("#fullpage").append(modal);
}

function hideModal() {
	modal.remove();
}

function openCurtain() {
	let left = $("#curtain_left");
	let right = $("#curtain_right");

	left.animate({
		left: -500
	}, 2000);

	right.animate({
		right: -500
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


// $("body").click(function(){
// 	if (!SHOWING_MODAL) {
// 		if (!ScriptBud.isPlaying()) {
// 			if (playing == null) {
// 				ScriptBud.start();
// 				playing = 1;
// 			} else {
// 				ScriptBud.resume();
// 				$("#character").css("opacity", 1);
// 			}
// 		} else {
// 			ScriptBud.stop();
// 			$("#character").css("opacity", .4);
// 		}
// 	}
// });


