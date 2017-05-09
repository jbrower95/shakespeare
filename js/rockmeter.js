class RockMeter {
  constructor(low, high, initial=-1) {
    this.element = document.createElement("div");
    this.element.className = "rockmeter_container";

    // listener spaces
    this.listeners = {"red" : [], "yellow" : [], "green" : []};

    /* sets the bounds for the ROCK meter. */
    this.low = low;
    this.high = high;

    /* create our element */
    this.element.appendChild(this._makeMeter());
    this.element.appendChild(this._makeIndicator());

    if (initial == -1) {
    	this.setProgress((low + high) / 2);
    } else {
    	this.setProgress(initial);
    }
  }

  _makeMeter() {
  	let meter = document.createElement("img");
  	meter.src = "rockmeter/rockmeter_yellow.png";
  	meter.className = "rockmeter_meter";
  	this.meter = meter;
  	return meter;
  }

  onBecameYellow(callback) {
  	this.listeners["yellow"].push(callback);
  }

  onBecameGreen(callback) {
  	this.listeners["green"].push(callback);
  }

  onBecameRed(callback) {
  	this.listeners["red"].push(callback);
  }

  _makeIndicator() {
  	let indicator = document.createElement("div");
  	indicator.className = "rockmeter_indicator";
  	this.indicator = indicator;
  	return indicator;
  }

  install(intoElementWithId) {
  	let into = document.getElementById(intoElementWithId);
  	into.appendChild(this.element);
  }

  getProgress() {
  	return this.progress;
  }

  __clamp(val) {
  	if (val > this.high) {
  		val = this.high;
  	} else if (val < this.low) {
  		val = this.low;
  	}
  	return val;
  }

  _alertAllListeners(arr, val) {
  	for (let i = 0; i < arr.length; i++) {
  		arr[i](val);
  	}
  }

  _updatedProgress(old, val) {
  	if (val >= 33 && old < 33) {
  		// became green
      this.meter.src = "rockmeter/rockmeter_green.png";
  		this._alertAllListeners(this.listeners["green"], val);
  	} else if (val <= -33 && old > -33) {
  		// became red
      this.meter.src = "rockmeter/rockmeter_red.png";
  		this._alertAllListeners(this.listeners["red"], val);
  	} else if ((val > -33 && old <= -33) 
  						|| ((val < 33 && old >= 33))) {
  		// became yellow
      this.meter.src = "rockmeter/rockmeter_yellow.png";
  		this._alertAllListeners(this.listeners["yellow"], val);
  	}
  }

  _angleForProgress(val) {
  	let range = this.high - this.low;
  	let percent = (val - this.low) / range;

  	// cast into the range [0, 90]
  	let angle = percent * 110;
  	
  	// shift it down by 45 degrees into the correct range.
  	let real_angle = angle - 55;
  	return real_angle
  }

  setProgress(val) {
  	let old_progress = this.progress;
  	this.progress = this.__clamp(val);
  	
  	let old_angle = this._angleForProgress(old_progress);
  	let real_angle = this._angleForProgress(this.progress);

  	//console.log("Got angle: " + real_angle)

  	// apply the transform.
  	this.indicator.style.transform = "rotate(" + real_angle + "deg)";
  	this._updatedProgress(old_angle, real_angle);  	
  }

  remove() {
  	let parent = this.element.parentNode;
  	if (parent) {
  		parent.removeChild(this.element);
  	}
  }
}